import React, { useState, useEffect } from "react";
import { API } from "../api";

export default function NearbyList({ token, onOpenRoom }) {
  const [nearby, setNearby] = useState([]);

  async function fetchNearby() {
    const res = await fetch(`${API}/api/nearby`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await res.json();
    setNearby(j.nearby || []);
  }

  async function startChatWith(otherUser) {
    const res = await fetch(`${API}/api/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ otherId: otherUser._id }),
    });
    const j = await res.json();
    onOpenRoom(j.roomId, j.messages, otherUser);
  }

  useEffect(() => {
    fetchNearby();
    const id = setInterval(fetchNearby, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {nearby.length === 0 && (
        <center>
          <div className="no-item">Nobody is around right now</div>
        </center>
      )}
      <div>
        {nearby.map((u) => (
          <p className="user-card" key={u._id} onClick={() => startChatWith(u)}>
            {u.displayName} <br></br>
            <span className="username"> username : {u.username} </span>
          </p>
        ))}
      </div>
    </div>
  );
}
