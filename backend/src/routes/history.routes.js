import express from "express";
import { saveHistory, getHistory, deleteHistory, clearHistory } from "../services/supabase.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { url, method, headers, params, body, response, user_id } = req.body;
    const saved = await saveHistory({ user_id: user_id || null, url, method, headers, params, body, response: response || null });
    res.json(saved);
  } catch (err) {
    console.error("save history error:", err);
    res.status(500).json({ error: err.message || "history_save_failed" });
  }
});

router.get("/", async (req, res) => {
  try {
    const list = await getHistory(100);
    res.json(list);
  } catch (err) {
    console.error("get history error:", err);
    res.status(500).json({ error: err.message || "history_fetch_failed" });
  }
});

router.delete("/all", async (req, res) => {
  try {
    await clearHistory();
    res.json({ success: true });
  } catch (err) {
    console.error("clear history error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteHistory(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("delete history error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
