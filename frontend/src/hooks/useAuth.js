import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  function save(t) {
    localStorage.setItem("token", t);
    setToken(t);
  }

  function clear() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return { token, save, clear };
}
