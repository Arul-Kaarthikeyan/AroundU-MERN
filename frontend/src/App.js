import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Chat from "./components/Chat";
import ChatLists from "./components/ChatLists"; 
import Logout from "./components/Logout";
import { API } from "./api";
import "./App.css"; 

export default function App() {
  const auth = useAuth();
  const [view, setView] = useState("login");
  const [room, setRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [profile, setProfile] = useState({});
  const [otherUser, setOtherUser] = useState({});

  async function fetchProfile() {
    const res = await fetch(`${API}/api/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const user = await res.json();
    setProfile(user);
  }

  useEffect(() => {
    if (!auth.token) return;
    let watchId = null;

    async function sendLocation(lat, lon) {
      await fetch(`${API}/api/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ lat, lon }),
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        sendLocation(p.coords.latitude, p.coords.longitude);
      });
      watchId = navigator.geolocation.watchPosition(
        (p) => sendLocation(p.coords.latitude, p.coords.longitude),
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
      );
      fetchProfile();
    }

    return () => {
      if (watchId !== null && navigator.geolocation)
        navigator.geolocation.clearWatch(watchId);
    };
  }, [auth.token]);

  // --- Not logged in ---
  if (!auth.token) {
    return (
      <div className="auth-container">
        <h2 className="app-title" style={{padding:'10px'}}>Around U</h2>
        {view === "login" ? (
          <Login
            onLogin={(t) => {
              auth.save(t);
              setView("main");
            }}
          />
        ) : (
          <Signup
            onLogin={(t) => {
              auth.save(t);
              setView("main");
            }}
          />
        )}
        <button
          className="switch-btn"
          onClick={() => setView(view === "login" ? "signup" : "login")}
        >
          {view === "login"
            ? "Need an account? Signup"
            : "Have an account? Login"}
        </button>
      </div>
    );
  }

  // --- Chat view ---
  if (room) {
    return (
      <div className="chat-screen">
        <Chat
          token={auth.token}
          roomId={room}
          initialMessages={roomMessages}
          onBack={() => setRoom(null)}
          you={profile}
          otherUser= {otherUser}
        />
      </div>
    );
  }

  // --- Main (Nearby + Previous toggle) ---
  return (
    <div className="main-container">
      <header className="app-header-responsive">
        <div className="header-top-row">
          <h2 className="app-title">Around U</h2>
          <Logout />
        </div>

        <div className="user-info-stacked">
          <span className="display-name-stacked">
            {profile.displayName}
            <span className="username">username : {profile.username}</span>
          </span>
        </div>
      </header>
      <hr
        style={{
          border: "none",
          height: "2px",
          backgroundColor: "#2ecc71",
          margin: "10px 0",
          width: "100%",
        }}
      />
      <ChatLists
        token={auth.token}
        onOpenRoom={(roomId, messages, otherUser) => {
          setRoom(roomId);
          setRoomMessages(messages || []);
          setOtherUser(otherUser || {});
        }}
        you={profile}
      />
    </div>
  );
}
