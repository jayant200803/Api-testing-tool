import React, { useState, useRef, useEffect } from "react";
import KeyValueTable from "../shared/KeyValueTable";
import api from "../../services/api.service";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLORS = {
  GET: "var(--method-get)", POST: "var(--method-post)", PUT: "var(--method-put)",
  DELETE: "var(--method-delete)", PATCH: "var(--method-patch)", HEAD: "var(--method-head)",
  OPTIONS: "var(--method-options)",
};

/* ===== Params Tab ===== */
function ParamsTab({ tab, updateTab }) {
  const activeCount = tab.params.filter(p => p.enabled && p.key).length;
  return (
    <div className="tab-content">
      {activeCount > 0 && (
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
          {activeCount} active param{activeCount > 1 ? "s" : ""} will be appended to the URL
        </div>
      )}
      <KeyValueTable
        rows={tab.params}
        onChange={rows => updateTab({ params: rows })}
        keyPlaceholder="Parameter"
        valuePlaceholder="Value"
      />
    </div>
  );
}

/* ===== Auth Tab ===== */
function AuthTab({ tab, updateTab }) {
  const { auth } = tab;

  function setAuth(changes) {
    updateTab({ auth: { ...auth, ...changes } });
  }

  return (
    <div className="tab-content">
      <div className="auth-type-row">
        <label>Auth Type:</label>
        <select className="auth-select" value={auth.type} onChange={e => setAuth({ type: e.target.value })}>
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token (JWT)</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
        </select>
      </div>

      {auth.type === "none" && (
        <p className="auth-none-msg">This request does not use any authorization.</p>
      )}

      {auth.type === "bearer" && (
        <>
          <div className="auth-field">
            <label>Token</label>
            <input
              className="auth-input"
              type="text"
              placeholder="Paste your Bearer / JWT token here…"
              value={auth.bearer.token}
              onChange={e => setAuth({ bearer: { token: e.target.value } })}
            />
          </div>
          <div className="auth-hint">
            The token will be sent as <code style={{ color: "var(--accent)" }}>Authorization: Bearer &lt;token&gt;</code>
          </div>
        </>
      )}

      {auth.type === "basic" && (
        <>
          <div className="auth-field">
            <label>Username</label>
            <input
              className="auth-input"
              placeholder="Username"
              value={auth.basic.username}
              onChange={e => setAuth({ basic: { ...auth.basic, username: e.target.value } })}
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={auth.basic.password}
              onChange={e => setAuth({ basic: { ...auth.basic, password: e.target.value } })}
            />
          </div>
          <div className="auth-hint">
            Credentials will be Base64-encoded and sent as <code style={{ color: "var(--accent)" }}>Authorization: Basic …</code>
          </div>
        </>
      )}

      {auth.type === "apikey" && (
        <>
          <div className="auth-field">
            <label>Key Name</label>
            <input
              className="auth-input"
              placeholder="e.g. X-API-Key"
              value={auth.apikey.key}
              onChange={e => setAuth({ apikey: { ...auth.apikey, key: e.target.value } })}
            />
          </div>
          <div className="auth-field">
            <label>Value</label>
            <input
              className="auth-input"
              placeholder="Your API key"
              value={auth.apikey.value}
              onChange={e => setAuth({ apikey: { ...auth.apikey, value: e.target.value } })}
            />
          </div>
          <div className="auth-field">
            <label>Add to</label>
            <select
              className="auth-select"
              value={auth.apikey.in}
              onChange={e => setAuth({ apikey: { ...auth.apikey, in: e.target.value } })}
            >
              <option value="header">Header</option>
              <option value="query">Query Param</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Headers Tab ===== */
function HeadersTab({ tab, updateTab }) {
  const activeCount = tab.headers.filter(h => h.enabled && h.key).length;
  return (
    <div className="tab-content">
      {activeCount > 0 && (
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
          {activeCount} header{activeCount > 1 ? "s" : ""} will be sent
        </div>
      )}
      <KeyValueTable
        rows={tab.headers}
        onChange={rows => updateTab({ headers: rows })}
        keyPlaceholder="Header name"
        valuePlaceholder="Value"
      />
    </div>
  );
}

/* ===== Body Tab ===== */
function BodyTab({ tab, updateTab }) {
  const { body } = tab;
  const bType = body.type;

  function setBody(changes) {
    updateTab({ body: { ...body, ...changes } });
  }

  return (
    <div className="tab-content">
      <div className="body-type-row">
        {["none", "json", "text", "form-data", "urlencoded"].map(t => (
          <label key={t} className={`body-radio-label ${bType === t ? "active" : ""}`}>
            <input type="radio" name="bodytype" value={t} checked={bType === t} onChange={() => setBody({ type: t })} />
            {t === "urlencoded" ? "x-www-form-urlencoded" : t === "none" ? "none" : t}
          </label>
        ))}
        {(bType === "json" || bType === "text") && (
          <select
            className="raw-type-select"
            value={bType}
            onChange={e => setBody({ type: e.target.value })}
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
          </select>
        )}
      </div>

      {bType === "none" && (
        <p style={{ color: "var(--text3)", fontSize: 12 }}>This request has no body.</p>
      )}

      {(bType === "json" || bType === "text") && (
        <textarea
          className="body-textarea"
          placeholder={bType === "json" ? '{\n  "key": "value"\n}' : "Enter text body…"}
          value={body.raw}
          onChange={e => setBody({ raw: e.target.value })}
          spellCheck={false}
        />
      )}

      {(bType === "form-data" || bType === "urlencoded") && (
        <KeyValueTable
          rows={body.formData}
          onChange={rows => setBody({ formData: rows })}
          keyPlaceholder="Key"
          valuePlaceholder="Value"
        />
      )}
    </div>
  );
}

/* ===== Save Dropdown ===== */
function SaveDropdown({ tab, onClose }) {
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState("");
  const [reqName, setReqName] = useState(tab.name !== "New Request" ? tab.name : "");
  const [saving, setSaving] = useState(false);
  const ref = useRef();

  useEffect(() => {
    api.get("/collections").then(r => {
      setCollections(r.data || []);
      if (r.data?.[0]) setSelectedCol(r.data[0].id);
    }).catch(() => {});

    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function save() {
    if (!selectedCol) return;
    setSaving(true);
    try {
      await api.post(`/collections/${selectedCol}/items`, {
        name: reqName || tab.url || "Untitled",
        request_data: {
          url: tab.url,
          method: tab.method,
          headers: Object.fromEntries(tab.headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value])),
          body: tab.body.type !== "none" ? (tab.body.raw || tab.body.formData) : null,
          params: Object.fromEntries(tab.params.filter(p => p.enabled && p.key).map(p => [p.key, p.value])),
        },
      });
      onClose();
    } catch (err) {
      console.error("Save to collection error", err);
    }
    setSaving(false);
  }

  return (
    <div className="save-dropdown" ref={ref}>
      <div>
        <label>Request Name</label>
        <input
          placeholder="My Request"
          value={reqName}
          onChange={e => setReqName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label>Save to Collection</label>
        <select value={selectedCol} onChange={e => setSelectedCol(e.target.value)}>
          <option value="">— select —</option>
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {collections.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--text3)" }}>No collections yet. Create one in the sidebar.</div>
      )}
      <div className="save-dropdown-btns">
        <button className="btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn-save-confirm" onClick={save} disabled={saving || !selectedCol}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ===== RequestBuilder ===== */
export default function RequestBuilder({ tab, updateTab, onSend, envVars }) {
  const [showSave, setShowSave] = useState(false);
  const reqTab = tab.activeRequestTab;

  const activeParamsCount = tab.params.filter(p => p.enabled && p.key).length;
  const activeHeadersCount = tab.headers.filter(h => h.enabled && h.key).length;
  const hasBody = tab.body.type !== "none";

  const tabs = [
    { id: "params", label: "Params", badge: activeParamsCount || null },
    { id: "auth", label: "Authorization", badge: tab.auth.type !== "none" ? "✓" : null },
    { id: "headers", label: "Headers", badge: activeHeadersCount || null },
    { id: "body", label: "Body", badge: hasBody ? "●" : null },
  ];

  return (
    <div>
      {/* URL Bar */}
      <div className="url-bar">
        <select
          className={`method-select ${tab.method}`}
          value={tab.method}
          onChange={e => updateTab({ method: e.target.value })}
          style={{ color: METHOD_COLORS[tab.method] }}
        >
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <input
          className="url-input"
          placeholder="https://api.example.com/endpoint"
          value={tab.url}
          onChange={e => updateTab({ url: e.target.value })}
          onKeyDown={e => e.key === "Enter" && onSend()}
        />

        <div className="url-bar-btns">
          <button className="btn-send" onClick={onSend} disabled={tab.loading || !tab.url.trim()}>
            {tab.loading ? <><span className="spinner" /> Sending</> : "Send"}
          </button>
          <div className="relative">
            <button className="btn-save" onClick={() => setShowSave(v => !v)}>
              Save ▾
            </button>
            {showSave && (
              <SaveDropdown tab={tab} onClose={() => setShowSave(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Request Tabs */}
      <div className="req-tabs">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`req-tab ${reqTab === t.id ? "active" : ""}`}
            onClick={() => updateTab({ activeRequestTab: t.id })}
          >
            {t.label}
            {t.badge !== null && <span className="req-tab-badge">{t.badge}</span>}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      {reqTab === "params"  && <ParamsTab  tab={tab} updateTab={updateTab} />}
      {reqTab === "auth"    && <AuthTab    tab={tab} updateTab={updateTab} />}
      {reqTab === "headers" && <HeadersTab tab={tab} updateTab={updateTab} />}
      {reqTab === "body"    && <BodyTab    tab={tab} updateTab={updateTab} />}
    </div>
  );
}
