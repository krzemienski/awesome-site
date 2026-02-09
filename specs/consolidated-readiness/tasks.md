---
spec: consolidated-readiness
phase: tasks
total_tasks: 62
created: 2026-02-08
---

# Tasks: Consolidated Production Readiness

## Phase 1: Make It Work (Foundation Fixes)

Focus: Fix 6 code gaps (login, cookie consent, pino, noUncheckedIndexedAccess, API versioning, CORS), plus infra batch. Login fix (US-1) is critical path -- gates all authenticated validation in Phase 3+.

---

- [x] 1.1 Investigate and fix login flow (US-1)
  - **Do**:
    1. Start dev server (`npm run dev`)
    2. Check `.env` for `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` -- log any missing
    3. Check Prisma schema for `User`, `Session`, `Account` tables matching Better Auth expectations
    4. Attempt `curl -X POST http://localhost:3000/api/auth/sign-in/email -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password123"}'` -- capture full response + headers
    5. If 401/500: inspect server console output for the root cause
    6. Fix the root cause (likely: env var mismatch, DB schema, or Better Auth config)
    7. If no admin user in DB: create one via `npx prisma db execute --stdin <<< "INSERT INTO \"User\" ..."` or seed script
    8. Re-test login via curl -- verify 200 + `Set-Cookie: better-auth.session_token`
    9. Save curl output to `specs/consolidated-readiness/evidence/backend/us-01-login/curl-sign-in.txt`
  - **Files**: `src/lib/auth.ts`, `.env`, `prisma/schema.prisma` (inspect/fix as needed)
  - **Done when**: `curl POST /api/auth/sign-in/email` returns 200 with session cookie
  - **Verify**: `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/auth/sign-in/email -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password123"}'` returns `200`
  - **Commit**: `fix(auth): resolve login flow for email/password authentication`
  - _Requirements: FR-1, AC-1.1, AC-1.2, AC-1.7_
  - _Design: Phase 1 step 1_

- [x] 1.2 Fix handleApiError S8 error leakage
  - **Do**:
    1. Open `src/lib/api-response.ts`
    2. Change `handleApiError` to return generic message for non-AppError 500s: replace `error instanceof Error ? error.message : "An unexpected error occurred"` with always `"An unexpected error occurred"`
    3. Add server-side `console.error` (will be replaced with pino in 1.4) for the real error so it's not lost
  - **Files**: `src/lib/api-response.ts`
  - **Done when**: Non-AppError 500s return generic message, no internal details leak
  - **Verify**: `grep -n "error.message" src/lib/api-response.ts | grep -v "AppError" | wc -l` returns `0`
  - **Commit**: `fix(api): prevent error message leakage in handleApiError (S8)`
  - _Requirements: AC-14.1, S8_
  - _Design: handleApiError Fix section_

- [x] 1.3 Install pino and create structured logger (US-10)
  - **Do**:
    1. `npm install pino pino-pretty`
    2. Create `src/lib/logger.ts`: pino singleton with `pino-pretty` for dev, raw JSON for prod
    3. Add `"pino"` and `"pino-pretty"` to `serverExternalPackages` array in `next.config.ts`
    4. Replace `console.error` in `src/lib/api-response.ts` `handleApiError` with `logger.error({ err: error }, "Unhandled API error")`
    5. Replace `console.warn` calls in `src/lib/auth.ts` with `logger.warn`
    6. Replace `console.error` in `src/app/api/admin/database/seed/route.ts` with `logger.error`
    7. Guard logger with server-only: `import "server-only"` at top of logger.ts or use `typeof window` check
  - **Files**: `src/lib/logger.ts` (create), `package.json`, `next.config.ts`, `src/lib/api-response.ts`, `src/lib/auth.ts`, `src/app/api/admin/database/seed/route.ts`
  - **Done when**: pino installed, logger singleton created, all console.error/warn in src/*.ts replaced
  - **Verify**: `grep -r "console\.\(error\|log\|warn\)" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "// " | wc -l` returns `0`
  - **Commit**: `feat(logging): add pino structured logging and replace console calls (US-10)`
  - _Requirements: FR-10, AC-10.1, AC-10.2, AC-10.4_
  - _Design: Structured Logger section_

- [x] 1.4 [VERIFY] Quality checkpoint: typecheck + lint after pino integration
  - **Do**: Run quality commands to ensure pino integration didn't break anything
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint`
  - **Done when**: Both commands exit 0
  - **Commit**: `chore(quality): pass checkpoint after pino integration` (only if fixes needed)

- [x] 1.5 Enable noUncheckedIndexedAccess and fix type errors (US-11)
  - **Do**:
    1. Add `"noUncheckedIndexedAccess": true` to `compilerOptions` in `tsconfig.json`
    2. Run `npm run typecheck 2>&1 | head -200` to see error count and locations
    3. Fix all errors with optional chaining (`arr[0]?.field`) or nullish coalescing (`arr[0] ?? fallback`)
    4. Do NOT use `!` non-null assertions to suppress errors
    5. Re-run typecheck until 0 errors
  - **Files**: `tsconfig.json`, plus all files with type errors (estimate 30-100+ files)
  - **Done when**: `npm run typecheck` exits 0 with `noUncheckedIndexedAccess: true`
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && grep -c '!' src/**/*.ts src/**/*.tsx 2>/dev/null | grep -v ':0$' | head -5` -- typecheck passes; spot-check no new `!` assertions
  - **Commit**: `feat(ts): enable noUncheckedIndexedAccess and fix all type errors (US-11)`
  - _Requirements: FR-11, AC-11.1, AC-11.2, AC-11.3_
  - _Design: noUncheckedIndexedAccess fix strategy_

- [x] 1.6 [VERIFY] Quality checkpoint: full build after TS strictness
  - **Do**: Run build to confirm noUncheckedIndexedAccess fixes compile correctly
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run build`
  - **Done when**: Build succeeds with exit 0
  - **Commit**: `chore(quality): pass build checkpoint after noUncheckedIndexedAccess` (only if fixes needed)

