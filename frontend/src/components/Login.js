import React, { useState } from "react";
import { API } from "../api";

export default function Login({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
    });
    const j = await res.json();
    if (j.token) onLogin(j.token);
    else alert("Login failed : Invalid credentials");
  }

  return (
    <form onSubmit={submit}>
      <input
        value={u}
        onChange={(e) => setU(e.target.value)}
        placeholder="username"
      />
      <input
        value={p}
        onChange={(e) => setP(e.target.value)}
        placeholder="password"
        type="password"
      />
      <button>Login</button>
    </form>
  );
}
