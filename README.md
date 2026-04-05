# SafeGuard — Local Dev Setup

## Quick start

```bash
npm install
npm run dev
```

Opens at **http://localhost:5173** — Vite proxies all `/api` calls to Express on `:3001`.

---

## Prerequisites

- Node.js 20+
- All credentials already filled in `.env.local`

---

## What's running

`npm run dev` starts two processes concurrently:

| Process | Port | Command |
|---------|------|---------|
| Express API | 3001 | `node --watch server/index.js` |
| Vite dev server | 5173 | `vite` |

To run them separately:

```bash
npm run dev:server   # Express only
npm run dev:client   # Vite only
```

---

## Environment

`.env.local` is already configured with:

- `DATABASE_URL` — Neon Postgres
- `GROQ_API_KEY` — Groq LLM (contracts, receipts, tax analysis, compliance)
- `PLAID_CLIENT_ID` / `PLAID_SECRET` — Plaid sandbox
- `PLAID_REDIRECT_URI` — `http://localhost:5173/plaid-oauth.html`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (file uploads)
- `TINYFISH_API_KEY` — TinyFish web search (tax opportunities, funding)
- `AUTH0_*` — Auth0 (optional — app works without it)

The server loads `.env` then `.env.local` (local overrides win).

---

## API surface

### Core
- `GET /api/health`
- `POST /api/business` · `GET /api/business`

### Business data graph (`/api/data/businesses/:id/...`)
- `GET|POST /contracts` · `GET|PATCH|DELETE /contracts/:id`
- `GET|POST /receipts` · `PATCH|DELETE /receipts/:id`
- `GET|POST /quotes` · `PATCH|DELETE /quotes/:id`
- `GET|POST /compliance` · `PATCH|DELETE /compliance/:id`
- `GET|POST /funding` · `PATCH /funding/:id`
- `GET /bank-transactions`
- `GET /plaid-connections`
- `GET /growth-actions` · `PATCH /growth-actions/:id`
- `GET /files` · `POST /files/upload`

### Workspace (session-scoped shortcuts)
- `GET|POST /api/workspace/contracts`
- `GET|POST /api/workspace/quotes`
- `GET|POST /api/workspace/receipts`
- `GET|PATCH /api/workspace/compliance/:id`
- `GET /api/workspace/growth` · `POST /api/workspace/growth/refresh`
- `POST /api/workspace/files/upload`

### AI
- `POST /api/ai/business-advisor`
- `POST /api/ai/analyze-receipt`
- `POST /api/ai/analyze-taxes`
- `POST /api/ai/analyze-contract`
- `POST /api/ai/generate-contract`
- `POST /api/ai/generate-quote`
- `POST /api/ai/generate-compliance`
- `POST /api/ai/scan-opportunities`
- `POST /api/ai/scan-funding`
- `POST /api/ai/scan-tax-opportunities`

### Insurance
- `POST /api/analyze-policy`
- `POST /api/save-gap-analysis`

### Plaid
- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-token`
- `GET /api/plaid/accounts`
- `GET /api/plaid/transactions`

### Reference data
- `GET /api/zip-lookup?zip=`
- `GET /api/business-types`
- `GET /api/risk-factors`
- `GET /api/recommendations?businessType=`

---

## Build

```bash
npm run build    # Vite production build → dist/
npm run preview  # Serve dist/ (still needs Express on :3001)
```