- [x] 1.7 Create cookie consent banner (US-7)
  - **Do**:
    1. Create `src/components/cookie-consent/cookie-consent-context.tsx`: React context with `consent: "pending" | "accepted" | "rejected"`, `accept()`, `reject()` functions. Read/write `localStorage("cookie-consent")`
    2. Create `src/components/cookie-consent/cookie-consent-banner.tsx`: `"use client"` component, fixed-bottom banner when consent === "pending". Accept/Reject buttons. Styled with shadcn Card + Button
    3. Modify `src/app/layout.tsx`: wrap `<Analytics />` and `<SpeedInsights />` in a `CookieConsentGate` that only renders them when consent === "accepted". Add `<CookieConsentBanner />` inside the provider
    4. Export `CookieConsentProvider` and wrap it in layout
  - **Files**: `src/components/cookie-consent/cookie-consent-context.tsx` (create), `src/components/cookie-consent/cookie-consent-banner.tsx` (create), `src/app/layout.tsx`
  - **Done when**: Banner shows on first visit; Analytics only loads after accept; reject blocks analytics
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run build` (no errors from new components)
  - **Commit**: `feat(privacy): add cookie consent banner with analytics gating (US-7)`
  - _Requirements: FR-7, AC-7.1, AC-7.2, AC-7.3, AC-7.4_
  - _Design: Cookie Consent Component Flow_

- [x] 1.8 Lazy-load ReactQueryDevtools (US-17 AC-17.1)
  - **Do**:
    1. Open `src/providers/query-provider.tsx`
    2. Replace direct `import { ReactQueryDevtools }` with `React.lazy(() => import("@tanstack/react-query-devtools").then(m => ({ default: m.ReactQueryDevtools })))`
    3. Wrap in `{process.env.NODE_ENV === "development" && <Suspense fallback={null}><LazyDevtools initialIsOpen={false} /></Suspense>}`
    4. Remove the static import
  - **Files**: `src/providers/query-provider.tsx`
  - **Done when**: Devtools excluded from production bundle, available in dev
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run build 2>&1 | grep -i devtools` -- should show no devtools chunk in production build
  - **Commit**: `perf(devtools): lazy-load ReactQueryDevtools in development only (US-17)`
  - _Requirements: AC-17.1_
  - _Design: Technical Decisions table_

- [x] 1.9 Production infrastructure fixes batch (US-17)
  - **Do**:
    1. Fix `public/robots.txt`: create if missing with Disallow lines before Allow lines for same paths
    2. Create `src/app/api/cron/cleanup-view-history/route.ts`: DELETE handler that removes ViewHistory entries older than 90 days. Protected with `x-cron-secret` header check
    3. Verify any `<img>` tags in src/ and replace with `next/image` `<Image>` component (check with `grep -rn '<img' src/ --include="*.tsx"`)
    4. Check for deprecated 501 routes and update to 410 Gone with `Sunset` header
  - **Files**: `public/robots.txt` (create/modify), `src/app/api/cron/cleanup-view-history/route.ts` (create), various `.tsx` files with `<img>` tags
  - **Done when**: robots.txt correct, cron route created, raw img tags replaced, deprecated routes return 410
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(infra): robots.txt, ViewHistory cron, next/image, 410 routes (US-17)`
  - _Requirements: FR-16, AC-17.4, AC-17.5, AC-17.6, AC-17.7_
  - _Design: Phase 1 step 5_

- [x] 1.10 [VERIFY] Phase 1 complete checkpoint
  - **Do**: Run full local quality suite + verify login still works
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build`
  - **Done when**: All three pass; login curl from 1.1 still returns 200
  - **Commit**: `chore(quality): pass Phase 1 foundation fixes checkpoint` (only if fixes needed)

---

## Phase 2: API & Security (API Versioning, CORS, Constitution Audit)

Focus: Middleware extensions for API versioning + CORS, plus static code audit for Constitution compliance. Can partially parallel with Phase 1 (non-auth items).

---

- [x] 2.1 Add API versioning middleware rewrite (US-12)
  - **Do**:
    1. Open `src/middleware.ts`
    2. Add before the `isApiRoute(pathname)` check: if `pathname.startsWith("/api/v1/")`, clone `request.nextUrl`, rewrite pathname from `/api/v1/` to `/api/`, set `X-API-Version: 1` header, return response with CSP headers
    3. Ensure query parameters are preserved (nextUrl.clone() handles this)
  - **Files**: `src/middleware.ts`
  - **Done when**: `curl /api/v1/resources` returns same data as `curl /api/resources` with `X-API-Version: 1` header
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(api): add /api/v1/ versioning via middleware rewrite (US-12)`
  - _Requirements: FR-12, AC-12.1, AC-12.2_
  - _Design: API Versioning Middleware Addition_

- [x] 2.2 Add CORS for API-key endpoints (US-13)
  - **Do**:
    1. Create `src/lib/cors.ts` with `corsHeaders(origin, config)` and `handlePreflight(req)` functions
    2. Default allowed headers: `Content-Type`, `x-api-key`, `Authorization`
    3. Default allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
    4. In `src/middleware.ts`: add OPTIONS preflight handling for `/api/` routes that have `x-api-key` header or are OPTIONS requests. Return `handlePreflight(request)` for OPTIONS
    5. Add CORS headers to API responses when `x-api-key` is present in request
  - **Files**: `src/lib/cors.ts` (create), `src/middleware.ts`
  - **Done when**: OPTIONS preflight returns CORS headers; API-key requests get `Access-Control-Allow-Origin`
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(security): add CORS support for API-key authenticated endpoints (US-13)`
  - _Requirements: FR-13, AC-13.1, AC-13.2, AC-13.3_
  - _Design: CORS Handler section_

- [x] 2.3 [VERIFY] Quality checkpoint: build after middleware changes
  - **Do**: Verify middleware changes compile and don't break routing
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Done when**: Both commands exit 0
  - **Commit**: `chore(quality): pass checkpoint after API versioning and CORS` (only if fixes needed)

