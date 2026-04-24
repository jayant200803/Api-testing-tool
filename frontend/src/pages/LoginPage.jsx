import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api.service";

export default function LoginPage() {
  const { login, continueAsGuest } = useAuth();
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef          = useRef(null);
  const googleClientId        = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* Render Google Sign-In button once Google GSI script is ready */
  useEffect(() => {
    if (!googleClientId || googleClientId.includes("your-google")) return;

    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          width: "320",
        });
      }
    }

    /* Script may already be loaded or still loading */
    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(interval); init(); }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  async function handleGoogleCredential(response) {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/google", { credential: response.credential });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Google sign-in failed. Check GOOGLE_CLIENT_ID.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name };
      const res = await api.post(endpoint, body);
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const googleConfigured = googleClientId && !googleClientId.includes("your-google");

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 40, height: 40, fontSize: 20 }}>A</div>
          <h1 className="login-title">API Studio</h1>
          <p className="login-subtitle">Your Postman-like API testing workspace</p>
        </div>

        {/* Google Sign-In */}
        {googleConfigured ? (
          <div className="login-google-wrap">
            <div ref={googleBtnRef} />
          </div>
        ) : (
          <div className="login-google-missing">
            <span>⚠</span> Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>frontend/.env</code> to enable Google Sign-In
          </div>
        )}

        {googleConfigured && <div className="login-divider"><span>or</span></div>}

        {/* Email / Password Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="login-field">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="login-toggle">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => { setMode("register"); setError(""); }}>Create one</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            </>
          )}
        </div>

        {/* Guest mode */}
        <button className="login-guest-btn" onClick={continueAsGuest}>
          Continue as Guest →
        </button>
      </div>
    </div>
  );
}
