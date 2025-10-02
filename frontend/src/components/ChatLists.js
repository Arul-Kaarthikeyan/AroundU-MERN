import React, { useState } from "react";
import NearbyList from "./NearbyList";
import PreviousChat from "./PreviousChat";

export default function ChatLists({ token, onOpenRoom, you }) {
  const [tab, setTab] = useState("nearby");
  return (
    <div className="chat-lists">
      <div className="tabs">
        <button
          className={tab === "nearby" ? "active" : ""}
          onClick={() => { setTab("nearby");}}
        >
          Around Me
        </button>
        <button
          className={tab === "previous" ? "active" : ""}
          onClick={() =>{setTab("previous");}}
        >
          Recent Chats
        </button>
      </div>
      <div className="tab-content scrollable-list-container">
        {" "}
        {tab === "nearby" ? (
          <NearbyList token={token} onOpenRoom={onOpenRoom} other />
        ) : (
          <PreviousChat token={token} onOpenRoom={onOpenRoom} you={you} />
        )}
      </div>
    </div>
  );
}
