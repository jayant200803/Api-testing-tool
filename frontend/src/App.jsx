import React, { useState } from "react";
import LeftSidebar from "./components/layout/LeftSidebar";
import RequestBuilder from "./components/request/RequestBuilder";
import ResponsePanel from "./components/request/ResponsePanel";

export default function App() {
  const [response, setResponse] = useState(null);
  const [loadedRequest, setLoadedRequest] = useState(null);

  // Called when user clicks history item
  function handleSelectHistory(historyData) {
    setLoadedRequest(historyData);
  }

  // Called when user clicks a saved request inside a collection
  function handleSelectCollectionRequest(requestData) {
    setLoadedRequest(requestData);
  }

  return (
    <div className="app">
      {/* LEFT: Sidebar with History & Collections */}
      <LeftSidebar
        onSelectHistory={handleSelectHistory}
        onSelectCollectionRequest={handleSelectCollectionRequest}
      />

      {/* CENTER: Request Builder (Method, URL, Headers, Body) */}
      <div className="main">
        <RequestBuilder
          onResponse={setResponse}
          loadedRequest={loadedRequest}
        />
      </div>

      {/* RIGHT: Response Panel */}
      <div className="aside">
        <ResponsePanel response={response} />
      </div>
    </div>
  );
}