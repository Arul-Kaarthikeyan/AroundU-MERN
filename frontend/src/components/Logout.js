import React from 'react'
import { useAuth } from "../hooks/useAuth";
import { API } from "../api";


const Logout = () => {
  const auth = useAuth();
  const handler = async () => {
    await fetch(`${API}/api/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    auth.clear();
    window.location.reload();
  };
  
  return (
    <button className='logout-btn' onClick={handler}>Logout</button>
  )
}

export default Logout
