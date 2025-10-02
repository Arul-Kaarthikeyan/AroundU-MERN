// server/index.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_this";
const LOCATION_RADIUS_METERS = parseInt(process.env.RADIUS_METERS || "500"); // default 500m
const LOCATION_STALE_MS = 3 * 60 * 1000; // 3 minutes

app.use(cors());
app.use(express.json());

// --- Mongoose models ---
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost:27017/nearbychat",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  displayName: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lon, lat]
  },
  lastSeen: { type: Date, default: null },
});
UserSchema.index({ location: "2dsphere" });
const User = mongoose.model("User", UserSchema);

const ChatRoomSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
});
ChatRoomSchema.index({ participants: 1 });
const ChatRoom = mongoose.model("ChatRoom", ChatRoomSchema);

const MessageSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom" },
  senderId: { type: Schema.Types.ObjectId, ref: "User" },
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", MessageSchema);

function signToken(user) {
  return jwt.sign({ sub: user._id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

async function getUserFromToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function distanceMetersBetweenCoords(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Auth routes ---
app.post("/api/signup", async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "username+password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const u = new User({ username, passwordHash: hash, displayName });
    await u.save();
    const token = signToken(u);
    res.json({
      token,
      user: { id: u._id, username: u.username, displayName: u.displayName },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "username might be taken" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const u = await User.findOne({ username });
  if (!u) return res.status(401).json({ error: "invalid" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid" });
  const token = signToken(u);
  res.json({
    token,
    user: { id: u._id, username: u.username, displayName: u.displayName },
  });
});

// --- Location update ---
app.post("/api/location", getUserFromToken, async (req, res) => {
  const { lat, lon } = req.body;
  if (typeof lat !== "number" || typeof lon !== "number")
    return res.status(400).json({ error: "lat/lon required" });
  const u = req.user;
  u.location = { type: "Point", coordinates: [lon, lat] };
  u.lastSeen = new Date();
  await u.save();
  res.json({ ok: true });
});

// --- Discover nearby users ---

app.get("/api/nearby", getUserFromToken, async (req, res) => {
   const radius = parseInt(req.query.radius || LOCATION_RADIUS_METERS);
   const user = await User.findById(req.user._id);
   if (!user || !user.location || !user.location.coordinates)
     return res.json({ nearby: [] });
   const [lon, lat] = user.location.coordinates;
  // find other users within radius and lastSeen within threshold
  const cutoff = new Date(Date.now() - LOCATION_STALE_MS);
  const nearby = await User.find({
    _id: { $ne: user._id },
    lastSeen: { $gte: cutoff },
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
        $maxDistance: radius,
      },
    },
  }).select("displayName username lastSeen location");
  res.json({ nearby });
});

app.post("/api/logout", getUserFromToken, async (req, res) => {
  req.user.lastSeen = null;
  req.user.location = null;
  await req.user.save();
  res.json({ ok: true });
});


// --- Find or create chat room ---
app.post("/api/room", getUserFromToken, async (req, res) => {
  const otherId = req.body.otherId;
  if (!otherId) return res.status(400).json({ error: "otherId required" });
  const a = req.user._id;
  const b = otherId;
  // normalize sort to ensure single room
  const participants = [a.toString(), b.toString()].sort();
  let room = await ChatRoom.findOne({ participants });
  if (!room) {
    room = await ChatRoom.create({ participants });
  }
  const messages = await Message.find({ roomId: room._id })
    .sort({ createdAt: 1 })
    .limit(100);
  res.json({ roomId: room._id, messages });
});

app.get("/api/previousRooms", getUserFromToken, async (req, res) => {
  const rooms = await ChatRoom.find({ participants: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "displayName username");
  res.json({ rooms });
});

// --- Socket.io for real-time chat ---
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Auth error"));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(new Error("Auth error"));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Auth error"));
  }
});

io.on("connection", (socket) => {
  const uid = socket.user._id.toString();
  console.log("socket connected", uid);

  // join rooms that client requests
  socket.on("joinRoom", async ({ roomId }) => {
    // verify participant
    const room = await ChatRoom.findById(roomId);
    if (!room) return;
    if (!room.participants.map(String).includes(uid)) return;
    socket.join(roomId.toString());
  });

  // client sends message via socket
  socket.on("sendMessage", async ({ roomId, text }) => {
    if (!text) return;
    const room = await ChatRoom.findById(roomId);
    if (!room) return socket.emit("error", "no room");

    if (!room.participants.map(String).includes(uid))
      return socket.emit("error", "not in room");
    // load participants' current locations and enforce distance (same as REST)
    const participants = room.participants;
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== 2) return socket.emit("chaterror", "invalid participants");

    const [u1, u2] = users;
    const cutoff = Date.now() - LOCATION_STALE_MS;
    if (
      !u1.lastSeen ||
      !u2.lastSeen ||
      u1.lastSeen.getTime() < cutoff ||
      u2.lastSeen.getTime() < cutoff
    ) {
      return socket.emit("chaterror", "User is disconnected");
    }
    const d = distanceMetersBetweenCoords(
      u1.location.coordinates[1],
      u1.location.coordinates[0],
      u2.location.coordinates[1],
      u2.location.coordinates[0]
    );
    if (d > LOCATION_RADIUS_METERS) return socket.emit("chaterror", "User is too far ! ");

    const m = await Message.create({ roomId, senderId: socket.user._id, text });
    room.lastMessageAt = new Date();
    await room.save();

    io.to(roomId.toString()).emit("message", {
      _id: m._id,
      roomId,
      senderId: m.senderId,
      text: m.text,
      createdAt: m.createdAt,
    });
  });

  socket.on("disconnect", () => {
    console.log("socket disconnect", uid);
  });
});

// --- Simple protected route to get current user ---
app.get("/api/me", getUserFromToken, (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    username: u.username,
    displayName: u.displayName,
    lastSeen: u.lastSeen,
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
