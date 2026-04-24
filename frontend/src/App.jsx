import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LeftSidebar from "./components/layout/LeftSidebar";
import RequestBuilder from "./components/request/RequestBuilder";
import ResponsePanel from "./components/request/ResponsePanel";
import EnvironmentModal from "./components/environment/EnvironmentModal";
import api from "./services/api.service";

let _id = 0;
function uid() { return `${Date.now()}-${++_id}`; }
function emptyRow() { return { id: uid(), key: "", value: "", enabled: true }; }

export function createTab(overrides = {}) {
  return {
    id: uid(),
    name: "New Request",
    method: "GET",
    url: "",
    params: [emptyRow()],
    headers: [emptyRow()],
    auth: {
      type: "none",
      bearer: { token: "" },
      basic: { username: "", password: "" },
      apikey: { key: "X-API-Key", value: "", in: "header" },
    },
    body: { type: "none", raw: "", rawType: "json", formData: [emptyRow()] },
    activeRequestTab: "params",
    response: null,
    loading: false,
    ...overrides,
  };
}

function resolveVars(text, vars) {
  if (!text || !vars?.length) return text;
  return String(text).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const v = vars.find(v => v.key.trim() === key.trim() && v.enabled !== false);
    return v ? v.value : `{{${key}}}`;
  });
}

/* ===== Loading Screen ===== */
function LoadingScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg0)", flexDirection: "column", gap: 16,
    }}>
      <div className="logo-icon" style={{ width: 48, height: 48, fontSize: 24 }}>A</div>
      <div style={{ color: "var(--text2)", fontSize: 14 }}>Loading API Studio…</div>
    </div>
  );
}

