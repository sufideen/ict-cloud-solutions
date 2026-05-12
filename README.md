# ict-cloud.solutions

**Azure & AI Consultancy Portal** — secure client portal for ICT Cloud Solutions.

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Frontend     | React 18 + Vite + Tailwind CSS |
| Auth         | Supabase Auth (email + Google OAuth + MFA) |
| Database     | Supabase Postgres 15 |
| Vector search | Supabase pgvector (RAG) |
| AI models    | Azure OpenAI GPT-4o + text-embedding-3-large |
| Primary host | Google Cloud Platform (GKE / Cloud Run) |
| Secondary    | DigitalOcean (DOKS / App Platform) |
| Edge / CDN   | Cloudflare (Zero Trust + WAF + DDoS) |
| DNS          | GoDaddy registrar → Cloudflare nameservers |

---

## Getting started

### 1. Prerequisites
- Node.js 18+
- A Supabase project (free tier works for development)
- (Optional) Azure OpenAI resource for live AI responses

### 2. Install dependencies
```bash
cd ict-cloud-solutions
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
```

### 4. Set up Supabase schema
Paste the contents of `supabase/migrations/001_initial_schema.sql`
into your Supabase SQL editor and run it.

### 5. Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## Project structure

```
src/
├── components/
│   ├── layout/         Navbar, InfraBar, Footer
│   ├── landing/        Hero, Services, LoginForm
│   ├── dashboard/      Sidebar, Overview
│   ├── chat/           ChatPanel (AI Assistant + RAG toggle)
│   ├── rag/            RagPanel (document library + semantic search)
│   ├── tickets/        TicketsPanel
│   ├── settings/       SettingsPanel (DNS, Supabase, AI config)
│   └── ui/             Button, Badge, Card, Toggle, PulseDot
├── hooks/
│   └── useChat.js      Chat state + message logic
├── lib/
│   ├── supabase.js     Supabase client + auth/data helpers
│   ├── AuthContext.jsx React context for session state
│   └── constants.js    Design tokens + app constants
├── pages/
│   ├── LandingPage.jsx Public marketing + login
│   └── DashboardPage.jsx Protected client portal
├── styles/
│   └── globals.css     Design tokens + Tailwind base
└── main.jsx
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

---

## Schema implementation notes (2026)

### 1. The 1536 dimension threshold
The schema uses `vector(1536)` to align with standard OpenAI and open-source embedding defaults (`text-embedding-3-small`, `text-embedding-ada-002`). This ensures the HNSW index builds reliably — the index has a hard 2000-dimension ceiling, so larger values such as 3072 would fail silently at index creation time.

### 2. RLS chaining
The document chunk policy is chained through the `documents` table:
```sql
using (document_id in (select id from documents where user_id = auth.uid()))
```
This means even bulk uploads of thousands of chunks are locked to the authenticated owner. The `match_documents` RPC inherits this restriction automatically — no extra server-side filtering needed.

### 3. Memory considerations
Indexing 1536-dimensional vectors is RAM-intensive. On an 8 GiB machine, monitor swap after running the migration or ingesting large document sets:
```bash
free -h
```
If swap pressure is high, ingest documents in smaller batches or increase Supabase compute tier.

### 4. Testing document upload and retrieval
After running the migration, verify end-to-end RAG by:
1. Uploading a document via the RAG panel in the dashboard
2. Checking the `documents` and `document_chunks` tables in Supabase Table Editor
3. Running a semantic search query in the chat panel with RAG toggled on
4. Confirming the `match_documents` RPC returns rows with `similarity > 0.75`

---

## Connecting real Azure OpenAI

In `src/hooks/useChat.js`, replace the demo response logic with:

```js
// Call your own backend endpoint that proxies Azure OpenAI
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [...history, { role: 'user', content: text }], ragEnabled })
})
const data = await res.json()
```

Never expose your Azure OpenAI key in the frontend. Use a Supabase Edge Function or
a Cloud Run / DO App Platform backend to proxy the requests.

---

## DNS migration: GoDaddy → Cloudflare

1. Login to GoDaddy → My Products → DNS
2. Change nameservers to Cloudflare's (shown after adding site in Cloudflare dashboard)
3. In Cloudflare: Add site → ict-cloud.solutions
4. Import DNS records (auto-scanned from GoDaddy)
5. Enable Cloudflare Proxy (orange cloud) on A/CNAME records
6. SSL/TLS → Full (Strict)
7. Zero Trust → Access → protect the `/dashboard` route (invite-only)

Propagation takes 24–48 hours after nameserver change.

---

## Deployment

### Google Cloud Platform (Cloud Run)
```bash
npm run build
gcloud run deploy ict-cloud-solutions \
  --source . \
  --region europe-west2 \
  --allow-unauthenticated
```

### DigitalOcean App Platform
Push to GitHub and connect via the DigitalOcean App Platform UI.
Set environment variables in the App settings.

---

## Claude Code

This project is designed to be worked on with Claude Code.
After cloning, run:
```bash
claude
```
Claude Code will read the project structure and help you extend, debug, and deploy.

---

© 2026 ict-cloud.solutions
