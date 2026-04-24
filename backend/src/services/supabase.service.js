import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

/* -------- Mongoose schema helper -------- */
const opts = {
  toJSON: {
    transform(_, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

/* -------- Schemas -------- */
const historySchema = new mongoose.Schema({
  user_id:    String,
  url:        { type: String, required: true },
  method:     { type: String, required: true },
  headers:    mongoose.Schema.Types.Mixed,
  params:     mongoose.Schema.Types.Mixed,
  body:       mongoose.Schema.Types.Mixed,
  response:   mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
}, opts);

const collectionSchema = new mongoose.Schema({
  user_id:    String,
  name:       { type: String, required: true },
  meta:       mongoose.Schema.Types.Mixed,
  created_at: { type: Date, default: Date.now },
}, opts);

const collectionItemSchema = new mongoose.Schema({
  collection_id: { type: String, required: true },
  name:          String,
  request_data:  mongoose.Schema.Types.Mixed,
  created_at:    { type: Date, default: Date.now },
}, opts);

const environmentSchema = new mongoose.Schema({
  user_id:    String,
  name:       { type: String, required: true },
  variables:  { type: mongoose.Schema.Types.Mixed, default: [] },
  created_at: { type: Date, default: Date.now },
}, opts);

/* -------- Models (safe for hot-reload) -------- */
const History        = mongoose.models.History        || mongoose.model('History',        historySchema);
const Collection     = mongoose.models.Collection     || mongoose.model('Collection',     collectionSchema);
const CollectionItem = mongoose.models.CollectionItem || mongoose.model('CollectionItem', collectionItemSchema);
const Environment    = mongoose.models.Environment    || mongoose.model('Environment',    environmentSchema);

/* -------- Connect -------- */
const USE_MONGO = !!MONGODB_URI;
if (USE_MONGO) {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB connected.'))
    .catch(e => console.error('MongoDB connection error:', e.message));
} else {
  console.warn('MONGODB_URI not set — using local JSON storage.');
}

/* -------- Local JSON fallback -------- */
const DATA_DIR  = path.resolve(process.cwd(), 'backend', 'data');
const STORE_PATH = path.join(DATA_DIR, 'local_store.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(
      { history: [], collections: [], collection_items: [], environments: [] }, null, 2
    ));
  }
}
function readStore() {
  ensureStore();
  const d = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  d.environments = d.environments || [];
  return d;
}
function writeStore(d) { ensureStore(); fs.writeFileSync(STORE_PATH, JSON.stringify(d, null, 2)); }
function sanitize(v) {
  try { return JSON.parse(JSON.stringify(v === undefined ? null : v)); } catch { return String(v); }
}
function localId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

/* ================================================================
   HISTORY
================================================================ */

export async function saveHistory(payload) {
  const doc = {
    user_id:  payload.user_id || null,
    url:      payload.url,
    method:   payload.method,
    headers:  sanitize(payload.headers),
    params:   sanitize(payload.params || {}),
    body:     sanitize(payload.body),
    response: sanitize(payload.response),
    created_at: new Date(),
  };

  if (USE_MONGO) {
    const saved = await History.create(doc);
    return saved.toJSON();
  }
  const store = readStore();
  const record = { id: localId(), ...doc, created_at: doc.created_at.toISOString() };
  store.history.unshift(record);
  writeStore(store);
  return record;
}

export async function getHistory(limit = 100) {
  if (USE_MONGO) {
    const docs = await History.find().sort({ created_at: -1 }).limit(limit);
    return docs.map(d => d.toJSON());
  }
  return readStore().history.slice(0, limit);
}

export async function deleteHistory(id) {
  if (USE_MONGO) {
    await History.findByIdAndDelete(id);
    return { success: true };
  }
  const store = readStore();
  store.history = store.history.filter(h => h.id !== id);
  writeStore(store);
  return { success: true };
}

export async function clearHistory() {
  if (USE_MONGO) {
    await History.deleteMany({});
    return { success: true };
  }
  const store = readStore();
  store.history = [];
  writeStore(store);
  return { success: true };
}

/* ================================================================
   COLLECTIONS
================================================================ */

