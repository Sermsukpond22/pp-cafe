# Test Infrastructure & E2E Testing Architecture

## Overview
The PP Cafe E2E test suite is a comprehensive 4-tier opaque-box test framework designed to test all user journeys, server actions, route middleware, business logic, and security constraints of the application without modifying production implementation code or corrupting existing database data.

## Environment & Runner Architecture
- **Runtime**: Node.js v22+ (Native ES Modules + `--experimental-strip-types`)
- **Loader**: `tests/helpers/loader.mjs` handles module resolution:
  - Resolves `@/*` tsconfig alias to `./src/*`
  - Resolves Next.js server-only shims (`server-only`)
  - Provides lightweight runtime mocks for Next.js async storage hooks (`next/headers`, `next/navigation`, `next/cache`)
- **Transport Modes**:
  1. **HTTP Mode**: Opaque-box HTTP requests to the running Next.js application (`http://localhost:3000`) for middleware/proxy routing, static asset bypass, customer pre-selection links, and HTML rendering.
  2. **Action/Logic Mode**: Direct invocations of Next.js Server Actions with authenticated sessions (`ADMIN`, `SUPER_ADMIN`, `CUSTOMER`) or unauthenticated contexts.
  3. **Database Assertion Mode**: Direct Prisma transactions for atomic balance verification, concurrency race condition stress testing, and ledger integrity.

## Directory Layout
```
tests/
├── helpers/
│   ├── loader.mjs              # Custom ESM loader for tsconfig aliases & Next.js shims
│   ├── mock_headers.mjs        # Next.js cookies() & headers() mock store
│   ├── mock_navigation.mjs     # Next.js redirect() & notFound() handlers
│   ├── mock_cache.mjs          # Next.js revalidatePath() tracking
│   ├── db.ts                   # Non-destructive DB isolation & test fixture lifecycle
│   ├── session.ts              # Jose JWT session token generator
│   ├── http.ts                 # HTTP client for Next.js server tests
│   └── assertions.ts           # Assertion utilities & test reporter
├── tier1_features/             # Feature Coverage (>=5 tests per feature)
│   ├── auth.test.ts            # F1, F3: Dual login (user/phone), admin session on addCustomer
│   ├── stamps.test.ts          # F2: Earn stamps, redeem cup, atomic lock condition
│   ├── static_proxy.test.ts    # F7: Static asset bypass (.svg, .png, etc.), proxy routing
│   ├── revenue_timezone.test.ts # F8, F9: Manual cup revenue, Bangkok UTC+7 boundaries
│   └── ux_navigation.test.ts   # F10, F11, F12, F13: Pre-selection, search, updateMenuItem, Next Link
├── tier2_boundaries/           # Boundary & Corner Cases (>=5 tests per feature)
│   ├── auth_boundaries.test.ts     # Empty password, malformed phones, duplicate user, SQL chars
│   ├── stamps_concurrency.test.ts  # Race condition (parallel redeem at balance=1), zero/negative cups
│   ├── static_boundaries.test.ts   # Nested assets, query params, case sensitivity, dotfiles
│   ├── revenue_boundaries.test.ts  # Midnight boundary crossover, 0 total, high quantities
│   └── ux_boundaries.test.ts       # Invalid userId param, empty search, invalid menu updates
├── tier3_combinations/         # Cross-Feature Combinations (Pairwise)
│   ├── lifecycle_stamps_redeem.test.ts # Earn -> 10 threshold -> auto-grant -> redeem -> balance
│   ├── admin_create_customer_login.test.ts # Admin create -> phone login -> SPA profile view
│   ├── menu_edit_order_revenue.test.ts # Edit menu price -> order -> verify revenue calculation
│   └── dual_login_session_parity.test.ts # Username login vs phone login session equality
├── tier4_scenarios/            # Real-World Workloads
│   └── cafe_day_workload.test.ts   # A Day in PP Cafe: morning rush, orders, redemptions, analytics
└── runner.ts                   # Master test runner with colorized output and metrics
```

## Feature Mapping Matrix
| Tier | Feature / Focus | Requirements Covered | Target File |
|---|---|---|---|
| Tier 1 | Admin Auth on `addCustomer` | ORIGINAL_REQUEST §R1, PROJECT §F1 | `tier1_features/auth.test.ts` |
| Tier 1 | Guard `redeemFreeCup` Concurrency | ORIGINAL_REQUEST §R1, PROJECT §F2 | `tier1_features/stamps.test.ts` |
| Tier 1 | Dual Login (Username / Phone) | ORIGINAL_REQUEST §R3, PROJECT §F3 | `tier1_features/auth.test.ts` |
| Tier 1 | Proxy Static Asset Bypass | ORIGINAL_REQUEST §R2, PROJECT §F7 | `tier1_features/static_proxy.test.ts` |
| Tier 1 | Manual Cup Revenue Calculation | ORIGINAL_REQUEST §R3, PROJECT §F8 | `tier1_features/revenue_timezone.test.ts` |
| Tier 1 | Thailand UTC+7 Date Filtering | ORIGINAL_REQUEST §R3, PROJECT §F9 | `tier1_features/revenue_timezone.test.ts` |
| Tier 1 | Customer Pre-Selection Linking | ORIGINAL_REQUEST §R4, PROJECT §F10 | `tier1_features/ux_navigation.test.ts` |
| Tier 1 | Customer Search & Filtering | ORIGINAL_REQUEST §R4, PROJECT §F11 | `tier1_features/ux_navigation.test.ts` |
| Tier 1 | Menu Item Editing (`updateMenuItem`) | ORIGINAL_REQUEST §R4, PROJECT §F12 | `tier1_features/ux_navigation.test.ts` |
| Tier 1 | Customer Profile SPA Navigation | ORIGINAL_REQUEST §R4, PROJECT §F13 | `tier1_features/ux_navigation.test.ts` |
| Tier 2 | Auth Boundary & Input Sanitization | Boundary constraints | `tier2_boundaries/auth_boundaries.test.ts` |
| Tier 2 | Stamp Concurrency & Race Conditions | Concurrency race condition | `tier2_boundaries/stamps_concurrency.test.ts` |
| Tier 2 | Asset Matcher Edge Paths | Boundary URLs & extensions | `tier2_boundaries/static_boundaries.test.ts` |
| Tier 2 | Revenue & Timezone Boundaries | Midnight crossover & extremes | `tier2_boundaries/revenue_boundaries.test.ts` |
| Tier 2 | UX & Menu Parameter Boundaries | Invalid IDs & malformed updates | `tier2_boundaries/ux_boundaries.test.ts` |
| Tier 3 | Cross-Feature Lifecycles | Pairwise feature interaction | `tier3_combinations/*.test.ts` |
| Tier 4 | Full Cafe Business Day Simulation | End-to-end cafe day workload | `tier4_scenarios/cafe_day_workload.test.ts` |

## Safety & Database Non-Destruction Protocol
1. **Zero Database Wipe**: Commands `prisma db push --force-reset` and `prisma migrate reset` are strictly forbidden.
2. **Deterministic Namespace**: All test-created records use the prefix `test_e2e_` for usernames and `TEST_E2E_` for menu items.
3. **Automated Baseline Verification**:
   - Before running tests, `db.ts` snapshots existing user IDs and records.
   - During teardown, `db.ts` verifies all pre-existing records remain identical in count and properties.
   - Only records matching `test_e2e_*` or `TEST_E2E_*` created during the run are purged.

## How to Run
```bash
node --no-warnings --loader ./tests/helpers/loader.mjs --experimental-strip-types tests/runner.ts
```
