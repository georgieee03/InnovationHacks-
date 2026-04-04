# SafeGuard

SafeGuard is a business resilience dashboard for small businesses. It combines onboarding, financial visibility, location-based risk context, insurance policy analysis, coverage gap detection, scenario modeling, lightweight education, and a contextual chat assistant inside a single React + Express application.

This repository is no longer a stock Vite app. The current state is a merged codebase with:

- `Kaush-2` as the frontend truth for layout, navigation, page composition, styling, motion, and interaction patterns
- `express-to-groq` as the functional truth for backend runtime, Plaid, Express/Vercel API wiring, and live data flows
- selected `backendfunction` wiring merged into the current UI where it improved onboarding, API consumption, and insurance analysis behavior

This README was rebuilt from the code currently in the repository, not from stale planning docs.

## What the app does

- Onboards a business through a multi-step flow
- Auto-populates city and state from ZIP code using a server route with local fallback data
- Supports three entry paths:
  - connect live accounts with Plaid
  - continue without Plaid using API-enriched and local fallback data
  - load a full demo session
- Computes balances, runway, emergency fund targets, category spending, and cash flow trends
- Parses uploaded PDF insurance policies with `pdfjs-dist`
- Sends policy text to a Groq-backed analysis endpoint and normalizes the response into a UI-friendly summary
- Compares current coverage against recommended coverage and computes gap severity plus a protection score
- Simulates disruption scenarios against current coverage and reserves
- Generates a printable health report
- Provides calculators, learning tracks, challenges, and a contextual chat assistant

## Tech stack

- Frontend: React 19, Vite 8, Framer Motion, Tailwind v4, Recharts, Lucide
- Backend: Express 5, Node ESM
- Database: Neon Postgres via `@neondatabase/serverless`
- Banking: Plaid Link + OAuth resume flow
- Policy analysis: Groq chat completions
- Client chat assistant: direct Anthropic browser call when configured, otherwise local smart fallback
- PDF parsing: `pdfjs-dist`
- Deployment target: Vercel static build + server adapter

## Architecture

### Frontend shell

The active application shell lives in:

- `src/App.jsx`
- `src/components/layout/CollapsibleSidebar.jsx`
- `src/components/layout/TopBar.jsx`
- `src/index.css`

This is the canonical UI shell. Backend branches are not allowed to replace it with older sidebar or tab-navigation structures.

### State and data flow

The main client orchestration layer is `src/context/AppContext.jsx`. It owns:

- onboarding state
- viewport and responsive sidebar state
- business, accounts, transactions, risk factors, financial metrics
- Plaid connection state
- insurance analysis state

It hydrates sessions from local fallback data first, then enriches from API routes, and finally swaps in Plaid data when connected.

### Backend

The Express runtime is mounted in:

- `server/app.js`
- `server/index.js`
- `api/[...path].js`

The API surface is split across:

- `server/routes/business.js`
- `server/routes/data.js`
- `server/routes/plaid.js`
- `server/routes/analyze.js`

### Deployment shape

- Vite builds the frontend into `dist/`
- Vercel serves the built client
- `api/[...path].js` exports the Express app for `/api/*`
- Vite dev and preview proxy `/api` to `http://localhost:3001`
- a second HTML entry point, `plaid-oauth.html`, exists for Plaid OAuth resume

## Main user flows

### 1. Onboarding

`src/components/Onboarding.jsx` is a four-step wizard:

1. Business identity
2. Location lookup
3. Financial baseline
4. Entry path selection

Important behavior:

- business types are fetched from `/api/business-types` with local JSON fallback
- ZIP lookup goes through `/api/zip-lookup` and falls back to local risk data
- city and state can switch to manual entry when no lookup data is available
- the screen is viewport-bounded with a scrollable middle section and fixed footer actions

### 2. Plaid entry

Plaid now launches from onboarding, not from the financial dashboard.

Files involved:

- `src/components/financial/PlaidConnect.jsx`
- `src/services/plaidSession.js`
- `src/plaid-oauth.jsx`
- `plaid-oauth.html`
- `server/routes/plaid.js`

Flow:

1. Validate onboarding data
2. Prepare a business session locally and through the backend
3. Create a Plaid link token
4. Open Plaid Link from an in-app modal
5. Exchange the public token server-side
6. Load live Plaid accounts and transactions
7. Complete onboarding with live financial data

Notes:

- OAuth banks may still redirect through the institution site and back to `/plaid-oauth.html`
- Plaid session state is stored in `sessionStorage`
- `plaid_items` is persisted in Postgres

### 3. Financial dashboard

`src/components/financial/FinancialOverview.jsx` renders:

- summary metric cards
- linked account balances
- monthly cash flow chart
- category spending chart
- emergency fund guidance
- recent transactions

The dashboard supports both:

