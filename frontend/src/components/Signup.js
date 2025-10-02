import React, { useState } from "react";
import { API } from "../api";

export default function Signup({ onLogin }) {
  const [u, setU] = useState(""),
    [p, setP] = useState(""),
    [d, setD] = useState("");

  async function submit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p, displayName: d }),
    });
    const j = await res.json();
    if (j.token) onLogin(j.token);
    else alert("Signup failed : "+ j.error);
  }

  return (
    <form onSubmit={submit}>
      <input
        value={u}
        onChange={(e) => setU(e.target.value)}
        placeholder="username ( it should be unique )"
      />
      <input
        value={p}
        onChange={(e) => setP(e.target.value)}
        placeholder="password"
        type="password"
      />
      <input
        value={d}
        onChange={(e) => setD(e.target.value)}
        placeholder="display name "
      />
      <button>Signup</button>
    </form>
  );
}
