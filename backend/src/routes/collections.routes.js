import express from "express";
import {
  createCollection, getCollections, renameCollection, deleteCollection,
  addCollectionItem, getCollectionItems, deleteCollectionItem, updateCollectionItem,
} from "../services/supabase.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const saved = await createCollection(req.body);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await getCollections());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await renameCollection(req.params.id, req.body.name);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteCollection(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/items", async (req, res) => {
  try {
    const saved = await addCollectionItem({
      collection_id: req.params.id,
      name: req.body.name || null,
      request_data: req.body.request_data,
    });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/items", async (req, res) => {
  try {
    res.json(await getCollectionItems(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/items/:itemId", async (req, res) => {
  try {
    const updated = await updateCollectionItem(req.params.itemId, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/items/:itemId", async (req, res) => {
  try {
    await deleteCollectionItem(req.params.itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
