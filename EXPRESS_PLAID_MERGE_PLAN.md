# Express + Plaid Merge Plan

## Objective
Merge the functional work from `origin/express-to-groq` into the current `pr-1` branch while treating:

- current `pr-1` / `Kaush-2` UI as the full frontend source of truth
- `origin/express-to-groq` as the backend and Plaid source of truth
- selected frontend API wiring from `origin/backendfunction` as supplemental functional logic

This is a phased execution plan for a follow-up implementation chat.

## Fixed Decisions

1. Functional truth is `origin/express-to-groq`.
2. Frontend truth is `Kaush-2` in full, not just styling direction.
3. Backend branches may supply logic, data flow, and integrations, but must not replace the `Kaush-2` shell, navigation, component structure, or visual system.
4. Keep both Express and Vercel adapter support, with Vercel routing into Express via `api/[...path].js`.
5. Plaid entry belongs in onboarding, where the user chooses Plaid or demo data.
6. Bring over visible backend behaviors:
   - dynamic business type loading
   - zip-based city/state autofill
7. After successful Plaid connection, live accounts and transactions fully replace mock/demo financial data.
8. Pull in backend policy-analysis/API wiring from `origin/backendfunction` in the same overall merge effort.

## Merge Rules

### Keep From Current `pr-1`

- all frontend layout, page composition, and interaction patterns from `Kaush-2`
- `src/App.jsx` layout architecture
- responsive shell and current navigation model
- `src/components/layout/*`
- current theme system and light/dark support
- current glass, motion, typography, and shared styling in `src/index.css`
- current ambient effects and polished shared UI primitives
- current page composition and page registry

### Keep From `origin/express-to-groq`

- Express backend in `server/*`
- Plaid routes and data loading flow
- Vercel adapter `api/[...path].js`
- deployment files that support the Express app in Vercel
- Plaid dependencies and runtime scripts

### Pull From `origin/backendfunction`

- `src/services/apiClient.js`
- API-backed onboarding enrichment pattern
- API-backed insurance analysis wiring
- recommendation fetching and gap-analysis persistence flow
- API fallback strategy for business types, risk factors, and recommendations

### Explicitly Do Not Adopt From Backend Branches

- any replacement of `Kaush-2` page structure, flow, or component hierarchy
- old `Sidebar` / `TabNavigation` app shell
- old `App.jsx` dashboard layout
- deletion of current theme files and current layout files
- old styling system that conflicts with `pr-1` design truth
- duplicate serverless `api/*` route tree from `origin/backendfunction`

## Conflict Hotspots

### 1. `src/App.jsx`

Target state:

- keep current `pr-1` app shell
- do not revert to the old fixed sidebar / tab navigation structure
- if useful, selectively port the error boundary behavior from `origin/backendfunction`

Resolution rule:

- `Kaush-2` layout wins completely
- functional branches may only contribute logic, not layout structure

### 2. `src/context/AppContext.jsx`

This is the primary merge hub.

Target state:

- keep current viewport, sidebar, and navigation state from `pr-1`
- add loading and backend-enrichment flow from `origin/backendfunction`
- add Plaid state and live-data replacement flow from `origin/express-to-groq`

Required merged behavior:

- onboarding can create and enrich a business record
- demo load still works
- Plaid connection state is stored centrally
- live Plaid data replaces demo/mock accounts and transactions after success
- financial metrics recalculate from live data
- current page shell behavior remains intact

Likely merged state surface:

- `loading`
- `plaidConnected`
- `loadPlaidData`
- API-backed `onboard`
- API-backed `loadDemo`
- current sidebar and viewport controls

### 3. `src/components/Onboarding.jsx`

Target state:

- preserve the `Kaush-2` onboarding design system and interaction language
- add backend behaviors from `origin/backendfunction`
- move Plaid choice into onboarding instead of `FinancialOverview`

Required merged behavior:

- load business types from API with local fallback
- auto-fill city and state from zip with local fallback
- present explicit entry options:
  - connect with Plaid
  - load demo data
  - optionally continue without Plaid if needed by current flow
- if Plaid succeeds, proceed into the app with live accounts and transactions

Implementation note:

- do not drop the current `pr-1` onboarding styling
- likely adapt `PlaidConnect.jsx` into an onboarding-compatible component or extract its logic into a reusable hook/component

### 4. `src/components/financial/FinancialOverview.jsx`

Target state:

- keep current `Kaush-2` financial page structure and styling
- do not keep the old inline Plaid card as the primary connection entry point

Possible optional carryover:

- a subtle connected status panel or source badge if useful
- a refresh/reload action for Plaid data if needed

Rule:

- onboarding is the place where Plaid begins
- financial overview may display state, not own the initial connection workflow

### 5. `src/components/financial/PlaidConnect.jsx`

Target state:

- reuse the connection logic from `origin/express-to-groq`
- redesign the presentation for onboarding context

Required behavior:

- create link token
- open Plaid Link
- exchange public token
- set `plaidConnected`
- trigger `loadPlaidData`
- allow live financial data to replace demo data

### 6. Insurance Analysis Stack

Files:

- `src/components/insurance/InsuranceAnalyzer.jsx`
- `src/services/llmService.js`
- `src/services/apiClient.js`
- `src/services/gapAnalyzer.js`
- `src/components/insurance/PolicySummary.jsx`
- possibly `src/components/insurance/GapAnalysis.jsx`

