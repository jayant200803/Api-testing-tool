import React from "react";

let _id = 0;
export function newRow() {
  return { id: `r-${Date.now()}-${++_id}`, key: "", value: "", enabled: true };
}

export default function KeyValueTable({ rows, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value" }) {
  function updateRow(id, field, val) {
    onChange(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  }

  function deleteRow(id) {
    const next = rows.filter(r => r.id !== id);
    onChange(next.length ? next : [newRow()]);
  }

  function addRow() {
    onChange([...rows, newRow()]);
  }

  return (
    <div className="kv-table">
      <div className="kv-header">
        <div />
        <div className="kv-header-label">{keyPlaceholder}</div>
        <div className="kv-header-label">{valuePlaceholder}</div>
        <div />
      </div>

      {rows.map(row => (
        <div className="kv-row" key={row.id}>
          <input
            type="checkbox"
            className="kv-check"
            checked={row.enabled}
            onChange={e => updateRow(row.id, "enabled", e.target.checked)}
          />
          <input
            className={`kv-input${row.enabled ? "" : " disabled"}`}
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={e => updateRow(row.id, "key", e.target.value)}
          />
          <input
            className={`kv-input${row.enabled ? "" : " disabled"}`}
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={e => updateRow(row.id, "value", e.target.value)}
          />
          <button className="kv-del-btn" onClick={() => deleteRow(row.id)} title="Remove">×</button>
        </div>
      ))}

      <button className="kv-add-btn" onClick={addRow}>
        + Add Row
      </button>
    </div>
  );
}
