// backend/src/routes/history.routes.js
import express from "express";
import { saveHistory, getHistory } from "../services/supabase.service.js";

const router = express.Router();

// Save request → POST /api/history
router.post("/", async (req, res) => {
  try {
    const { url, method, headers, params, body, response, user_id } = req.body;

    const payload = {
      user_id: user_id || null,
      url,
      method,
      headers,
      params,
      body,
      response: response || null,
    };

    const saved = await saveHistory(payload);
    res.json(saved);

  } catch (err) {
    console.error("save history error:", err);
    res.status(500).json({ error: err.message || "history_save_failed" });
  }
});

// Fetch history → GET /api/history
router.get("/", async (req, res) => {
  try {
    const list = await getHistory(50);
    res.json(list);
  } catch (err) {
    console.error("get history error:", err);
    res.status(500).json({ error: err.message || "history_fetch_failed" });
  }
});

export default router;