- [x] 2.4 Constitution compliance grep audit (US-14 static rules)
  - **Do**:
    1. Create `scripts/validate-constitution.sh` with grep checks for:
       - A6: `grep -rn "from.*@prisma/client" src/app/api/ --include="*.ts"` -- should be 0 direct Prisma imports in routes
       - A9: `grep -rn "useSession\(\)" src/ --include="*.tsx"` -- should be 0 (use auth-context instead)
       - A14: `grep -rn "queryKey" src/ --include="*.ts" --include="*.tsx"` -- verify `[domain, ...]` pattern
       - Q3: `grep -rn "import {.*type " src/ --include="*.ts" --include="*.tsx"` vs `import type` -- flag violations
       - Q4: `grep -L "handleApiError\|try" src/app/api/**/route.ts` -- routes without error handling
       - Q7: Spot check 5 schemas for `z.infer` usage
       - Q8: `grep -rn "console\.\(log\|error\|warn\)" src/ --include="*.ts" --include="*.tsx"` -- should be 0
       - Q10: Spot check 5 useState calls for spread pattern
       - Q12: `find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20` -- flag >500 lines
    2. Fix any violations found
    3. Save audit output to `specs/consolidated-readiness/evidence/backend/us-14-constitution/`
  - **Files**: `scripts/validate-constitution.sh` (create), various source files (fix violations)
  - **Done when**: All grep checks pass, violations fixed, evidence saved
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && bash scripts/validate-constitution.sh`
  - **Commit**: `fix(quality): resolve Constitution compliance violations from grep audit (US-14)`
  - _Requirements: FR-14, AC-14.4 through AC-14.12_
  - _Design: Phase 2 step 9_

- [x] 2.5 Constitution runtime rules: S8, S10, S12 verification (US-14)
  - **Do**:
    1. S8 (Error Response Safety): trigger a 500 error via curl (e.g., malformed request to a route), verify response body has no stack trace -- just generic error message. Save output
    2. S10 (SSRF Prevention): verify URL fetch routes have domain allowlist. If not, add one to the URL validation service. Test with `curl` using blocked domain
    3. S12 (Admin Self-Protection): verify role endpoint (`src/app/api/admin/users/[id]/role/route.ts`) has self-protection (already present -- returns 400). Verify ban endpoint similarly. Save curl output for both
    4. Save all evidence to `specs/consolidated-readiness/evidence/backend/us-14-constitution/`
  - **Files**: Various route files (if fixes needed)
  - **Done when**: S8 returns generic errors, S10 blocks bad domains, S12 blocks self-actions
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-14-constitution/` shows evidence files
  - **Commit**: `fix(security): verify S8/S10/S12 Constitution compliance with evidence (US-14)`
  - _Requirements: AC-14.1, AC-14.2, AC-14.3_
  - _Design: Phase 2 step 10_

- [x] 2.6 [VERIFY] Phase 2 complete checkpoint
  - **Do**: Full quality suite + verify API versioning and CORS work
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build`
  - **Done when**: All pass. Evidence files exist in `evidence/backend/us-14-constitution/`
  - **Commit**: `chore(quality): pass Phase 2 API & Security checkpoint` (only if fixes needed)

---

## Phase 3: Data & CRUD Validation (Migration + Admin CRUD + Export)

Focus: Run migration, then validate all admin CRUD operations and export pipeline. Requires login working (US-1 from Phase 1). Each validation task follows three-teammate protocol: backend (curl), frontend (Playwright), cross-validator.

---

- [x] 3.1 Create evidence directory structure
  - **Do**:
    1. `mkdir -p specs/consolidated-readiness/evidence/{backend,frontend,cross-validation,constitution,reports}`
    2. Create subdirs: `backend/{us-01-login,us-02-resources,us-03-categories,us-04-tags-edits-users,us-05-export,us-06-admin-tabs,us-07-cookie-consent,us-08-migration,us-10-logging,us-12-api-versioning,us-13-cors,us-14-constitution}`
    3. Create subdirs: `frontend/{us-01-login,us-02-resources,us-03-categories,us-04-tags-edits-users,us-05-export,us-06-admin-tabs,us-07-cookie-consent,us-09-public-pages,us-19-themes}`
  - **Files**: `specs/consolidated-readiness/evidence/` (directory tree)
  - **Done when**: All evidence directories exist
  - **Verify**: `ls -R specs/consolidated-readiness/evidence/ | head -40`
  - **Commit**: `chore(evidence): create evidence directory structure`
  - _Design: Evidence Directory Structure_

- [x] 3.2 Validate data migration (US-8)
  - **Do**:
    1. Run `npx tsx scripts/migrate-data.ts` -- capture output to `evidence/backend/us-08-migration/migration-output.txt`
    2. Run `npx tsx scripts/verify-migration.ts` -- capture output to `evidence/backend/us-08-migration/verify-output.txt`
    3. Run `SELECT COUNT(*) FROM "Resource"` against DB -- verify >= 2000
    4. Run `SELECT COUNT(*) FROM "Category"` -- verify hierarchy exists
    5. Check no orphaned resources: `SELECT COUNT(*) FROM "Resource" WHERE "categoryId" IS NULL OR "categoryId" NOT IN (SELECT id FROM "Category")`
    6. Save all query results to evidence
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-08-migration/`
  - **Done when**: >= 2000 resources migrated, category hierarchy intact, no orphans
  - **Verify**: `cat specs/consolidated-readiness/evidence/backend/us-08-migration/verify-output.txt | head -5`
  - **Commit**: `chore(data): execute and verify data migration (US-8)`
  - _Requirements: FR-8, AC-8.1 through AC-8.5_
  - _Design: Phase 3 step 11_

