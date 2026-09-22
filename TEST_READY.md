# TEST_READY: 4-Tier Opaque-Box E2E Test Suite

## Status: READY & 100% PASSING (61/61 Tests)

The PP Cafe E2E test suite has been established, verified, and executed against the application. All 61 test cases across all four tiers pass with 0 errors, validating all security, concurrency, static routing, business logic, and UX requirements without database data corruption or modifications to implementation files.

---

## Quick Start / Execution Command

Execute the complete 4-tier E2E test suite with the following command:

```bash
node --no-warnings --loader ./tests/helpers/loader.mjs --experimental-strip-types tests/runner.ts
```

---

## Test Suite Metrics & Tier Breakdown

| Tier | Name | Test Count | Pass / Fail | Pass Rate |
|---|---|---|---|---|
| **Tier 1** | Feature Coverage | 28 | 28 / 0 | 100% |
| **Tier 2** | Boundary & Corner Cases | 27 | 27 / 0 | 100% |
| **Tier 3** | Cross-Feature Combinations | 4 | 4 / 0 | 100% |
| **Tier 4** | Real-World Workload Scenarios | 2 | 2 / 0 | 100% |
| **Total** | **All Tiers Combined** | **61** | **61 / 0** | **100%** |

---

## Detailed Test Inventory by Tier

### Tier 1: Feature Coverage (28 Tests)
- **Auth & Role Security (6 tests)**:
  - `T1.1.1`: Customer login with valid username succeeds (redirect to `/dashboard`).
  - `T1.1.2`: Customer login with registered phone number succeeds (Dual Login F3).
  - `T1.1.3`: `addCustomer` with active `ADMIN` session succeeds and creates customer.
  - `T1.1.4`: `addCustomer` with active `SUPER_ADMIN` session succeeds.
  - `T1.1.5`: Rejection of unauthenticated `addCustomer` (Security Guard F1).
  - `T1.1.6`: Rejection of `CUSTOMER` role calling `addCustomer` (Role Guard F1).
- **Stamps & Concurrency (6 tests)**:
  - `T1.2.1`: Admin adds stamps to customer (happy path `EARN` transaction).
  - `T1.2.2`: Earning 10 stamps auto-grants 1 `freeRedeem` and resets stamps (modulo 10).
  - `T1.2.3`: Admin redeems free cup for customer with balance >= 1 (`REDEEM` transaction).
  - `T1.2.4`: Redeem rejected when `freeRedeems` is 0 ("ลูกค้าไม่มีสิทธิ์แลกน้ำฟรี").
  - `T1.2.5`: Concurrency lock prevents negative `freeRedeems` under race condition (F2).
  - `T1.2.6`: Unauthenticated or customer caller rejected from `redeemFreeCup`.
- **Static Asset Bypass & Proxy Routing (6 tests)**:
  - `T1.3.1`: Public static asset `/file.svg` accessible without `/login` redirect (F7).
  - `T1.3.2`: Static asset `/favicon.ico` does not redirect to `/login` (F7).
  - `T1.3.3`: Unauthenticated access to `/admin/dashboard` redirects to `/login` (307).
  - `T1.3.4`: Customer session accessing `/admin/dashboard` redirects to `/dashboard` (307).
  - `T1.3.5`: Regular `ADMIN` accessing `/admin/manage-admins` redirects to `/admin/dashboard` (307).
  - `T1.3.6`: `SUPER_ADMIN` accessing `/admin/manage-admins` returns HTTP 200.
- **Revenue & Bangkok Timezone (5 tests)**:
  - `T1.4.1`: Multi-item menu order records `totalAmount` matching sum of item prices (F8).
  - `T1.4.2`: Manual cup entry records `totalAmount` reflecting sales instead of 0 Baht (F8).
  - `T1.4.3`: Bangkok start of day is strictly 17:00:00 UTC of preceding calendar day (F9).
  - `T1.4.4`: Transaction created at 06:30 AM Bangkok time is included in today's sales (F9).
  - `T1.4.5`: Transaction at 23:55 PM yesterday Bangkok time is excluded from today's sales (F9).
- **UX & Navigation (5 tests)**:
  - `T1.5.1`: Customer detail page contains link to `/admin/add-stamp?userId=` (F10).
  - `T1.5.2`: Add stamp page receives `userId` searchParam for pre-selection (F10).
  - `T1.5.3`: Customer search matches by name, phone, and username (F11).
  - `T1.5.4`: `updateMenuItem` updates name, price, and category in place (F12).
  - `T1.5.5`: Customer profile back link uses Next.js `<Link>` client-side navigation (F13).

### Tier 2: Boundary & Corner Cases (27 Tests)
- **Auth Boundaries (7 tests)**: Empty password rejection, empty username rejection, alphabetic phone rejection, phone under 9 digits rejection, phone over 10 digits rejection, SQL injection/metacharacter rejection, duplicate username rejection.
- **Stamps & Concurrency Boundaries (5 tests)**: 10 parallel redeem requests on balance=1 (exactly 1 succeeds, balance never negative), 0 cups rejected, negative cups rejected, malformed `itemsJson` fallback, concurrent stamp additions accumulation.
- **Static Asset & Routing Boundaries (5 tests)**: Asset with query string (`/file.svg?v=1.0`), static image route (`/window.svg`), non-public route prefix (`/login-fake` redirected), dotfiles (`/.env` blocked), public `/register` route.
- **Revenue & Timezone Boundaries (5 tests)**: Precise 23:59:59.999 boundary exclusion, precise 00:00:00.000 boundary inclusion, high-volume order (50 cups, 2500 Baht), decimal float price precision (45.5 * 2 = 91), special Thai and emoji characters in notes.
- **UX & Parameter Boundaries (5 tests)**: Regex characters in customer search, non-existent customer 404, negative menu price rejection, empty menu name rejection, unauthenticated menu update rejection.

### Tier 3: Cross-Feature Combinations (4 Tests)
- `T3.1`: Full lifecycle: 0 stamps -> buy 10 cups -> 1 freeRedeem granted -> redeem free cup -> balance 0.
- `T3.2`: Admin customer creation -> customer logs in via phone -> views profile.
- `T3.3`: Edit menu item price -> order with edited item -> revenue aggregates new price.
- `T3.4`: Dual login session parity (username token vs phone token grants identical permissions).

### Tier 4: Real-World Workload Scenarios (2 Tests)
- `T4.1`: Comprehensive full-day cafe simulation (opening, morning rush, lunch rush, loyalty auto-grant threshold, afternoon redemption, evening accounting reconciliation and leaderboard ranking audit).
- `T4.2`: High-concurrency rush hour workload with multiple customers placing rapid orders simultaneously maintaining ledger consistency.

---

## Safety & Database Guard Verification
- **Pre-flight Snapshot**: Baseline of all 9 pre-existing production/seed users captured.
- **Namespace Isolation**: All test fixtures use isolated namespace `test_e2e_*` and `TEST_E2E_*`.
- **Teardown & Audit**: Automatic purge of test fixtures followed by `verifyBaselineUntouched()`.
- **Integrity Result**: `Baseline verification passed: all 9 pre-existing records intact!`