export async function createCollection(payload) {
  const doc = {
    user_id: payload.user_id || null,
    name:    payload.name,
    meta:    sanitize(payload.meta || {}),
    created_at: new Date(),
  };
  if (USE_MONGO) {
    const saved = await Collection.create(doc);
    return saved.toJSON();
  }
  const store = readStore();
  const record = { id: localId(), ...doc, created_at: doc.created_at.toISOString() };
  store.collections.unshift(record);
  writeStore(store);
  return record;
}

export async function getCollections() {
  if (USE_MONGO) {
    const docs = await Collection.find().sort({ created_at: -1 });
    return docs.map(d => d.toJSON());
  }
  return readStore().collections;
}

export async function renameCollection(id, name) {
  if (USE_MONGO) {
    const doc = await Collection.findByIdAndUpdate(id, { name }, { new: true });
    return doc?.toJSON();
  }
  const store = readStore();
  const col = store.collections.find(c => c.id === id);
  if (col) col.name = name;
  writeStore(store);
  return col;
}

export async function deleteCollection(id) {
  if (USE_MONGO) {
    await Collection.findByIdAndDelete(id);
    await CollectionItem.deleteMany({ collection_id: id });
    return { success: true };
  }
  const store = readStore();
  store.collections = store.collections.filter(c => c.id !== id);
  store.collection_items = store.collection_items.filter(i => i.collection_id !== id);
  writeStore(store);
  return { success: true };
}

/* ================================================================
   COLLECTION ITEMS
================================================================ */

export async function addCollectionItem(payload) {
  const doc = {
    collection_id: payload.collection_id,
    name:         payload.name || null,
    request_data: sanitize(payload.request_data),
    created_at:   new Date(),
  };
  if (USE_MONGO) {
    const saved = await CollectionItem.create(doc);
    return saved.toJSON();
  }
  const store = readStore();
  const record = { id: localId(), ...doc, created_at: doc.created_at.toISOString() };
  store.collection_items.push(record);
  writeStore(store);
  return record;
}

export async function getCollectionItems(collection_id) {
  if (USE_MONGO) {
    const docs = await CollectionItem.find({ collection_id }).sort({ created_at: 1 });
    return docs.map(d => d.toJSON());
  }
  return readStore().collection_items.filter(i => i.collection_id === collection_id);
}

export async function deleteCollectionItem(id) {
  if (USE_MONGO) {
    await CollectionItem.findByIdAndDelete(id);
    return { success: true };
  }
  const store = readStore();
  store.collection_items = store.collection_items.filter(i => i.id !== id);
  writeStore(store);
  return { success: true };
}

export async function updateCollectionItem(id, payload) {
  if (USE_MONGO) {
    const doc = await CollectionItem.findByIdAndUpdate(id, payload, { new: true });
    return doc?.toJSON();
  }
  const store = readStore();
  const item = store.collection_items.find(i => i.id === id);
  if (item) Object.assign(item, payload);
  writeStore(store);
  return item;
}

/* ================================================================
   ENVIRONMENTS
================================================================ */

export async function createEnvironment(payload) {
  const doc = {
    name:       payload.name,
    variables:  sanitize(payload.variables || []),
    created_at: new Date(),
  };
  if (USE_MONGO) {
    const saved = await Environment.create(doc);
    return saved.toJSON();
  }
  const store = readStore();
  const record = { id: localId(), ...doc, created_at: doc.created_at.toISOString() };
  store.environments.unshift(record);
  writeStore(store);
  return record;
}

export async function getEnvironments() {
  if (USE_MONGO) {
    const docs = await Environment.find().sort({ created_at: -1 });
    return docs.map(d => d.toJSON());
  }
  return readStore().environments;
}

export async function updateEnvironment(id, payload) {
  if (USE_MONGO) {
    const doc = await Environment.findByIdAndUpdate(id, payload, { new: true });
    return doc?.toJSON();
  }
  const store = readStore();
  const env = store.environments.find(e => e.id === id);
  if (env) Object.assign(env, payload);
  writeStore(store);
  return env;
}

export async function deleteEnvironment(id) {
  if (USE_MONGO) {
    await Environment.findByIdAndDelete(id);
    return { success: true };
  }
  const store = readStore();
  store.environments = store.environments.filter(e => e.id !== id);
  writeStore(store);
  return { success: true };
}