- [x] 3.3 Create validation scripts for login, export, CORS, API versioning
  - **Do**:
    1. Create `scripts/validate-login.sh`: curl POST /api/auth/sign-in/email with credentials, verify 200 + cookie
    2. Create `scripts/validate-export.sh`: curl GET /api/admin/export?format=json, csv, and POST for markdown. Verify Content-Disposition and response size
    3. Create `scripts/validate-cors.sh`: curl with `-H "Origin: https://example.com"` and `-H "x-api-key: test"`, verify CORS headers
    4. Create `scripts/validate-api-versioning.sh`: curl /api/v1/resources and /api/resources, compare response bodies
    5. Make all scripts executable: `chmod +x scripts/validate-*.sh`
  - **Files**: `scripts/validate-login.sh` (create), `scripts/validate-export.sh` (create), `scripts/validate-cors.sh` (create), `scripts/validate-api-versioning.sh` (create)
  - **Done when**: All 4 scripts created and executable
  - **Verify**: `ls -la scripts/validate-*.sh | wc -l` returns `5` (including constitution.sh from 2.4)
  - **Commit**: `feat(scripts): create validation scripts for login, export, CORS, API versioning`
  - _Requirements: AC-1.7, AC-5.5, AC-13.4, AC-12.4_
  - _Design: Validation Scripts section_

- [x] 3.4 Backend validate: Admin Resources CRUD (US-2)
  - **Do**:
    1. Get session cookie via login script
    2. `curl POST /api/admin/resources` with valid resource JSON -- verify 201 + new resource in response
    3. `curl GET /api/admin/resources` -- verify list includes new resource, pagination works
    4. `curl PUT /api/admin/resources/{id}` -- update name, verify 200 + changed fields
    5. `curl DELETE /api/admin/resources/{id}` -- verify 200 + resource removed
    6. `curl GET /api/admin/resources?search=...` -- verify search works
    7. Save all curl outputs to `evidence/backend/us-02-resources/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-02-resources/`
  - **Done when**: CREATE/READ/UPDATE/DELETE all return correct status codes
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-02-resources/ | wc -l` shows >= 5 evidence files
  - **Commit**: `chore(validation): backend CRUD validation for admin resources (US-2)`
  - _Requirements: FR-3, AC-2.1 through AC-2.6_
  - _Design: Phase 3 Validation table_

- [x] 3.5 Backend validate: Admin Categories hierarchy CRUD (US-3)
  - **Do**:
    1. `curl POST /api/admin/categories` -- create category, verify response
    2. `curl PUT /api/admin/categories/{id}` -- edit name/slug, verify
    3. `curl POST /api/admin/subcategories` -- create subcategory with parentId
    4. `curl POST /api/admin/sub-subcategories` -- create sub-subcategory
    5. `curl DELETE /api/admin/categories/{empty-id}` -- delete empty category, verify success
    6. `curl DELETE /api/admin/categories/{has-resources-id}` -- should return error (blocked)
    7. Save all to `evidence/backend/us-03-categories/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-03-categories/`
  - **Done when**: Full hierarchy CRUD works, delete-with-resources blocked
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-03-categories/ | wc -l` shows >= 6
  - **Commit**: `chore(validation): backend CRUD validation for categories hierarchy (US-3)`
  - _Requirements: FR-4, AC-3.1 through AC-3.6_
  - _Design: Phase 3 Validation table_

- [x] 3.6 Backend validate: Tags, Edit Suggestions, Users CRUD (US-4)
  - **Do**:
    1. Tags: curl POST/PUT/DELETE /api/admin/tags + POST /api/admin/tags/merge
    2. Edit Suggestions: curl GET /api/admin/edits, POST /api/admin/edits/{id}/approve, POST /api/admin/edits/{id}/reject
    3. Users: curl PUT /api/admin/users/{id}/role (change role), POST /api/admin/users/{id}/ban (ban/unban)
    4. Verify admin self-ban returns 400 (S12)
    5. Verify admin self-role-change returns 400 (S12)
    6. Save all to `evidence/backend/us-04-tags-edits-users/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-04-tags-edits-users/`
  - **Done when**: All operations return correct status codes, S12 self-protection verified
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-04-tags-edits-users/ | wc -l` shows >= 6
  - **Commit**: `chore(validation): backend CRUD for tags, edits, users (US-4)`
  - _Requirements: FR-5, AC-4.1 through AC-4.5_
  - _Design: Phase 3 Validation table_

- [x] 3.7 [VERIFY] Quality checkpoint: all CRUD routes functional
  - **Do**: Verify dev server is stable after CRUD testing, run quick health check
  - **Verify**: `curl -s http://localhost:3000/api/health | grep -q "success" && echo "PASS" || echo "FAIL"`
  - **Done when**: Health check returns success
  - **Commit**: none (validation-only checkpoint)

- [x] 3.8 Backend validate: Export pipeline JSON + CSV + Markdown (US-5)
  - **Do**:
    1. Get session cookie via login
    2. `curl -o export.json "http://localhost:3000/api/admin/export?format=json" -H "Cookie: ..."` -- verify JSON parseable, resource count >= 2000
    3. `curl -o export.csv "http://localhost:3000/api/admin/export?format=csv"` -- verify CSV with headers
    4. `curl -o export.md "http://localhost:3000/api/admin/export?format=markdown"` -- verify awesome-list format
    5. Run `npx tsx scripts/verify-export.mjs export.md` or equivalent awesome-lint validation
    6. Verify `Content-Disposition` header on each response
    7. Save downloads + lint output to `evidence/backend/us-05-export/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-05-export/`
  - **Done when**: All 3 formats download correctly, markdown passes awesome-lint
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-05-export/ | wc -l` shows >= 4 (json, csv, md, lint output)
  - **Commit**: `chore(validation): backend export pipeline validation for JSON/CSV/Markdown (US-5)`
  - _Requirements: FR-6, AC-5.1 through AC-5.5_
  - _Design: Phase 3 Validation table_

- [x] 3.9 Backend validate: Remaining admin tab APIs (US-6)
  - **Do**:
    1. With session cookie, curl each tab's data endpoint:
       - GET /api/admin/stats (Overview)
       - GET /api/admin/enrichment/jobs (Enrichment)
       - GET /api/admin/research/jobs (Research)
       - GET /api/admin/github/status (GitHub Sync)
       - GET /api/admin/export/validate (Validation)
       - GET /api/admin/link-health (Link Health)
       - GET /api/admin/audit (Audit)
       - GET /api/admin/api-keys (API Keys)
       - GET /api/admin/analytics (Analytics)
       - GET /api/admin/journeys (Learning Journeys)
       - GET /api/admin/settings (Settings)
    2. Verify each returns 200 with JSON
    3. Save all to `evidence/backend/us-06-admin-tabs/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-06-admin-tabs/`
  - **Done when**: All 11+ tab endpoints return 200
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-06-admin-tabs/ | wc -l` shows >= 10
  - **Commit**: `chore(validation): backend API validation for all admin tabs (US-6)`
  - _Requirements: FR-2, AC-6.1 through AC-6.12_
  - _Design: Phase 3 Validation table_

