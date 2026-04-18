import React, { useEffect, useState } from "react";
import api from "../../services/api.service";

export default function LeftSidebar({
  onSelectHistory,
  onSelectCollectionRequest,
}) {
  const [history, setHistory] = useState([]);
  const [collections, setCollections] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [newCollectionName, setNewCollectionName] = useState("");

  /* ------------------------ Load History ------------------------ */
  async function loadHistory() {
    try {
      const resp = await api.get("/history");
      setHistory(resp.data || []);
    } catch (err) {
      console.error("Load history error", err);
    }
  }

  /* ----------------------- Load Collections ---------------------- */
  async function loadCollections() {
    try {
      const resp = await api.get("/collections");
      setCollections(resp.data || []);
    } catch (err) {
      console.error("Load collections error", err);
    }
  }

  useEffect(() => {
    loadHistory();
    loadCollections();
  }, []);

  /* --------------------- Create New Collection -------------------- */
  async function createCollection() {
    if (!newCollectionName.trim()) return;

    try {
      await api.post("/collections", {
        name: newCollectionName.trim(),
        meta: {},
      });
      setNewCollectionName("");
      loadCollections();
    } catch (err) {
      console.error("Create collection error", err);
    }
  }

  /* ------------------ Expand / Collapse Collection ---------------- */
  function toggleExpand(id) {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  /* ------------------ Load Items Inside a Collection -------------- */
  async function loadItems(collectionId) {
    try {
      const resp = await api.get(`/collections/${collectionId}/items`);
      return resp.data || [];
    } catch (err) {
      console.error("Load collection items error", err);
      return [];
    }
  }

  /* ------------------------ Render Component ---------------------- */
  return (
    <div className="sidebar">
      {/* -------------------------------- HISTORY -------------------------------- */}
      <h2>History</h2>
      <button className="btn small" onClick={loadHistory}>
        Refresh
      </button>

      <div className="history-list">
        {history.length === 0 ? (
          <p className="empty">No history yet</p>
        ) : (
          history.map((h) => (
            <div
              key={h.id}
              className="history-item"
              onClick={() =>
                onSelectHistory({
                  url: h.url,
                  method: h.method,
                  headers: JSON.stringify(h.headers || {}, null, 2),
                  body: JSON.stringify(h.body || {}, null, 2),
                })
              }
            >
              <div>
                <strong>{h.method}</strong>
                <span>{h.url}</span>
              </div>
              <div className="small">{new Date(h.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      {/* -------------------------------- COLLECTIONS -------------------------------- */}
      <h2 style={{ marginTop: "20px" }}>
        Collections{" "}
        <span className="small-count">{collections.length} collections</span>
      </h2>

      <div className="collection-create">
        <input
          placeholder="New collection"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
        />
        <button className="btn small" onClick={createCollection}>
          +
        </button>
      </div>

      <div className="collections-list">
        {collections.length === 0 ? (
          <p className="empty">No collections yet</p>
        ) : (
          collections.map((col) => (
            <CollectionItem
              key={col.id}
              col={col}
              expanded={expanded[col.id]}
              toggleExpand={toggleExpand}
              loadItems={loadItems}
              onSelectCollectionRequest={onSelectCollectionRequest}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================= SUB-COMPONENT ============================= */

function CollectionItem({
  col,
  expanded,
  toggleExpand,
  loadItems,
  onSelectCollectionRequest,
}) {
  const [items, setItems] = useState([]);

  async function handleExpand() {
    toggleExpand(col.id);
    if (!expanded) {
      const loaded = await loadItems(col.id);
      setItems(loaded);
    }
  }

  return (
    <div className="collection-block">
      {/* Collection Title */}
      <div className="collection-header" onClick={handleExpand}>
        <span className="folder-icon">📁</span>
        {col.name}
        <span className="count">{items.length} req</span>
      </div>

      {/* Child Requests */}
      {expanded && (
        <div className="collection-items">
          {items.length === 0 ? (
            <p className="empty small">Empty collection</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="collection-item"
                onClick={() =>
                  onSelectCollectionRequest({
                    url: item.request_data.url,
                    method: item.request_data.method,
                    headers: JSON.stringify(item.request_data.headers || {}, null, 2),
                    body: JSON.stringify(item.request_data.body || {}, null, 2),
                  })
                }
              >
                <strong>{item.request_data.method}</strong> {item.request_data.url}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}