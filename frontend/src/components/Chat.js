import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API } from "../api";

export default function Chat({ token, roomId, initialMessages, onBack, you , otherUser}) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState(initialMessages || []);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  useEffect(() => {
    const s = io(API, { auth: { token } });
    s.on("connect", () => s.emit("joinRoom", { roomId }));
    s.on("message", (m) => {
      if (m.roomId === roomId) setMessages((prev) => [...prev, m]);
    });
    s.on("chaterror", (err) => {
      alert("Cannot send message : "+ err);
    });
    setSocket(s);
    return () => s.disconnect();
  }, [roomId, token]);

  function send() {
    if (!text) return;
    socket.emit("sendMessage", { roomId, text });
    setText("");
  }

  return (
    <div className="chat-container">
      <div className="chat-header-row">
          <div className="user-info-stacked">
            <span className="display-name-stacked">
              {otherUser.displayName}
              <span className="username">username : {otherUser.username}</span>
            </span>
          </div>
        <button onClick={onBack} className="back-btn">
          Back
        </button>
      </div>
      <div className="messages-box">
        {messages.map((m) => {
          const isYou = m.senderId === you.id;
          return (
            <div
              key={m._id}
              className={`message-row ${isYou ? "sent" : "received"}`}
            >
              <div className="message-bubble"> {m.text}</div>
            </div>
          );
        })}
        {/* Dummy div at the bottom for autoscroll */}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input-area">
        {" "}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="message-input"
        />
        <button onClick={send} className="send-btn">
          Send
        </button>
      </div>
    </div>
  );
}