- [x] 3.10 [VERIFY] Phase 3 backend validation complete
  - **Do**: Verify all backend evidence files exist for US-2 through US-8
  - **Verify**: `find specs/consolidated-readiness/evidence/backend/ -type f | wc -l` shows >= 30
  - **Done when**: All backend evidence directories populated
  - **Commit**: none (validation-only checkpoint)

---

## Phase 4: Frontend Validation (Playwright Specs)

Focus: Write Playwright specs covering admin CRUD, export, public pages, cookie consent. Capture screenshots as evidence. Requires running dev server + login working.

---

- [ ] 4.1 Update Playwright config for evidence output
  - **Do**:
    1. Update `playwright.config.ts`: add `outputDir: "specs/consolidated-readiness/evidence/e2e"` and HTML reporter to `reporter` config
    2. Add `screenshot: "on"` to `use` section for automatic failure screenshots
    3. Keep `reuseExistingServer: true` for local dev
  - **Files**: `playwright.config.ts`
  - **Done when**: Playwright configured to output to evidence directory
  - **Verify**: `grep "evidence" playwright.config.ts`
  - **Commit**: `feat(e2e): configure Playwright output to evidence directory (US-16)`
  - _Requirements: AC-16.1_
  - _Design: Playwright config_

- [ ] 4.2 Write admin CRUD Playwright spec (US-2, US-3, US-4)
  - **Do**:
    1. Create `e2e/admin-crud.spec.ts`
    2. Reuse `loginAsAdmin` pattern from existing `e2e/admin-tabs.spec.ts`
    3. Test Resources: navigate to Resources tab, fill create dialog, verify row appears, edit, delete. Screenshot each state
    4. Test Categories: navigate to Categories tab, create, verify, edit name. Screenshot hierarchy
    5. Test Tags: navigate to Tags tab, create tag, edit, delete
    6. Test Users: navigate to Users tab, verify user list loads
    7. Save screenshots to `evidence/frontend/` via Playwright's `page.screenshot({ path: ... })`
  - **Files**: `e2e/admin-crud.spec.ts` (create)
  - **Done when**: Spec covers CRUD for resources, categories, tags with screenshots
  - **Verify**: `npx playwright test e2e/admin-crud.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): admin CRUD Playwright validation spec (US-2, US-3, US-4)`
  - _Requirements: AC-2.7, AC-3.7, AC-4.6, AC-16.2_
  - _Design: New Playwright Specs table_

- [ ] 4.3 Write admin export Playwright spec (US-5)
  - **Do**:
    1. Create `e2e/admin-export.spec.ts`
    2. Login, navigate to Export tab
    3. Click JSON export button, verify download event fires
    4. Click CSV export button, verify download
    5. Click Markdown export button, verify download
    6. Click Validation tab, run awesome-lint, screenshot results
    7. Save screenshots to evidence
  - **Files**: `e2e/admin-export.spec.ts` (create)
  - **Done when**: All 3 export formats downloadable via UI
  - **Verify**: `npx playwright test e2e/admin-export.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): admin export pipeline Playwright validation (US-5)`
  - _Requirements: AC-5.6, AC-16.2_
  - _Design: New Playwright Specs table_

- [ ] 4.4 Write admin all-tabs load Playwright spec (US-6)
  - **Do**:
    1. Create `e2e/admin-all-tabs.spec.ts`
    2. Login, iterate all 20 tabs (reuse ADMIN_TABS from existing spec)
    3. For each: navigate via `?tab=key`, wait for heading, screenshot
    4. Collect console errors, filter noise, assert zero critical errors
    5. Save 20 screenshots to `evidence/frontend/us-06-admin-tabs/`
  - **Files**: `e2e/admin-all-tabs.spec.ts` (create)
  - **Done when**: All 20 tabs load with heading visible, screenshots captured
  - **Verify**: `npx playwright test e2e/admin-all-tabs.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): all 20 admin tabs load validation with screenshots (US-6)`
  - _Requirements: AC-6.13 through AC-6.15, AC-16.2_
  - _Design: New Playwright Specs table_

