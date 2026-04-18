import React, { useEffect, useState } from "react";
import api from "../../services/api.service";

export default function RequestBuilder({
  onResponse,
  loadedRequest,
}) {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headersText, setHeadersText] = useState("{}");
  const [bodyText, setBodyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("");

  // Load collections for the dropdown
  useEffect(() => {
    api.get("/collections")
      .then((r) => setCollections(r.data || []))
      .catch(() => {});
  }, []);

  // Load a saved request from a collection
  useEffect(() => {
    if (loadedRequest) {
      setUrl(loadedRequest.url || "");
      setMethod(loadedRequest.method || "GET");
      setHeadersText(loadedRequest.headers || "{}");
      setBodyText(loadedRequest.body || "");
    }
  }, [loadedRequest]);

  function safeParse(str, fallback = {}) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  async function send() {
    setLoading(true);

    try {
      const headers = safeParse(headersText, {});
      const body = bodyText ? safeParse(bodyText, {}) : null;

      // 1. Make the API request
      const resp = await api.post("/proxy", { url, method, headers, body });

      // 2. Save History
      try {
        await api.post("/history", {
          url,
          method,
          headers,
          body,
          response: resp.data,
        });
      } catch (err) {
        console.warn("History save failed:", err);
      }

      // 3. If collection selected → save request inside it
      if (selectedCollection) {
        try {
          await api.post(`/collections/${selectedCollection}/items`, {
            request_data: { url, method, headers, body },
          });
        } catch (err) {
          console.warn("Collection save failed:", err);
        }
      }

      onResponse && onResponse(resp.data);
    } catch (err) {
      onResponse && onResponse({ error: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="header">
        <select
          className="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>

        <input
          className="url"
          placeholder="https://api.example.com/users"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button className="btn" onClick={send} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="card">
        <h4>Save to Collection</h4>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
        >
          <option value="">— none —</option>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h4>Headers (JSON)</h4>
        <textarea
          rows={4}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
        />
      </div>

      <div className="card">
        <h4>Body (JSON)</h4>
        <textarea
          rows={8}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
        />
      </div>
    </div>
  );
}
