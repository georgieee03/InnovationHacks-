# SafeGuard

**AI-powered financial resilience platform for first-time small business owners.**

SafeGuard helps new entrepreneurs — especially those from underserved communities who lack access to accountants, lawyers, or financial advisors — make confident financial decisions from day one. Through a conversational AI onboarding experience, real-time bank integration, insurance gap analysis, and automated compliance tracking, SafeGuard turns overwhelming business finance into a guided, jargon-free experience.

## The Problem

Starting a business is hard. Navigating business finance without professional help is harder. First-time entrepreneurs face:

- **No idea what licenses or permits they need** — and penalties for missing them
- **No visibility into cash flow** — they don't know their runway or burn rate
- **Insurance confusion** — they don't know what coverage gaps put their livelihood at risk
- **Tax surprises** — missed deductions, unexpected quarterly payments, self-employment tax
- **No access to funding** — they don't know what grants or programs they qualify for

These problems disproportionately affect solo operators, service businesses, and entrepreneurs in communities where financial literacy resources are scarce.

## What SafeGuard Does

### Conversational AI Onboarding
Instead of forms, SafeGuard walks new users through a natural conversation about their business. The AI advisor (powered by Gemini 2.0 Flash) analyzes their answers and generates:
- Entity type recommendation (LLC vs sole prop) with filing costs and links
- Business name availability and trademark risk analysis
- A step-by-step formation checklist
- Compliance requirements specific to their state, city, and industry
- Key insights and urgent warnings

### Live Financial Dashboard
Connect a bank account through Plaid and get instant visibility into:
- Total balances, monthly revenue, expenses, and runway
- Cash flow trends over time
- Spending breakdown by category
- Emergency fund status relative to operating costs

For users who aren't ready to connect a bank, SafeGuard provides a demo workspace with realistic data so they can explore every feature before committing.

### Insurance Analysis & Gap Detection
Upload a business insurance policy (PDF) and SafeGuard:
- Extracts coverage details using AI-powered document analysis
- Identifies what's covered and what's missing
- Calculates a protection score
- Recommends specific coverage types based on business type and location risk factors
- Simulates disruption scenarios against current coverage

### Documents Workspace
A unified hub for contracts, quotes, and receipts:
- **Contracts**: Upload and store agreements with AI clause analysis, health scoring, obligation tracking, and missing protection alerts
- **Quotes**: Create and manage client quotes with AI-powered pricing suggestions
- **Receipts**: Upload receipt images for AI-powered OCR that auto-categorizes expenses, flags tax deductions, and calculates business-use percentages

### Tax Analysis
AI scans your actual receipts and transactions to find:
- Missed deductions ranked by dollar impact
- Under-claimed expenses and mis-categorized items
- Specific action items with deadlines
- Entity structure advice (e.g., when S-Corp election makes sense)
- Estimated annual tax savings

### Growth & Funding Discovery
- AI-generated growth actions based on your business profile
- Funding opportunity matching (grants, loans, tax credits)
- TinyFish web scraping integration for real-time funding search (when configured)

### Compliance Tracking
Every license, permit, and filing obligation is tracked with:
- Status management (not started → in progress → complete)
- Jurisdiction and category tagging
- Application links and cost estimates
- AI-powered compliance generation for comprehensive coverage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Recharts, Lucide |
| Backend | Express 5, Node.js (ESM) |
| Database | PostgreSQL via Neon Serverless |
| AI | Gemini 2.0 Flash via OpenRouter |
| Banking | Plaid Link + OAuth |
| Auth | Auth0 (OpenID Connect) |
| File Storage | Vercel Blob |
| Deployment | Vercel (static + serverless functions) |
| PDF Parsing | pdfjs-dist |

## Architecture

```
Browser (React SPA)
    ↓ /api/*
Vite Proxy (dev) / Vercel Functions (prod)
    ↓
Express Server
    ├── /api/session, /api/login, /api/logout     → Auth0
    ├── /api/business                              → Business CRUD
    ├── /api/data/businesses/:id/*                 → Full entity CRUD
    ├── /api/workspace/*                           → Workspace operations
    ├── /api/ai/*                                  → AI routes (Gemini)
    ├── /api/plaid/*                               → Plaid banking
    ├── /api/analyze-policy                        → Insurance analysis
    └── /api/health                                → Health check
    ↓
PostgreSQL (Neon) — businesses, contracts, quotes, receipts,
                    compliance, funding, growth, bank transactions,
                    plaid connections, tax summaries, uploaded files
```

## Getting Started

### Prerequisites
- Node.js 20+
- A Neon PostgreSQL database
- OpenRouter API key (for Gemini 2.0 Flash)
- Plaid sandbox credentials
- Auth0 application (optional — app works without it)

### Setup

```bash
cd safeguard
cp .env.example .env
# Fill in your API keys in .env
npm install
```

### Development

```bash
# Terminal 1 — Express backend (port 3001)
npm run server

# Terminal 2 — Vite frontend (port 5173)
npm run dev
```

Open `http://localhost:5173`

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-...

# Banking (Plaid sandbox)
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox

# Auth (optional — skip for local dev)
AUTH0_DOMAIN=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=...
AUTH0_BASE_URL=http://localhost:5173

# File uploads (optional)
BLOB_READ_WRITE_TOKEN=...
```

### Admin Scripts

```bash
# Clear all data from the database
node scripts/admin/clear-all.mjs

# Delete a specific user's business
node scripts/admin/reset-user.mjs user@email.com
```

## User Flow

```
Landing Page → Auth0 Login → AI Onboarding Chat (7 questions)
    → AI generates business plan, compliance items, entity recommendation
    → Optional: Connect bank via Plaid
    → Dashboard with live financial data, documents, insurance, growth tools
```

## Accessibility

- Keyboard navigation throughout the sidebar and all interactive elements
- Focus trapping in modals and mobile drawer
- ARIA labels on navigation, buttons, and form controls
- Responsive design: mobile (drawer nav), tablet (collapsible), desktop (expanded)
- Swipe gestures for mobile sidebar
- High contrast text on dark backgrounds
- Loading states and error messages for all async operations

## Team

Built at InnovationHacks 2026.

## License

MIT
