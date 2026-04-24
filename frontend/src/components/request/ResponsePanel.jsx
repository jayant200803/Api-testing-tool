import React, { useState } from "react";

function statusClass(status) {
  if (!status) return "serr";
  if (status >= 500) return "s5xx";
  if (status >= 400) return "s4xx";
  if (status >= 300) return "s3xx";
  if (status >= 200) return "s2xx";
  return "serr";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/* Pretty JSON with syntax highlighting */
function PrettyJson({ data }) {
  const json = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const highlighted = json
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span style="color:#61affe">${match}</span>`;
          return `<span style="color:#49cc90">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span style="color:#fca130">${match}</span>`;
        if (/null/.test(match)) return `<span style="color:#f93e3e">${match}</span>`;
        return `<span style="color:#c084fc">${match}</span>`;
      }
    );

  return (
    <pre
      className="res-raw"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function ResponsePanel({ response, loading }) {
  const [resTab, setResTab] = useState("body");
  const [viewMode, setViewMode] = useState("pretty");

  if (loading) {
    return (
      <div className="response-panel">
        <div className="no-response">
          <div style={{ fontSize: 32 }}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          <div style={{ color: "var(--text2)", marginTop: 12 }}>Sending request…</div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-panel">
        <div className="no-response">
          <div className="no-response-icon">⬆</div>
          <div>Enter a URL and click <strong>Send</strong> to get a response</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
            Responses will appear here
          </div>
        </div>
      </div>
    );
  }

  const { status, statusText, headers, body, time, size } = response;
  const isError = !status || status === 0;

  function copyBody() {
    const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function downloadBody() {
    const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "response.json"; a.click();
    URL.revokeObjectURL(url);
  }

  const headersEntries = Object.entries(headers || {});

  return (
    <div className="response-panel">
      {/* Status Bar */}
      <div className="response-status-bar">
        {isError ? (
          <span className="status-badge serr">Error</span>
        ) : (
          <span className={`status-badge ${statusClass(status)}`}>
            {status} {statusText}
          </span>
        )}
        <div className="status-meta">
          {time != null && <span>Time: <strong style={{ color: "var(--text)" }}>{time}ms</strong></span>}
          {size != null && size > 0 && <span>Size: <strong style={{ color: "var(--text)" }}>{formatSize(size)}</strong></span>}
          {headersEntries.length > 0 && <span>{headersEntries.length} headers</span>}
        </div>
        <div className="response-actions">
          <button className="res-action-btn" onClick={copyBody} title="Copy response body">Copy</button>
          <button className="res-action-btn" onClick={downloadBody} title="Download response">⬇ Download</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="res-tabs">
        <div className={`res-tab ${resTab === "body" ? "active" : ""}`} onClick={() => setResTab("body")}>Body</div>
        <div className={`res-tab ${resTab === "headers" ? "active" : ""}`} onClick={() => setResTab("headers")}>
          Headers {headersEntries.length > 0 && <span className="req-tab-badge">{headersEntries.length}</span>}
        </div>
        {resTab === "body" && (
          <div className="res-view-toggle">
            <button className={`res-toggle-btn ${viewMode === "pretty" ? "active" : ""}`} onClick={() => setViewMode("pretty")}>Pretty</button>
            <button className={`res-toggle-btn ${viewMode === "raw" ? "active" : ""}`} onClick={() => setViewMode("raw")}>Raw</button>
          </div>
        )}
      </div>

      {/* Body Tab */}
      {resTab === "body" && (
        <div className="res-body-container">
          {body == null || (typeof body === "object" && Object.keys(body).length === 0 && !isError) ? (
            <div style={{ color: "var(--text3)", fontSize: 12, padding: "8px 0" }}>Empty response body</div>
          ) : viewMode === "pretty" ? (
            <PrettyJson data={body} />
          ) : (
            <pre className="res-raw">
              {typeof body === "string" ? body : JSON.stringify(body, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Headers Tab */}
      {resTab === "headers" && (
        <div className="res-body-container">
          {headersEntries.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12, padding: "8px 0" }}>No response headers</div>
          ) : (
            <table className="res-headers-table">
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {headersEntries.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
