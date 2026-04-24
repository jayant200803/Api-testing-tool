import express from "express";
import { createEnvironment, getEnvironments, updateEnvironment, deleteEnvironment } from "../services/supabase.service.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    res.json(await getEnvironments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    res.json(await createEnvironment(req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    res.json(await updateEnvironment(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteEnvironment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
