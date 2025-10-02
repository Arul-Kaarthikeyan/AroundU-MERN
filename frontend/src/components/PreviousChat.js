import React, { useState, useEffect } from "react";
import { API } from "../api";

export default function PreviousChat({ token, onOpenRoom, you }) {
  const [rooms, setRooms] = useState([]);

  async function fetchPreviousRooms() {
    const res = await fetch(`${API}/api/previousRooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    setRooms(j.rooms || []);
  }

  useEffect(() => {
    fetchPreviousRooms();
  }, []);

  async function startChatWith(otherUser) {
    const res = await fetch(`${API}/api/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otherId: otherUser._id}),
    });
    const j = await res.json();
    onOpenRoom(j.roomId, j.messages, otherUser);
  }

  return (
    <div>
      {rooms.length === 0 && (
        <center>
          <div className="no-item">No chats so far</div>
        </center>
      )}
      <div>
        {rooms.map((room) => {
          const otherUser = room.participants.find((p) => p._id !== you.id);
          return (
            <p
              key={room._id}
              onClick={() => startChatWith(otherUser)}
              className="user-card"
            >
              {otherUser.displayName} <br></br>
              <span className="username">username : {otherUser.username}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