- [ ] 4.5 [VERIFY] Quality checkpoint: all admin E2E specs pass
  - **Do**: Run all admin-related Playwright specs together
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx playwright test e2e/admin-crud.spec.ts e2e/admin-export.spec.ts e2e/admin-all-tabs.spec.ts --reporter=list 2>&1 | tail -10`
  - **Done when**: All tests pass, screenshots in evidence directory
  - **Commit**: `chore(quality): pass admin E2E validation checkpoint` (only if fixes needed)

- [ ] 4.6 Write cookie consent Playwright spec (US-7)
  - **Do**:
    1. Create `e2e/cookie-consent.spec.ts`
    2. Test 1: fresh visit (clear localStorage) -- banner visible, no analytics network requests
    3. Test 2: accept -- banner disappears, analytics script loads
    4. Test 3: reject -- banner disappears, no analytics
    5. Test 4: return visit after accept -- no banner, analytics active
    6. Screenshot each state to `evidence/frontend/us-07-cookie-consent/`
  - **Files**: `e2e/cookie-consent.spec.ts` (create)
  - **Done when**: All 4 consent states validated with screenshots
  - **Verify**: `npx playwright test e2e/cookie-consent.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): cookie consent banner validation (US-7)`
  - _Requirements: AC-7.5 through AC-7.7_
  - _Design: Cookie Consent Component Flow_

- [ ] 4.7 Write public pages Playwright spec (US-9)
  - **Do**:
    1. Create `e2e/public-pages.spec.ts`
    2. Test home page (`/`): category grid visible, resource counts
    3. Test sidebar: all top-level categories visible
    4. Test category detail (`/categories/[slug]`): resources listed, pagination
    5. Test resource detail (`/resources/[id]`): title, description, URL visible
    6. Test search (Cmd+K): search dialog opens, returns results for known resource
    7. Screenshot each page to `evidence/frontend/us-09-public-pages/`
  - **Files**: `e2e/public-pages.spec.ts` (create)
  - **Done when**: All public pages render with real data, screenshots captured
  - **Verify**: `npx playwright test e2e/public-pages.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): public pages validation with real data (US-9)`
  - _Requirements: FR-9, AC-9.1 through AC-9.8_
  - _Design: Phase 4 Validation table_

- [ ] 4.8 Write data integrity Playwright spec (US-8)
  - **Do**:
    1. Create `e2e/data-integrity.spec.ts`
    2. Hit `/api/resources?limit=1` via Playwright request context -- verify response has `meta.total >= 2000`
    3. Hit `/api/categories` -- verify non-empty array
    4. Hit home page, verify category grid shows populated cards (not empty states)
    5. Navigate to a known category, verify resource count > 0
  - **Files**: `e2e/data-integrity.spec.ts` (create)
  - **Done when**: Data integrity confirmed: >= 2000 resources, categories populated
  - **Verify**: `npx playwright test e2e/data-integrity.spec.ts --reporter=list 2>&1 | tail -5`
  - **Commit**: `feat(e2e): data integrity validation spec (US-8)`
  - _Requirements: AC-8.6, AC-8.7, AC-16.4_
  - _Design: New Playwright Specs table_

- [ ] 4.9 [VERIFY] Quality checkpoint: all Playwright specs pass
  - **Do**: Run entire E2E suite together
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx playwright test --reporter=list 2>&1 | tail -15`
  - **Done when**: All specs pass, zero failures
  - **Commit**: `chore(quality): pass full E2E suite checkpoint` (only if fixes needed)

- [ ] 4.10 [VERIFY] Phase 4 frontend validation complete
  - **Do**: Verify all frontend evidence exists
  - **Verify**: `find specs/consolidated-readiness/evidence/frontend/ -name "*.png" | wc -l` shows >= 30
  - **Done when**: Frontend screenshots exist for all validated stories
  - **Commit**: none (validation-only checkpoint)

---

## Phase 5: Cross-Validation & Constitution Completion

Focus: Compare backend + frontend evidence, complete partial Constitution rules, capture theme screenshots.

---

- [ ] 5.1 Cross-validate US-1 through US-6 evidence
  - **Do**:
    1. For each story US-1 through US-6: read backend evidence (curl outputs) and frontend evidence (screenshots/Playwright results)
    2. Compare: does backend API response data match what the UI shows?
    3. Flag discrepancies (e.g., API says 2500 resources but UI shows 2000)
    4. Write consistency report per story to `evidence/cross-validation/us-01-through-06.md`
    5. Status each as CONSISTENT or DISCREPANCY with details
  - **Files**: `specs/consolidated-readiness/evidence/cross-validation/us-01-through-06.md` (create)
  - **Done when**: All 6 stories have consistency report
  - **Verify**: `cat specs/consolidated-readiness/evidence/cross-validation/us-01-through-06.md | head -20`
  - **Commit**: `chore(validation): cross-validate US-1 through US-6 evidence`
  - _Requirements: AC-1.9, AC-2.8, AC-3.8, AC-4.7, AC-5.7, AC-6.15_
  - _Design: Three-Teammate Validation Flow_

- [ ] 5.2 Cross-validate US-7 through US-14 evidence
  - **Do**:
    1. For US-7 (cookie consent): verify no analytics traffic without consent in both backend network log and frontend screenshots
    2. For US-8 (migration): compare migration script output count with API resource count and UI display
    3. For US-9 (public pages): compare API endpoint responses with rendered page content
    4. For US-10 (pino): verify log format in server output matches pino JSON schema
    5. For US-11 (TS): verify `grep -r '!\.' src/` shows no new non-null assertions
    6. For US-12 (API versioning): compare /api/v1/resources and /api/resources response bodies
    7. For US-13 (CORS): verify preflight headers match spec
    8. For US-14 (Constitution): review audit methodology, confirm thoroughness
    9. Write to `evidence/cross-validation/us-07-through-14.md`
  - **Files**: `specs/consolidated-readiness/evidence/cross-validation/us-07-through-14.md` (create)
  - **Done when**: All 8 stories cross-validated
  - **Verify**: `cat specs/consolidated-readiness/evidence/cross-validation/us-07-through-14.md | head -20`
  - **Commit**: `chore(validation): cross-validate US-7 through US-14 evidence`
  - _Requirements: AC-7.7, AC-8.8, AC-9.9, AC-10.7, AC-11.7, AC-12.6, AC-13.5, AC-14.15_
  - _Design: Three-Teammate Validation Flow_

- [ ] 5.3 Complete partial-evidence Constitution rules (US-15)
  - **Do**:
    1. S11 (Env Validation): verify app fails to start with missing required env vars. Remove DATABASE_URL temporarily, attempt `npm run build` or `npm run dev`, capture error output
    2. Q6 (Strict TS): confirm `noUncheckedIndexedAccess` in tsconfig.json (linked to US-11)
    3. U6 (Page Metadata): `grep -rn "generateMetadata\|export const metadata" src/app/ --include="*.tsx"` -- verify all public pages have metadata
    4. V4/V5 (Evidence): this spec produces evidence for every story -- list evidence inventory
    5. V7 (Report Format): will be completed in US-20
    6. V8 (Real Database): migration validation uses real Neon DB -- reference US-8 evidence
    7. V10 (Backend API Validation): reference all curl evidence from Phase 3
    8. G2-G4 (Gate Discipline): this spec enforces full evidence chain -- document compliance
    9. Save all to `evidence/constitution/`
  - **Files**: `specs/consolidated-readiness/evidence/constitution/` (multiple files)
  - **Done when**: All 12 partial-evidence rules have complete evidence
  - **Verify**: `ls specs/consolidated-readiness/evidence/constitution/ | wc -l` shows >= 6
  - **Commit**: `chore(validation): complete partial-evidence Constitution rules (US-15)`
  - _Requirements: FR-14, AC-15.1 through AC-15.10_
  - _Design: Phase 4 step 19_

