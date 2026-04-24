import React, { useEffect, useState, useCallback } from "react";
import api from "../../services/api.service";

/* ===== Icon helpers ===== */
const ICONS = {
  collections: "🗂",
  history: "🕐",
  environments: "🌐",
};

/* ===== Method badge ===== */
function MethodBadge({ method }) {
  return <span className={`method-badge ${method?.toUpperCase() || "GET"}`}>{method || "GET"}</span>;
}

/* ===== Collections Panel ===== */
function CollectionsPanel({ onLoadRequest }) {
  const [collections, setCollections] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [itemsMap, setItemsMap] = useState({});
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api.get("/collections");
      setCollections(r.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createCollection() {
    const name = newName.trim();
    if (!name) return;
    await api.post("/collections", { name });
    setNewName("");
    load();
  }

  async function deleteCollection(id, e) {
    e.stopPropagation();
    if (!confirm("Delete collection and all its requests?")) return;
    await api.delete(`/collections/${id}`);
    setCollections(prev => prev.filter(c => c.id !== id));
    setItemsMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    if (!itemsMap[id]) {
      try {
        const r = await api.get(`/collections/${id}/items`);
        setItemsMap(prev => ({ ...prev, [id]: r.data || [] }));
      } catch (e) { console.error(e); }
    }
  }

  async function deleteItem(collectionId, itemId, e) {
    e.stopPropagation();
    await api.delete(`/collections/${collectionId}/items/${itemId}`);
    setItemsMap(prev => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).filter(i => i.id !== itemId),
    }));
  }

  const filtered = collections.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="side-panel-header">
        <span className="side-panel-title">Collections</span>
        <div className="side-panel-actions">
          <button className="icon-action-btn" title="Refresh" onClick={load}>↻</button>
        </div>
      </div>
      <div className="side-search">
        <input placeholder="Search collections…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="create-collection-row">
        <input
          placeholder="New collection name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createCollection()}
        />
        <button className="btn-create" onClick={createCollection} title="Create">+</button>
      </div>
      <div className="side-panel-content">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🗂</div>
            No collections yet
          </div>
        )}
        {filtered.map(col => {
          const isOpen = expanded[col.id];
          const items = itemsMap[col.id] || [];
          return (
            <div className="collection-block" key={col.id}>
              <div className="collection-header" onClick={() => toggleExpand(col.id)}>
                <span className={`col-chevron ${isOpen ? "open" : ""}`}>▶</span>
                <span className="col-icon">📁</span>
                <span className="col-name">{col.name}</span>
                <div className="col-actions">
                  <button
                    className="col-action-btn danger"
                    title="Delete collection"
                    onClick={e => deleteCollection(col.id, e)}
                  >🗑</button>
                </div>
              </div>
              {isOpen && (
                <div className="collection-items">
                  {items.length === 0 && (
                    <div style={{ fontSize: 11, color: "var(--text3)", padding: "6px 10px" }}>Empty collection</div>
                  )}
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="collection-request-item"
                      onClick={() => onLoadRequest({
                        name: item.name || item.request_data?.url,
                        ...item.request_data,
                      })}
                    >
                      <MethodBadge method={item.request_data?.method} />
                      <span className="req-item-name">
                        {item.name || item.request_data?.url || "Untitled"}
                      </span>
                      <div className="req-item-actions">
                        <button
                          className="col-action-btn danger"
                          title="Delete"
                          onClick={e => deleteItem(col.id, item.id, e)}
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ===== History Panel ===== */
function HistoryPanel({ onLoadRequest }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await api.get("/history");
      setHistory(r.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteItem(id, e) {
    e.stopPropagation();
    await api.delete(`/history/${id}`);
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  async function clearAll() {
    if (!confirm("Clear all history?")) return;
    await api.delete("/history/all");
    setHistory([]);
  }

  // Group by date
  const filtered = history.filter(h =>
    !search || h.url.toLowerCase().includes(search.toLowerCase()) || h.method.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, h) => {
    const d = new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (!acc[d]) acc[d] = [];
    acc[d].push(h);
    return acc;
  }, {});

  return (
    <>
      <div className="side-panel-header">
        <span className="side-panel-title">History</span>
        <div className="side-panel-actions">
          <button className="icon-action-btn" title="Refresh" onClick={load}>↻</button>
        </div>
      </div>
      <div className="side-search">
        <input placeholder="Search history…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="side-panel-content">
        {history.length > 0 && (
          <button className="clear-history-btn" onClick={clearAll}>Clear All History</button>
        )}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🕐</div>
            {history.length === 0 ? "No history yet" : "No matches"}
          </div>
        )}
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="history-group-date">{date}</div>
            {items.map(h => (
              <div
                key={h.id}
                className="history-item"
                onClick={() => onLoadRequest({
                  url: h.url,
                  method: h.method,
                  headers: h.headers,
                  body: h.body,
                  params: h.params,
                })}
              >
                <MethodBadge method={h.method} />
                <span className="hist-url">{h.url}</span>
                <button
                  className="hist-del-btn"
                  onClick={e => deleteItem(h.id, e)}
                  title="Delete"
                >×</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/* ===== Environments Panel ===== */
function EnvironmentsPanel({ environments, setEnvironments, activeEnvId, setActiveEnvId }) {
  async function deleteEnv(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this environment?")) return;
    try {
      await api.delete(`/environments/${id}`);
      const updated = environments.filter(e => e.id !== id);
      setEnvironments(updated);
      if (activeEnvId === id) setActiveEnvId("");
    } catch (err) { console.error(err); }
  }

  return (
    <>
      <div className="side-panel-header">
        <span className="side-panel-title">Environments</span>
      </div>
      <div className="side-panel-content" style={{ paddingTop: 8 }}>
        {environments.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🌐</div>
            No environments. Use ⚙ Manage Envs in the top bar.
          </div>
        )}
        {environments.map(env => (
          <div
            key={env.id}
            className={`env-item ${env.id === activeEnvId ? "active-env" : ""}`}
            onClick={() => setActiveEnvId(env.id === activeEnvId ? "" : env.id)}
          >
            <span style={{ fontSize: 11, color: "var(--accent)", marginRight: 6 }}>●</span>
            <span className="env-item-name">{env.name}</span>
            <div className="env-item-actions">
              <button
                className="col-action-btn danger"
                title="Delete"
                onClick={e => deleteEnv(env.id, e)}
              >×</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ===== Main Sidebar ===== */
export default function LeftSidebar({
  leftPanel, setLeftPanel,
  onLoadRequest,
  environments, setEnvironments,
  activeEnvId, setActiveEnvId,
}) {
  const panels = [
    { id: "collections", icon: ICONS.collections, label: "Collections" },
    { id: "history", icon: ICONS.history, label: "History" },
    { id: "environments", icon: ICONS.environments, label: "Environments" },
  ];

  return (
    <div className="sidebar">
      <div className="icon-strip">
        {panels.map(p => (
          <button
            key={p.id}
            className={`icon-btn ${leftPanel === p.id ? "active" : ""}`}
            title={p.label}
            onClick={() => setLeftPanel(p.id)}
          >
            {p.icon}
          </button>
        ))}
      </div>
      <div className="side-panel">
        {leftPanel === "collections" && (
          <CollectionsPanel onLoadRequest={onLoadRequest} />
        )}
        {leftPanel === "history" && (
          <HistoryPanel onLoadRequest={onLoadRequest} />
        )}
        {leftPanel === "environments" && (
          <EnvironmentsPanel
            environments={environments}
            setEnvironments={setEnvironments}
            activeEnvId={activeEnvId}
            setActiveEnvId={setActiveEnvId}
          />
        )}
      </div>
    </div>
  );
}
