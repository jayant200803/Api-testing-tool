import React, { useState } from "react";
import api from "../../services/api.service";
import KeyValueTable, { newRow } from "../shared/KeyValueTable";

export default function EnvironmentModal({ environments, setEnvironments, onClose }) {
  const [activeEnvId, setActiveEnvId] = useState(environments[0]?.id || null);
  const [newEnvName, setNewEnvName] = useState("");
  const [saving, setSaving] = useState(false);

  const activeEnv = environments.find(e => e.id === activeEnvId);

  async function createEnv() {
    const name = newEnvName.trim();
    if (!name) return;
    try {
      const resp = await api.post("/environments", { name, variables: [] });
      const created = resp.data;
      setEnvironments([...environments, created]);
      setActiveEnvId(created.id);
      setNewEnvName("");
    } catch (err) {
      console.error("Create env error", err);
    }
  }

  async function saveEnv() {
    if (!activeEnv) return;
    setSaving(true);
    try {
      await api.put(`/environments/${activeEnv.id}`, {
        name: activeEnv.name,
        variables: activeEnv.variables,
      });
      setSaving(false);
    } catch (err) {
      console.error("Save env error", err);
      setSaving(false);
    }
  }

  async function deleteEnv(id) {
    if (!confirm("Delete this environment?")) return;
    try {
      await api.delete(`/environments/${id}`);
      const updated = environments.filter(e => e.id !== id);
      setEnvironments(updated);
      setActiveEnvId(updated[0]?.id || null);
    } catch (err) {
      console.error("Delete env error", err);
    }
  }

  function updateActiveEnv(changes) {
    setEnvironments(environments.map(e =>
      e.id === activeEnvId ? { ...e, ...changes } : e
    ));
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Manage Environments</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Env Tabs */}
          <div className="env-tabs">
            {environments.map(env => (
              <button
                key={env.id}
                className={`env-tab-btn ${env.id === activeEnvId ? "active" : ""}`}
                onClick={() => setActiveEnvId(env.id)}
              >
                {env.name}
              </button>
            ))}
          </div>

          {/* Create new env inline */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input
              className="form-input"
              placeholder="New environment name…"
              value={newEnvName}
              onChange={e => setNewEnvName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createEnv()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={createEnv}>+ New</button>
          </div>

          {/* Env Editor */}
          {activeEnv ? (
            <>
              <div className="form-group">
                <label>Environment Name</label>
                <input
                  className="form-input"
                  value={activeEnv.name}
                  onChange={e => updateActiveEnv({ name: e.target.value })}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>
                  Variables
                </div>
                <KeyValueTable
                  rows={activeEnv.variables?.length ? activeEnv.variables : [newRow()]}
                  onChange={rows => updateActiveEnv({ variables: rows })}
                  keyPlaceholder="Variable name"
                  valuePlaceholder="Value"
                />
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
                  Use <code style={{ color: "var(--accent)" }}>{"{{variableName}}"}</code> in URL, headers, or body to insert a variable.
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🌐</div>
              Create an environment above to manage variables
            </div>
          )}
        </div>

        <div className="modal-footer">
          {activeEnv && (
            <button
              className="btn-secondary"
              style={{ color: "var(--red)", borderColor: "var(--border)", marginRight: "auto" }}
              onClick={() => deleteEnv(activeEnv.id)}
            >
              Delete
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {activeEnv && (
            <button className="btn-primary" onClick={saveEnv} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