- demo or fallback data from `src/data/transactions.json`
- live Plaid data loaded through the API

### 4. Insurance analyzer

`src/components/insurance/InsuranceAnalyzer.jsx` drives the insurance flow:

1. Upload a policy PDF or load the demo policy
2. Extract text with `src/services/pdfParser.js`
3. Send text to `/api/analyze-policy`
4. Normalize the result in `src/services/llmService.js`
5. Fetch recommendations from `/api/recommendations` or local fallback
6. Compute gaps and protection score via `src/services/gapAnalyzer.js`
7. Persist gap analysis with `/api/save-gap-analysis` when a business record exists

Important limits:

- PDF support is text extraction only
- there is no OCR pipeline for scanned image-only PDFs
- the analyzer explicitly rejects non-policy uploads instead of returning fake results

### 5. Secondary tools

The rest of the app layers on top of the same business, financial, and insurance state:

- `ActionPlan`: prioritizes gaps and savings targets
- `Calculators`: emergency fund, interruption cost, insurance estimator
- `RiskSimulator`: modeled event loss versus current coverage and reserves
- `HealthReport`: printable summary
- `ChatBot`: contextual assistant
- `Education`: learning tracks with quizzes
- `Challenges`: lightweight progress and gamification

## Environment variables

Copy `.env.example` to `.env` and fill in the values you actually need.

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `VITE_ANTHROPIC_API_KEY` | Optional | browser chat | Enables direct Anthropic calls from the chat assistant |
| `VITE_API_URL` | Optional | browser | Overrides same-origin `/api`; usually leave blank in local dev |
| `PLAID_CLIENT_ID` | Required for Plaid | server | Plaid client ID |
| `PLAID_SECRET` | Required for Plaid | server | Plaid secret |
| `PLAID_ENV` | Required for Plaid | server | Usually `sandbox` for local work |
| `PLAID_REDIRECT_URI` | Optional but recommended for OAuth | server | Explicit Plaid OAuth return URI |
| `DATABASE_URL` | Required for backend persistence | server | Neon/Postgres connection string |
| `GROQ_API_KEY` | Required for live policy analysis | server | Groq API key for insurance analysis |

## Local development

### Prerequisites

- Node.js 20+ recommended
- npm
- a Postgres database if you want backend persistence
- Plaid sandbox credentials if you want live Plaid testing
- Groq key if you want live policy analysis

### Install

```bash
npm install
```

### Configure environment

Create `.env` from `.env.example` and set at minimum:

```bash
DATABASE_URL=postgresql://...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox
GROQ_API_KEY=...
```

If you are testing OAuth institutions with Plaid, also configure:

```bash
PLAID_REDIRECT_URI=http://localhost:5173/plaid-oauth.html
```

### Start the backend

```bash
npm run server
```

This serves the API at `http://localhost:3001/api`.

### Start the frontend

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` to the Express server.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

Preview still expects the backend server to be running on `http://localhost:3001`.

## Database

The schema lives in `db/schema.sql`.

Tables:

- `businesses`
- `accounts`
- `transactions`
- `policy_analyses`
- `gap_analyses`
- `coverage_recommendations`
- `risk_factors`
- `business_types`
- `plaid_items`

There is no checked-in seeding script for Neon/Postgres. The app stays usable because several frontend flows fall back to local JSON data:

- business types
- risk factors
- demo business session
- demo transactions
- coverage recommendations

If you want the backend lookups to return seeded data from the database, seed those tables manually.

## API surface

### Health

- `GET /api/health`

### Business

- `POST /api/business`
- `GET /api/business`
- `GET /api/business?id=<id>`

### Shared data

- `GET /api/zip-lookup?zip=<zip>`
- `GET /api/business-types`
- `GET /api/risk-factors`
- `GET /api/risk-factors?zip=<zip>`
- `GET /api/recommendations?businessType=<type>`
- `GET /api/transactions?businessId=<id>`

### Insurance analysis

- `POST /api/analyze-policy`
- `POST /api/save-gap-analysis`

### Plaid

- `POST /api/plaid/create-link-token`
- `POST /api/plaid/exchange-token`
- `GET /api/plaid/accounts?user_id=<id>`
- `GET /api/plaid/transactions?user_id=<id>&days=<n>`

## Deployment notes

`vercel.json` is intentionally minimal:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `framework`: `vite`

The Express adapter for Vercel is `api/[...path].js`.

Operational notes:

- if `VITE_API_URL` points to `localhost`, the client intentionally ignores it outside a localhost page context
- Plaid OAuth redirect URIs must be allowlisted in the Plaid dashboard
- the policy analyzer requires a server-side Groq key

## Repository map

This map covers the source, config, docs, scripts, and assets that define the project. It intentionally excludes vendor and generated directories such as `node_modules/`, `dist/`, and `.git/`.

