-- Supabase SQL: create tables for the API testing tool
-- Run these in Supabase SQL editor (or via psql)

-- history table
CREATE TABLE IF NOT EXISTS history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  url text NOT NULL,
  method text NOT NULL,
  headers jsonb,
  params jsonb,
  body jsonb,
  response jsonb,
  created_at timestamptz DEFAULT now()
);

-- collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- collection_items table
CREATE TABLE IF NOT EXISTS collection_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  request_data jsonb,
  created_at timestamptz DEFAULT now()
);
