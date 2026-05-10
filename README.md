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
