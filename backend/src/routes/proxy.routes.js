// backend/src/routes/proxy.routes.js
import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url, method='GET', headers={}, params={}, body=null } = req.body;

    if (!url) return res.status(400).json({ error: "url required" });

    const blocked = ['127.0.0.1','localhost','::1'];
    for (const b of blocked) {
      if (url.includes(b)) return res.status(403).json({ error: "forbidden target" });
    }

    const timeout = parseInt(process.env.PROXY_TIMEOUT_MS || "15000", 10);
    const start = Date.now();

    const response = await axios({
      url,
      method,
      headers,
      params,
      data: body,
      validateStatus: () => true,
      timeout
    });

    const time = Date.now() - start;

    return res.json({
      status: response.status,
      statusText: response.statusText,

      // FIX → what frontend expects
      headers: response.headers || {},
      body: response.data || {},

      time
    });

  } catch (err) {
    console.error("Proxy error:", err.message);
    return res.status(500).json({ error: "proxy_error", message: err.message });
  }
});

export default router;