Target state:

- keep current polished analyzer UI
- replace direct client-side LLM dependence with API-backed policy analysis flow
- fetch recommendations from API with local fallback
- save gap analysis and protection score when business context exists

Important shape mismatch to resolve:

- current `PolicySummary` and `llmService` expect one summary shape
- backend API returns the backendfunction summary shape

Resolution rule:

- normalize the API response into a single frontend summary format at the service boundary
- avoid scattering format conversion throughout UI components

Recommended approach:

- update `src/services/llmService.js` to call `api.analyzePolicy`
- add a normalization helper there
- keep `PolicySummary.jsx` as presentation-only

### 7. Backend Runtime and Deployment

Files:

- `server/app.js`
- `server/index.js`
- `server/routes/plaid.js`
- `server/routes/business.js`
- `server/routes/data.js`
- `server/routes/analyze.js`
- `api/[...path].js`
- `vercel.json`
- `.env.example`
- `package.json`
- `package-lock.json`
- `db/schema.sql`

Target state:

- local Express runtime for development
- Vercel adapter routing all `/api/*` traffic into the Express app
- no duplicate serverless route tree from `origin/backendfunction`

Dependency direction:

- keep npm lockfile strategy from `origin/express-to-groq`
- do not switch the repo to pnpm as part of this merge

## Execution Phases

## Phase 1: Backend Substrate Import

Goal:
Bring in the Express backend and deployment support without touching the design shell.

Scope:

- merge `server/*`
- merge `api/[...path].js`
- merge `vercel.json`
- merge env and dependency updates from `origin/express-to-groq`
- keep existing frontend UI files unchanged except for dependency-safe imports if required

Validation:

- install deps
- frontend build passes
- server starts locally
- Vercel adapter file resolves cleanly

## Phase 2: Shared API Client and Context Merge

Goal:
Create one merged data layer that supports both current UI state and backend/Plaid flows.

Scope:

- add `src/services/apiClient.js` from `origin/backendfunction`
- merge `AppContext.jsx`
- preserve current responsive sidebar/mobile shell state
- add loading, API onboarding enrichment, Plaid connection state, and live data refresh logic

Validation:

- onboarding still opens correctly
- demo flow still reaches the dashboard
- no layout regressions
- current tabs/pages still render

## Phase 3: Onboarding as Source Selection

Goal:
Move Plaid choice into onboarding while preserving the current `pr-1` design language.

Scope:

- redesign `PlaidConnect` for onboarding use
- integrate dynamic business type loading
- integrate city/state autofill
- add source choice between Plaid and demo

Validation:

- user can load demo from onboarding
- user can initiate Plaid from onboarding
- successful Plaid flow lands in dashboard with live data replacing mocks

## Phase 4: Financial Data Integration

Goal:
Ensure the financial dashboard uses the merged live/demo data model cleanly.

Scope:

- reconcile `FinancialOverview.jsx`
- optionally add a connected/live-data status treatment that matches current design truth
- verify accounts, transactions, charts, and runway metrics update from Plaid data

Validation:

- live balances render in current polished cards
- transactions/charts use live data
- demo and live sessions both behave predictably

## Phase 5: Insurance Analyzer API Merge

Goal:
Merge backend policy-analysis wiring into the current insurance UI.

Scope:

- convert `llmService.js` to API-backed analysis
- merge backendfunction analyzer flow into current `InsuranceAnalyzer.jsx`
- fetch recommendations from API
- persist gap analysis and protection score
- normalize backend summary shape for current UI

Validation:

- demo policy analysis still works
- uploaded policy analysis still works
- API failures fall back gracefully
- current analyzer visuals remain intact

## Phase 6: Deployability and Hardening

Goal:
Finish runtime, deployment, and regression checks.

Scope:

- confirm scripts in `package.json`
- confirm `.env.example`
- confirm server and Vercel entrypoints
- clean up any duplicate or dead code introduced by merge

Validation:

- `npm run build`
- backend boot smoke test
- Plaid flow smoke test
- onboarding demo flow smoke test
- insurance analysis smoke test

## Suggested File Order For Implementation Chat

1. `package.json`
2. backend runtime files in `server/*`
3. `api/[...path].js`
4. `src/services/apiClient.js`
5. `src/context/AppContext.jsx`
6. `src/components/Onboarding.jsx`
7. `src/components/financial/PlaidConnect.jsx`
8. `src/components/financial/FinancialOverview.jsx`
9. `src/services/llmService.js`
10. `src/components/insurance/InsuranceAnalyzer.jsx`
11. supporting UI normalization files

## Acceptance Criteria

- `Kaush-2` remains the canonical frontend across layout, navigation, styling, and component composition
- onboarding supports both demo and Plaid-first entry
- live Plaid data replaces mock/demo financial data after connection
- backend-driven business types and zip autofill work with local fallback
- insurance analysis uses backend APIs and persists results
- Express runs locally and through Vercel adapter
- no old backend branch layout artifacts overwrite current UI shell

## Notes For Next Chat

- Start from this branch as-is.
- Treat this document as the merge contract.
- Implement phase-by-phase, validating after each phase rather than attempting a single blind merge.
