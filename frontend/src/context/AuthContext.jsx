import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  /* Try to restore session from stored token */
  useEffect(() => {
    const token = localStorage.getItem("api_studio_token");
    if (token) {
      api.get("/auth/me")
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem("api_studio_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem("api_studio_token", token);
    setUser(userData);
    setGuestMode(false);
  }

  function logout() {
    localStorage.removeItem("api_studio_token");
    setUser(null);
    setGuestMode(false);
    /* Revoke Google one-tap so it doesn't auto-sign back in */
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  function continueAsGuest() {
    setGuestMode(true);
  }

  return (
    <AuthContext.Provider value={{ user, loading, guestMode, login, logout, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