### Root config and entry files

- `.env.example`: example env file for frontend and server secrets
- `.gitignore`: ignores env files, logs, build artifacts, and editor cruft
- `README.md`: project documentation
- `eslint.config.js`: flat ESLint config for JS/JSX and React hooks
- `index.html`: main Vite HTML entry, theme bootstrap, font preload
- `package.json`: scripts and package manifest
- `package-lock.json`: locked dependency tree
- `plaid-oauth.html`: dedicated HTML entry used for Plaid OAuth resume
- `vercel.json`: Vercel build config
- `vite.config.js`: Vite config with Tailwind, second HTML entry, and `/api` proxy

### API, server, and database

- `api/[...path].js`: Vercel adapter that exports the Express app
- `server/app.js`: Express composition root
- `server/index.js`: local server bootstrap on port 3001
- `server/db.js`: lazy Neon client factory
- `server/routes/business.js`: create and read business records
- `server/routes/data.js`: ZIP lookup, business types, risk factors, recommendations, transactions
- `server/routes/plaid.js`: Plaid link token, token exchange, accounts, transactions
- `server/routes/analyze.js`: Groq-backed policy analysis and gap analysis persistence
- `db/schema.sql`: relational schema including Plaid item storage

### Scripts

- `scripts/generate-pdf.mjs`: generates the demo policy PDF in `public/demo-policies/`

### Public assets

- `public/favicon.svg`: app favicon
- `public/icons.svg`: icon sprite asset
- `public/demo-policies/marias-bakery-policy.pdf`: demo policy used by the analyzer

### Planning and design docs

- `.kiro/specs/enterprise-ui-overhaul/requirements.md`: archived UI overhaul requirements
- `.kiro/specs/enterprise-ui-phase4-typography/requirements.md`: archived typography overhaul requirements
- `.kiro/specs/enterprise-ui-phase4-typography/design.md`: archived typography design notes

### Frontend root

- `src/main.jsx`: React root and `ThemeProvider` mount
- `src/App.jsx`: app shell, page registry, onboarding gate, sidebar/topbar wiring
- `src/plaid-oauth.jsx`: OAuth resume entry for Plaid
- `src/index.css`: global theme tokens, glass surfaces, layout styles, typography, reflective stats

### Context

- `src/context/AppContext.jsx`: main app state, onboarding hydration, Plaid loading, responsive shell state
- `src/context/ThemeContext.jsx`: dark/light theme state and persistence

### Services

- `src/services/apiClient.js`: centralized fetch client and endpoint wrappers
- `src/services/financialCalculator.js`: computes balances, runway, emergency fund, category totals, recent transactions
- `src/services/gapAnalyzer.js`: normalizes recommendations and calculates gaps plus protection score
- `src/services/llmService.js`: client-side normalization for policy analysis responses
- `src/services/pdfParser.js`: PDF text extraction using `pdfjs-dist`
- `src/services/plaidSession.js`: sessionStorage helpers for Plaid launch and OAuth resume

### Data

- `src/data/businessTypes.json`: local business type fallback dataset
- `src/data/coverageRecommendations.json`: local coverage recommendation fallback dataset
- `src/data/riskFactors.json`: local location risk and emergency fund multiplier fallback dataset
- `src/data/transactions.json`: demo business, accounts, and transactions

### Hooks

- `src/hooks/useAnimatedCounter.js`: animated number helper
- `src/hooks/useCursorPosition.js`: cursor tracking and card tilt helpers
- `src/hooks/useKeyboardNav.js`: keyboard navigation helper for the sidebar
- `src/hooks/useScrollAnimation.js`: scroll-triggered motion helper
- `src/hooks/useSwipeGesture.js`: mobile swipe open/close helper for the drawer
- `src/hooks/useTheme.js`: theme context consumer

### Layout and navigation

- `src/components/layout/BusinessInfo.jsx`: business summary block inside the sidebar
- `src/components/layout/CollapsibleSidebar.jsx`: active responsive navigation shell
- `src/components/layout/NavigationItem.jsx`: sidebar nav item with tooltip support
- `src/components/layout/TopBar.jsx`: active top header with menu control and theme toggle

### Onboarding and legacy shell files

- `src/components/Onboarding.jsx`: active multi-step onboarding wizard
- `src/components/Sidebar.jsx`: legacy sidebar component retained in tree, not used by `App.jsx`
- `src/components/TabNavigation.jsx`: legacy top tab navigation retained in tree, not used by `App.jsx`

### Financial features

