import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log("Supabase client initialized.");
  } catch (e) {
    console.warn("Failed to initialize Supabase client:", e.message || e);
  }
} else {
  console.warn("Supabase keys missing. Using local JSON storage.");
}

/* ---------------- Local JSON fallback ---------------- */

const DATA_DIR = path.resolve(process.cwd(), "backend", "data");
const STORE_PATH = path.join(DATA_DIR, "local_store.json");

function ensureLocalStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(
      STORE_PATH,
      JSON.stringify(
        { history: [], collections: [], collection_items: [] },
        null,
        2
      )
    );
  }
}

function readLocalStore() {
  ensureLocalStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function writeLocalStore(data) {
  ensureLocalStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function sanitize(obj) {
  try {
    return JSON.parse(JSON.stringify(obj === undefined ? null : obj));
  } catch {
    return String(obj);
  }
}

/* ---------------- HISTORY ---------------- */

export async function saveHistory(payload) {
  const record = {
    user_id: payload.user_id || null,
    url: payload.url,
    method: payload.method,
    headers: sanitize(payload.headers),
    params: sanitize(payload.params || {}),
    body: sanitize(payload.body),
    response: sanitize(payload.response),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase.from("history").insert([record]);
    if (error) throw error;
    return data[0];
  }

  const store = readLocalStore();
  store.history.unshift({ id: `local-${Date.now()}`, ...record });
  writeLocalStore(store);
  return store.history[0];
}

export async function getHistory(limit = 50) {
  if (supabase) {
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  const store = readLocalStore();
  return store.history.slice(0, limit);
}

/* ---------------- COLLECTIONS ---------------- */

export async function createCollection(payload) {
  const record = {
    user_id: payload.user_id || null,
    name: payload.name,
    meta: sanitize(payload.meta || {}),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("collections")
      .insert([record]);
    if (error) throw error;
    return data[0];
  }

  const store = readLocalStore();
  const id = `local-col-${Date.now()}`;
  store.collections.unshift({ id, ...record });
  writeLocalStore(store);
  return store.collections[0];
}

export async function getCollections() {
  if (supabase) {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  const store = readLocalStore();
  return store.collections;
}

export async function addCollectionItem(payload) {
  const record = {
    collection_id: payload.collection_id,
    request_data: sanitize(payload.request_data),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("collection_items")
      .insert([record]);

    if (error) throw error;
    return data[0];
  }

  const store = readLocalStore();
  const id = `local-item-${Date.now()}`;
  store.collection_items.unshift({ id, ...record });
  writeLocalStore(store);
  return store.collection_items[0];
}

/* ---------------- NEW: GET ITEMS OF COLLECTION ---------------- */

export async function getCollectionItems(collection_id) {
  if (supabase) {
    const { data, error } = await supabase
      .from("collection_items")
      .select("*")
      .eq("collection_id", collection_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  const store = readLocalStore();
  return store.collection_items.filter(
    (item) => item.collection_id === collection_id
  );
}
