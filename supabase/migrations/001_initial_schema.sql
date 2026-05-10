-- ============================================================
-- ICT Cloud Solutions — Supabase Schema
-- Run these in your Supabase SQL editor or via migrations.
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Documents table (for RAG)
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  content     text,
  chunk_count integer default 0,
  status      text default 'indexed',   -- indexed | processing
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Document chunks with vector embeddings (pgvector)
create table if not exists document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content     text not null,
  embedding   vector(3072),            -- text-embedding-3-large
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- Index for fast cosine similarity search
create index if not exists document_chunks_embedding_idx
  on document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. match_documents RPC — called from semanticSearch()
create or replace function match_documents (
  query_embedding  vector(3072),
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
  priority   text default 'MEDIUM',    -- HIGH | MEDIUM | LOW
  status     text default 'Open',      -- Open | In Progress | Resolved
  assignee   text,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Chat messages (for session history)
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id text not null,
  role       text not null,            -- user | assistant
  content    text not null,
  user_id    uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 7. Row-Level Security (RLS)
-- Users can only access their own data.

alter table documents       enable row level security;
alter table document_chunks enable row level security;
alter table tickets         enable row level security;
alter table chat_messages   enable row level security;

create policy "Users see own documents"
  on documents for all using (auth.uid() = user_id);

create policy "Users see own chunks"
  on document_chunks for all
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users see own tickets"
  on tickets for all using (auth.uid() = user_id);

create policy "Users see own chat messages"
  on chat_messages for all using (auth.uid() = user_id);