/* ===== Main app (shown after login) ===== */
function MainApp() {
  const { user, guestMode, logout } = useAuth();
  const [tabs, setTabs]             = useState(() => [createTab()]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id || "");
  const [environments, setEnvironments] = useState([]);
  const [activeEnvId, setActiveEnvId]   = useState("");
  const [envModalOpen, setEnvModalOpen] = useState(false);
  const [leftPanel, setLeftPanel]       = useState("collections");

  useEffect(() => {
    api.get("/environments").then(r => setEnvironments(r.data || [])).catch(() => {});
  }, []);

  const activeEnvVars = environments.find(e => e.id === activeEnvId)?.variables || [];

  const addTab = useCallback(() => {
    const t = createTab();
    setTabs(prev => [...prev, t]);
    setActiveTabId(t.id);
  }, []);

  const closeTab = useCallback((id) => {
    setTabs(prev => {
      if (prev.length === 1) {
        const fresh = createTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      setActiveTabId(cur => cur === id ? (next[Math.max(0, idx - 1)]?.id || next[0]?.id) : cur);
      return next;
    });
  }, []);

  const updateTab = useCallback((id, changes) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
  }, []);

  const loadRequest = useCallback((requestData) => {
    const t = createTab({
      name: requestData.name || requestData.url || "Loaded",
      method: requestData.method || "GET",
      url: requestData.url || "",
    });
    const hdrs = requestData.headers;
    if (hdrs && typeof hdrs === "object" && !Array.isArray(hdrs)) {
      t.headers = [...Object.entries(hdrs).map(([key, value]) => ({ id: uid(), key, value, enabled: true })), emptyRow()];
    }
    if (requestData.body && requestData.body !== "null") {
      const bodyStr = typeof requestData.body === "string" ? requestData.body : JSON.stringify(requestData.body, null, 2);
      t.body = { type: "json", raw: bodyStr, rawType: "json", formData: [emptyRow()] };
    }
    const prms = requestData.params;
    if (prms && typeof prms === "object" && !Array.isArray(prms)) {
      t.params = [...Object.entries(prms).map(([key, value]) => ({ id: uid(), key, value, enabled: true })), emptyRow()];
    }
    setTabs(prev => [...prev, t]);
    setActiveTabId(t.id);
  }, []);

  const sendRequest = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    const vars = activeEnvVars;
    const resolvedUrl = resolveVars(tab.url, vars);

    const paramsObj = {};
    tab.params.filter(p => p.enabled && p.key.trim()).forEach(p => {
      paramsObj[resolveVars(p.key, vars)] = resolveVars(p.value, vars);
    });

    const headersObj = {};
    tab.headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
      headersObj[resolveVars(h.key, vars)] = resolveVars(h.value, vars);
    });

    const auth = tab.auth;
    if (auth.type === "bearer" && auth.bearer.token) {
      headersObj["Authorization"] = `Bearer ${auth.bearer.token}`;
    } else if (auth.type === "basic" && auth.basic.username) {
      headersObj["Authorization"] = `Basic ${btoa(`${auth.basic.username}:${auth.basic.password}`)}`;
    } else if (auth.type === "apikey" && auth.apikey.key && auth.apikey.value) {
      if (auth.apikey.in === "header") headersObj[auth.apikey.key] = auth.apikey.value;
      else paramsObj[auth.apikey.key] = auth.apikey.value;
    }

    let bodyData = null;
    const btype = tab.body.type;
    if (btype === "json" && tab.body.raw.trim()) {
      try { bodyData = JSON.parse(tab.body.raw); } catch { bodyData = tab.body.raw; }
      headersObj["Content-Type"] = headersObj["Content-Type"] || "application/json";
    } else if (btype === "text" && tab.body.raw.trim()) {
      bodyData = tab.body.raw;
      headersObj["Content-Type"] = headersObj["Content-Type"] || "text/plain";
    } else if ((btype === "form-data" || btype === "urlencoded") && tab.body.formData.length) {
      const obj = {};
      tab.body.formData.filter(f => f.enabled && f.key.trim()).forEach(f => { obj[f.key] = f.value; });
      bodyData = obj;
    }

    updateTab(tabId, { loading: true, response: null });
    try {
      const resp = await api.post("/proxy", { url: resolvedUrl, method: tab.method, headers: headersObj, params: paramsObj, body: bodyData });
      const response = { ...resp.data, size: JSON.stringify(resp.data.body ?? "").length };
      updateTab(tabId, { loading: false, response });

      try {
        const url = new URL(resolvedUrl.startsWith("http") ? resolvedUrl : `https://${resolvedUrl}`);
        const autoName = `${tab.method} ${url.pathname || "/"}`;
        setTabs(prev => prev.map(t => t.id === tabId && t.name === "New Request" ? { ...t, name: autoName } : t));
      } catch {}

      api.post("/history", { url: resolvedUrl, method: tab.method, headers: headersObj, params: paramsObj, body: bodyData, response }).catch(() => {});
    } catch (err) {
      updateTab(tabId, { loading: false, response: { status: 0, statusText: "Error", headers: {}, body: { error: err.message }, time: 0, size: 0 } });
    }
  }, [tabs, activeEnvVars, updateTab]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="app-wrapper">
      {/* ===== TopBar ===== */}
      <div className="topbar">
        <div className="topbar-logo">
          <div className="logo-icon">A</div>
          <span>API Studio</span>
        </div>
        <div className="topbar-spacer" />
        <div className="topbar-env">
          <label>Environment:</label>
          <select className="env-select" value={activeEnvId} onChange={e => setActiveEnvId(e.target.value)}>
            <option value="">No Environment</option>
            {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
          </select>
          <button className="btn-manage-env" onClick={() => setEnvModalOpen(true)}>⚙ Manage Envs</button>
        </div>

        {/* User area */}
        <div className="topbar-user">
          {user ? (
            <>
              {user.picture
                ? <img src={user.picture} className="user-avatar" alt={user.name} referrerPolicy="no-referrer" />
                : <div className="user-avatar-placeholder">{(user.name || user.email)[0].toUpperCase()}</div>
              }
              <span className="user-name">{user.name || user.email}</span>
              <button className="btn-logout" onClick={logout} title="Sign out">Sign Out</button>
            </>
          ) : (
            <span className="guest-label">Guest Mode</span>
          )}
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="app-body">
        <LeftSidebar
          leftPanel={leftPanel}
          setLeftPanel={setLeftPanel}
          onLoadRequest={loadRequest}
          activeEnvId={activeEnvId}
          setActiveEnvId={setActiveEnvId}
          environments={environments}
          setEnvironments={setEnvironments}
        />
        <div className="main-area">
          <div className="tab-bar">
            {tabs.map(tab => (
              <div key={tab.id} className={`tab-item ${tab.id === activeTabId ? "active" : ""}`} onClick={() => setActiveTabId(tab.id)}>
                <div className={`tab-method-dot ${tab.method}`} />
                <span className="tab-name">{tab.name}</span>
                <button className="tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id); }}>×</button>
              </div>
            ))}
            <button className="new-tab-btn" onClick={addTab} title="New request">+</button>
          </div>
          {activeTab && (
            <div className="request-area">
              <RequestBuilder tab={activeTab} updateTab={changes => updateTab(activeTab.id, changes)} onSend={() => sendRequest(activeTab.id)} envVars={activeEnvVars} />
              <ResponsePanel response={activeTab.response} loading={activeTab.loading} />
            </div>
          )}
        </div>
      </div>

      {envModalOpen && (
        <EnvironmentModal environments={environments} setEnvironments={setEnvironments} onClose={() => setEnvModalOpen(false)} />
      )}
    </div>
  );
}

/* ===== Root: wraps with AuthProvider and handles login gate ===== */
function AppContent() {
  const { user, loading, guestMode } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user && !guestMode) return <LoginPage />;
  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
