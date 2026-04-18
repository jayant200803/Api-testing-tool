import express from "express";
import {
  createCollection,
  addCollectionItem,
  getCollections,
  getCollectionItems,
} from "../services/supabase.service.js";

const router = express.Router();

/* ---------------- CREATE COLLECTION ---------------- */
// POST /api/collections
router.post("/", async (req, res) => {
  try {
    const payload = req.body; // { name, user_id?, meta? }
    const saved = await createCollection(payload);
    res.json(saved);
  } catch (err) {
    console.error("Create collection error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

/* ---------------- ADD ITEM TO COLLECTION ---------------- */
// POST /api/collections/:id/items
router.post("/:id/items", async (req, res) => {
  try {
    const collection_id = req.params.id;
    const request_data = req.body; // { url, method, headers, body }

    const saved = await addCollectionItem({
      collection_id,
      request_data,
    });

    res.json(saved);
  } catch (err) {
    console.error("Add collection item error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

/* ---------------- GET ALL COLLECTIONS ---------------- */
// GET /api/collections
router.get("/", async (req, res) => {
  try {
    const data = await getCollections();
    res.json(data);
  } catch (err) {
    console.error("Get collections error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

/* ---------------- GET ALL ITEMS OF ONE COLLECTION ---------------- */
// GET /api/collections/:id/items
router.get("/:id/items", async (req, res) => {
  try {
    const collection_id = req.params.id;
    const items = await getCollectionItems(collection_id);
    res.json(items);
  } catch (err) {
    console.error("Get collection items error:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
