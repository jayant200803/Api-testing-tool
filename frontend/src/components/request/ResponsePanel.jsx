import React from "react";

export default function ResponsePanel({ response }) {
  if (!response) {
    return (
      <div className="card small">
        No response yet
      </div>
    );
  }

  return (
    <div className="response-panel">

      <div className="status-line">
        <strong>{response.status} {response.statusText}</strong>
        <span style={{ marginLeft: "10px", opacity: 0.7 }}>
          {response.time} ms
        </span>
      </div>

      <div className="response-section">
        <h3>Headers</h3>
        <pre>{JSON.stringify(response.headers || {}, null, 2)}</pre>
      </div>

      <div className="response-section">
        <h3>Body</h3>
        <pre>{JSON.stringify(response.body || {}, null, 2)}</pre>
      </div>

    </div>
  );
}