- [ ] 5.4 [VERIFY] Quality checkpoint: evidence completeness
  - **Do**: Verify cross-validation and constitution evidence directories are populated
  - **Verify**: `find specs/consolidated-readiness/evidence/ -type f | wc -l` shows >= 50
  - **Done when**: Total evidence artifacts >= 50
  - **Commit**: none (validation-only checkpoint)

- [ ] 5.5 Capture theme variation screenshots (US-19)
  - **Do**:
    1. Create `e2e/theme-screenshots.spec.ts`
    2. For each theme variation (variation-a, variation-b, variation-c):
       a. Set localStorage `theme-variation` to variation
       b. Login as admin
       c. Navigate all 20 tabs via `?tab=key`
       d. Screenshot each to `evidence/frontend/us-19-themes/{variation}-{tab}.png`
    3. Total: 20 tabs x 3 variations = 60 screenshots
    4. Use parallel workers (3) for speed
  - **Files**: `e2e/theme-screenshots.spec.ts` (create)
  - **Done when**: 60 screenshots captured across 3 theme variations
  - **Verify**: `find specs/consolidated-readiness/evidence/frontend/us-19-themes/ -name "*.png" | wc -l` shows `60`
  - **Commit**: `feat(e2e): capture 60 admin tab screenshots across 3 theme variations (US-19)`
  - _Requirements: FR-18, AC-19.1 through AC-19.4_
  - _Design: Phase 4 step 20_

- [ ] 5.6 [VERIFY] Phase 5 cross-validation complete
  - **Do**: Verify all cross-validation reports exist and show CONSISTENT
  - **Verify**: `grep -c "CONSISTENT" specs/consolidated-readiness/evidence/cross-validation/*.md`
  - **Done when**: All stories show CONSISTENT in cross-validation reports
  - **Commit**: none (validation-only checkpoint)

---

## Phase 6: Finalization (Local CI, Report, Cleanup)

Focus: Full local CI pass, V7 validation report, alpha spec cleanup, PR.

---

- [ ] 6.1 Verify backend: API versioning + CORS with curl (US-12, US-13)
  - **Do**:
    1. With dev server running, execute: `bash scripts/validate-api-versioning.sh`
    2. Execute: `bash scripts/validate-cors.sh`
    3. Save outputs to `evidence/backend/us-12-api-versioning/` and `evidence/backend/us-13-cors/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-12-api-versioning/`, `specs/consolidated-readiness/evidence/backend/us-13-cors/`
  - **Done when**: API versioning rewrites work, CORS headers present on API-key requests
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-12-api-versioning/ specs/consolidated-readiness/evidence/backend/us-13-cors/ | wc -l` shows >= 2
  - **Commit**: `chore(validation): backend API versioning and CORS evidence (US-12, US-13)`
  - _Requirements: AC-12.4, AC-12.5, AC-13.4, AC-13.5_

- [ ] 6.2 Verify backend: pino structured logging (US-10)
  - **Do**:
    1. With dev server running, trigger an API error (e.g., `curl -X POST http://localhost:3000/api/admin/resources -d 'invalid'`)
    2. Capture server stdout showing pino structured JSON output
    3. Verify JSON has fields: `level`, `time`, `msg` (pino standard fields)
    4. Save to `evidence/backend/us-10-logging/`
  - **Files**: `specs/consolidated-readiness/evidence/backend/us-10-logging/`
  - **Done when**: Structured JSON log output captured with pino schema
  - **Verify**: `ls specs/consolidated-readiness/evidence/backend/us-10-logging/ | wc -l` shows >= 1
  - **Commit**: `chore(validation): backend pino logging evidence (US-10)`
  - _Requirements: AC-10.3, AC-10.5, AC-10.7_

- [ ] 6.3 Alpha spec cleanup verification (US-21)
  - **Do**:
    1. AC-21.1: `grep '"name"' package.json` -- verify `"awesome-video"` (ALREADY DONE)
    2. AC-21.2: `find src/ -name "ResourceDetailActions*"` -- verify component exists
    3. AC-21.3: `ls src/app/\\(public\\)/resources/\\[id\\]/suggest-edit/` -- verify page exists
    4. AC-21.4: Check for bulk operations toolbar in admin resources tab -- document as deferred if not present
    5. Write status report for each item
  - **Files**: none (verification only)
  - **Done when**: Each alpha item verified as done or documented as deferred
  - **Verify**: `grep '"name"' /Users/nick/Desktop/awesome-site/package.json | grep "awesome-video"`
  - **Commit**: `chore(cleanup): verify alpha spec items (US-21)`
  - _Requirements: AC-21.1 through AC-21.5_

