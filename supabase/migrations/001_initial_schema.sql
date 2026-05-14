-- ============================================================
-- ICT Cloud Solutions — Unified Supabase Schema
-- ============================================================

-- 1. Enable pgvector extension (CRITICAL FIX)
-- This resolves the "type vector does not exist" error.
create extension if not exists vector;

-- 2. Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  content     text,
  chunk_count integer default 0,
  status      text default 'indexed',
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Document chunks with vector embeddings
create table if not exists document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content     text not null,
  embedding   vector(1536),             -- Use 1536 for broad compatibility
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- HNSW Index (Succeeds because 1536 < 2000)
create index if not exists document_chunks_embedding_idx
  on document_chunks
  using hnsw (embedding vector_cosine_ops);

-- 4. match_documents RPC
create or replace function match_documents (
  query_embedding  vector(1536),        -- Must match table dimensions
  match_threshold  float default 0.75,
  match_count      int   default 5
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  metadata    jsonb,
  similarity  float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- 5. Support tickets
create table if not exists tickets (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  priority   text default 'MEDIUM',
  status     text default 'Open',
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Chat messages
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  role        text not null,
  content     text not null,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- 7. Row-Level Security
alter table documents       enable row level security;
alter table document_chunks enable row level security;
alter table tickets         enable row level security;
alter table chat_messages   enable row level security;

-- Drop policies if they exist (makes migration idempotent)
drop policy if exists "Users see own documents"     on documents;
drop policy if exists "Users see own chunks"        on document_chunks;
drop policy if exists "Users see own tickets"       on tickets;
drop policy if exists "Users see own chat messages" on chat_messages;

create policy "Users see own documents"     on documents      for all using (auth.uid() = user_id);
create policy "Users see own chunks"        on document_chunks for all using (document_id in (select id from documents where user_id = auth.uid()));
create policy "Users see own tickets"       on tickets        for all using (auth.uid() = user_id);
create policy "Users see own chat messages" on chat_messages  for all using (auth.uid() = user_id);