- `src/components/financial/AccountBalances.jsx`: linked account cards
- `src/components/financial/CashFlowChart.jsx`: monthly income and expense bar chart
- `src/components/financial/EmergencyFund.jsx`: emergency fund target and gap display
- `src/components/financial/FinancialOverview.jsx`: financial landing page
- `src/components/financial/PlaidConnect.jsx`: in-app Plaid launcher and OAuth-aware flow
- `src/components/financial/SpendingChart.jsx`: category spending pie chart
- `src/components/financial/TransactionList.jsx`: recent transaction table

### Insurance features

- `src/components/insurance/GapAnalysis.jsx`: grouped gap result sections
- `src/components/insurance/InsuranceAnalyzer.jsx`: upload/demo driver for policy analysis
- `src/components/insurance/PolicyCard.jsx`: coverage recommendation and status card
- `src/components/insurance/PolicySummary.jsx`: parsed policy summary view
- `src/components/insurance/PolicyUpload.jsx`: upload dropzone

### Action plan

- `src/components/actionplan/ActionPlan.jsx`: protection score, timeline, and recommendations page
- `src/components/actionplan/RecommendationCard.jsx`: recommendation card
- `src/components/actionplan/RiskTimeline.jsx`: prioritized gap timeline
- `src/components/actionplan/SavingsProjection.jsx`: reserve and savings target projection

### Other feature pages

- `src/components/calculators/Calculators.jsx`: emergency fund, interruption, and insurance cost calculators
- `src/components/chat/ChatBot.jsx`: contextual assistant with Anthropic or local fallback
- `src/components/education/Education.jsx`: learning tracks and quizzes
- `src/components/gamification/Challenges.jsx`: progress and badge system
- `src/components/report/HealthReport.jsx`: printable resilience report
- `src/components/simulator/RiskSimulator.jsx`: disruption simulator

### Shared UI

- `src/components/shared/CursorSpotlight.jsx`: global cursor aura
- `src/components/shared/EnhancedInput.jsx`: older styled input retained in tree
- `src/components/shared/LoadingSpinner.jsx`: generic spinner component retained in tree
- `src/components/shared/MagneticButton.jsx`: experimental button retained in tree
- `src/components/shared/MetricCard.jsx`: financial summary card
- `src/components/shared/ParticleGrid.jsx`: ambient background grid effect
- `src/components/shared/RippleButton.jsx`: primary shared button used in onboarding and Plaid
- `src/components/shared/ScrollProgress.jsx`: page scroll progress indicator
- `src/components/shared/SkeletonLoader.jsx`: skeleton placeholders retained in tree
- `src/components/shared/StatValue.jsx`: reflective metric text component
- `src/components/shared/StatusBadge.jsx`: policy status badge
- `src/components/shared/ThemeToggle.jsx`: active dark/light mode toggle
- `src/components/shared/Tooltip.jsx`: shared tooltip

### Utilities

- `src/utils/constants.js`: category labels, colors, and risk-level color helpers
- `src/utils/formatCurrency.js`: currency formatting helpers

### Static assets

- `src/assets/hero.png`: image asset retained in the repo
- `src/assets/react.svg`: default React asset retained in the repo
- `src/assets/vite.svg`: default Vite asset retained in the repo

## Legacy and cleanup notes

The following files exist in the repository but are not part of the active main shell or main user flow:

- `src/components/Sidebar.jsx`
- `src/components/TabNavigation.jsx`
- `src/components/shared/EnhancedInput.jsx`
- `src/components/shared/LoadingSpinner.jsx`
- `src/components/shared/MagneticButton.jsx`
- `src/components/shared/SkeletonLoader.jsx`
- `src/assets/react.svg`
- `src/assets/vite.svg`

They are safe to keep for now, but they should be treated as cleanup candidates rather than source-of-truth architecture.

## Known limitations and caveats

- PDF analysis is text extraction only. Scanned image PDFs will not parse reliably without OCR.
- Chat assistant Anthropic calls are browser-side when `VITE_ANTHROPIC_API_KEY` is present.
- `src/data/businessTypes.json` still contains corrupted legacy icon strings; the UI now ignores them and uses Lucide icons instead.
- The sidebar includes a disabled `Settings` placeholder.
- Vite builds currently emit a large-chunk warning. The app still builds successfully.
- There is no checked-in DB seeding script for `business_types`, `risk_factors`, or `coverage_recommendations`.

## Current health snapshot

Based on the current repository state:

- the app builds successfully with `npm run build`
- local dev expects both the Vite dev server and the Express API server
- the onboarding ZIP auto-fill route is live and supports fallback behavior
- Plaid launches from onboarding through an in-app modal and supports OAuth resume
- insurance uploads are guarded against non-policy documents

If you are onboarding new contributors, start with:

1. `src/App.jsx`
2. `src/context/AppContext.jsx`
3. `src/components/Onboarding.jsx`
4. `src/components/financial/PlaidConnect.jsx`
5. `server/routes/*.js`
6. `src/services/*.js`