- [ ] 6.4 [VERIFY] Full local CI: lint + typecheck + build
  - **Do**: Run complete local CI suite
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build`
  - **Done when**: All three commands exit 0 with no errors
  - **Commit**: `chore(ci): pass full local CI (lint + typecheck + build) (US-18)` (only if fixes needed)
  - _Requirements: FR-17, AC-18.1 through AC-18.4_

- [ ] 6.5 Run full Playwright E2E suite (US-16)
  - **Do**:
    1. `npx playwright test --reporter=html`
    2. Capture test run output
    3. Verify zero failures
    4. Save HTML report to `evidence/reports/playwright-report/`
    5. Save run output to `evidence/backend/us-16-e2e/run-output.txt`
  - **Files**: `specs/consolidated-readiness/evidence/reports/`, `specs/consolidated-readiness/evidence/backend/us-16-e2e/`
  - **Done when**: All Playwright specs pass, HTML report generated
  - **Verify**: `npx playwright test --reporter=list 2>&1 | tail -3 | grep "passed"`
  - **Commit**: `chore(validation): full Playwright E2E suite pass (US-16)`
  - _Requirements: FR-15, AC-16.5 through AC-16.8_

- [ ] 6.6 Generate V7 validation report (US-20)
  - **Do**:
    1. Create `specs/consolidated-readiness/evidence/reports/VALIDATION-REPORT.md`
    2. Include sections per V7 format:
       - Executive summary (pass/fail counts)
       - Authentication result (US-1)
       - Per-tab results table (20 admin tabs)
       - Per-page results table (public pages)
       - Screenshot inventory with file paths
       - Console error analysis
       - Bug list with severity ratings
       - Constitution compliance matrix (54 rules, all PASS)
    3. Reference all evidence artifacts by path
    4. Mark each story PASS/FAIL with evidence links
  - **Files**: `specs/consolidated-readiness/evidence/reports/VALIDATION-REPORT.md` (create)
  - **Done when**: Report contains all V7 sections, references all evidence
  - **Verify**: `wc -l specs/consolidated-readiness/evidence/reports/VALIDATION-REPORT.md` shows >= 100 lines
  - **Commit**: `docs(report): generate V7 validation report (US-20)`
  - _Requirements: FR-19, AC-20.1 through AC-20.9_

- [ ] 6.7 [VERIFY] Phase 6 complete: all evidence, all CI green
  - **Do**: Final verification of all artifacts and CI status
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build && echo "ALL PASS"`
  - **Done when**: Local CI green, V7 report complete, all evidence directories populated
  - **Commit**: none (final checkpoint)

---

## Phase 7: Quality Gates

- [ ] 7.1 [VERIFY] Full local CI: lint + typecheck + build + E2E
  - **Do**: Run complete local CI suite including E2E
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build && npx playwright test --reporter=list`
  - **Done when**: Build succeeds, all tests pass, E2E green
  - **Commit**: `chore(ci): pass local CI` (if fixes needed)

- [ ] 7.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is a feature branch: `git branch --show-current` (should be `feat/v2-rebuild` or similar, NOT `master`)
    2. Stage all changes: `git add -A`
    3. Push branch: `git push -u origin $(git branch --show-current)`
    4. Create PR: `gh pr create --title "feat: consolidated production readiness -- 23 stories validated" --body "..."`
    5. Wait for CI: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: All CI checks passing, PR ready for review
  - **Commit**: none (PR creation task)
  - **If CI fails**: Read failures with `gh pr checks`, fix locally, push, re-verify

---

## Phase 8: PR Lifecycle

- [ ] 8.1 Monitor CI and fix failures
  - **Do**:
    1. `gh pr checks` -- check status
    2. If failures: read error details, fix locally, push
    3. Re-run `gh pr checks --watch`
    4. Repeat until all green
  - **Verify**: `gh pr checks` shows all passing
  - **Done when**: Zero CI failures
  - **Commit**: `fix(ci): resolve CI failures` (if fixes needed)

- [ ] 8.2 [VERIFY] CI pipeline passes
  - **Do**: Final CI verification
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: CI pipeline passes completely

- [ ] 8.3 [VERIFY] AC checklist -- all 23 user stories verified
  - **Do**:
    1. Read requirements.md
    2. For each US-1 through US-23: verify acceptance criteria met by checking evidence files and code
    3. Programmatic checks:
       - `ls specs/consolidated-readiness/evidence/backend/ | wc -l` >= 12
       - `ls specs/consolidated-readiness/evidence/frontend/ | wc -l` >= 9
       - `ls specs/consolidated-readiness/evidence/cross-validation/ | wc -l` >= 2
       - `ls specs/consolidated-readiness/evidence/constitution/ | wc -l` >= 6
       - `cat specs/consolidated-readiness/evidence/reports/VALIDATION-REPORT.md | grep -c "PASS"` >= 20
       - `npm run lint && npm run typecheck && npm run build` all exit 0
       - `npx playwright test --reporter=list` all pass
  - **Verify**: All automated checks above exit 0
  - **Done when**: All 23 user stories confirmed met via automated checks
  - **Commit**: none

---

## Notes

### POC Shortcuts Taken (Phase 1)
- pino integration is API routes only, not full application-wide. Console.warn in non-route code deferred
- Cookie consent uses localStorage (not cookie) -- simpler but no SSR consent check
- API versioning is rewrite-only, no deprecation notice on old routes yet
- CORS allows all origins with API key -- production should have allowlist

### Production TODOs (Phase 2+)
- Full pino integration across all server-side code (middleware, auth callbacks, etc.)
- CORS origin allowlist from environment variable
- API deprecation notices for unversioned routes
- Cookie consent: add "manage preferences" link for re-consent
- Lighthouse performance optimization (US-23, P3)
- Stitch MCP screen generation (US-22, P3)
- Virtual scrolling for admin tables >1000 rows
- Email provider for auth verification/reset

### Phase Dependencies
- Phase 1 tasks 1.1 (login) GATES Phase 3 (all CRUD validation) and Phase 4 (all Playwright specs)
- Phase 1 task 1.5 (noUncheckedIndexedAccess) GATES Phase 6 task 6.4 (local CI must pass)
- Phase 3 task 3.2 (migration) GATES Phase 4 tasks 4.7/4.8 (public pages need real data)
- Phase 5 (cross-validation) requires Phases 3+4 complete
- Phase 6 task 6.6 (V7 report) requires Phase 5 complete

### Three-Teammate Model Mapping
- **Backend validator** tasks: 3.4, 3.5, 3.6, 3.8, 3.9, 6.1, 6.2
- **Frontend validator** tasks: 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 5.5
- **Cross-validator** tasks: 5.1, 5.2, 5.3

### Evidence Artifact Targets
- Backend: ~40 curl output files across 12 subdirs
- Frontend: ~90 screenshots (30 admin CRUD + 20 tab load + 60 theme variations)
- Cross-validation: 2 consistency reports
- Constitution: 6+ rule evidence files
- Reports: 1 V7 validation report + 1 Playwright HTML report
