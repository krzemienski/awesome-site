---
spec: production-audit
phase: tasks
total_tasks: 43
created: 2026-02-07T22:30:00Z
---

# Tasks: Production Readiness Audit

## Phase 1: Critical Infrastructure (P0)

Focus: Migrations, Sentry, connection pooling, rate limiting, data migration. Quality-first -- each task verified with typecheck minimum.

- [x] 1.1 Add typecheck script to package.json
  - **Do**:
    1. Add `"typecheck": "tsc --noEmit"` to `package.json` scripts
    2. Run `npm run typecheck` to verify current codebase passes
  - **Files**: `package.json`
  - **Done when**: `npm run typecheck` exits 0
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `chore(dx): add typecheck script to package.json`
  - _Requirements: US-13, FR-14, AC-13.1, AC-13.2_
  - _Design: Phase 3.1 (moved to Phase 1 -- needed for all subsequent verification)_

- [x] 1.2 Generate baseline Prisma migration
  - **Do**:
    1. Run `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0001_init/migration.sql`
    2. Create `prisma/migrations/0001_init/migration.sql` directory first
    3. Run `npx prisma migrate resolve --applied 0001_init` against existing DB to mark as applied
    4. Verify with `npx prisma migrate status`
  - **Files**: `prisma/migrations/0001_init/migration.sql`
  - **Done when**: `npx prisma migrate status` shows no pending migrations
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx prisma migrate status`
  - **Commit**: `feat(db): generate baseline prisma migration from existing schema`
  - _Requirements: US-1, FR-1, AC-1.1, AC-1.2_
  - _Design: Phase 1.1_

- [x] 1.3 Switch to @prisma/adapter-neon + remove hardcoded DB fallback
  - **Do**:
    1. `npm install @neondatabase/serverless @prisma/adapter-neon ws`
    2. `npm install -D @types/ws`
    3. `npm uninstall @prisma/adapter-pg pg @types/pg`
    4. Rewrite `src/lib/prisma.ts`: import `PrismaNeon` from `@prisma/adapter-neon`, `Pool` + `neonConfig` from `@neondatabase/serverless`, `ws` for WebSocket polyfill
    5. Remove hardcoded `"postgresql://localhost:5432/awesome_list_v2"` fallback -- throw descriptive error when `DATABASE_URL` missing
    6. Update `prisma.config.ts` to use `DIRECT_DATABASE_URL` for migrations (non-pooled)
    7. Update `.env.example` with `DATABASE_URL` (pooled) and `DIRECT_DATABASE_URL` (direct) with Neon-specific comments
  - **Files**: `src/lib/prisma.ts`, `package.json`, `prisma.config.ts`, `.env.example`
  - **Done when**: App boots with Neon pooled connection; missing DATABASE_URL throws clear error
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(db): switch to @prisma/adapter-neon with WebSocket pooling`
  - _Requirements: US-4, US-28, FR-4, FR-5, FR-30, AC-4.1-AC-4.5, AC-28.1-AC-28.6_
  - _Design: Phase 1.3_

- [x] 1.4 Create global-error.tsx standalone error page
  - **Do**:
    1. Create `src/app/global-error.tsx` as `"use client"` component
    2. Must render full `<html>` + `<body>` with inline styles only (no layout imports, no Tailwind, no external CSS)
    3. Include "Try Again" button calling `reset()`
    4. Include placeholder for Sentry (will be wired in 1.5)
    5. Style: dark background, branded heading, centered content
  - **Files**: `src/app/global-error.tsx` (new)
  - **Done when**: File exists, exports default component with `<html>` wrapper and inline styles
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(error): add standalone global-error.tsx for root layout errors`
  - _Requirements: US-3, FR-3, AC-3.1, AC-3.2, AC-3.4_
  - _Design: Phase 1.2_

- [x] 1.5 Integrate Sentry error tracking
  - **Do**:
    1. `npm install @sentry/nextjs`
    2. Create `sentry.client.config.ts` with `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1, environment: process.env.NODE_ENV })`
    3. Create `sentry.server.config.ts` with server-side init
    4. Create `sentry.edge.config.ts` with edge init
    5. Create `src/instrumentation.ts` with `Sentry.init` for Next.js instrumentation hook
    6. Wrap `next.config.ts` with `withSentryConfig` from `@sentry/nextjs`
    7. Update `src/app/global-error.tsx`: add `Sentry.captureException(error)` in useEffect
    8. Update `src/app/error.tsx`: replace `console.error` with `Sentry.captureException(error)`
    9. Update `src/app/(public)/error.tsx`: replace `console.error` with `Sentry.captureException(error)`
    10. Update `src/app/admin/error.tsx`: replace `console.error` with `Sentry.captureException(error)`
    11. Add `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` to `.env.example`
  - **Files**: `sentry.client.config.ts` (new), `sentry.server.config.ts` (new), `sentry.edge.config.ts` (new), `src/instrumentation.ts` (new), `next.config.ts`, `src/app/global-error.tsx`, `src/app/error.tsx`, `src/app/(public)/error.tsx`, `src/app/admin/error.tsx`, `.env.example`
  - **Done when**: All 4 error boundaries call `Sentry.captureException`; `next.config.ts` wrapped with Sentry; config files exist
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(monitoring): integrate Sentry error tracking with source maps`
  - _Requirements: US-2, US-3, FR-2, FR-3, AC-2.1-AC-2.4, AC-3.3_
  - _Design: Phase 1.2_

- [x] 1.6 Add auth endpoint rate limiting
  - **Do**:
    1. In `src/middleware.ts`, remove the early `return NextResponse.next()` for `/api/auth/` paths (line ~79-81)
    2. Add auth-specific rate limiting block: detect login paths (`/sign-in`, `/sign-up`) -> 5/min/IP; general auth paths -> 10/min/IP
    3. Use existing `checkRateLimit` + `rateLimitHeaders` functions
    4. Return 429 with `Retry-After` header when exceeded
    5. Pass through to `NextResponse.next()` with rate limit headers when allowed
  - **Files**: `src/middleware.ts`
  - **Done when**: Auth endpoints rate-limited; login paths at 5/min, general auth at 10/min
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(security): add rate limiting for auth endpoints`
  - _Requirements: US-5, FR-6, AC-5.1-AC-5.4_
  - _Design: Phase 1.4_

- [x] 1.7 [VERIFY] Phase 1 infrastructure checkpoint
  - **Do**: Run full quality suite to verify all Phase 1 infrastructure changes compile and build
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All three commands exit 0
  - **Commit**: `chore(quality): pass Phase 1 infrastructure checkpoint` (only if fixes needed)

- [x] 1.8 Create data migration script
  - **Do**:
    1. Create `scripts/migrate-data.ts` using `tsx` runner
    2. Connect to source DB via `SOURCE_DATABASE_URL` using raw `pg` client (install `pg` as devDependency for scripts only)
    3. Export: `SELECT * FROM categories`, subcategories, sub_subcategories, tags, resources, resource_tags
    4. Map legacy text-based category references to FK IDs: create lookup tables by slug
    5. Upsert categories by slug, subcategories by slug+categoryId, sub-subcategories by slug+subcategoryId
    6. Upsert tags by slug
    7. Upsert resources by URL (unique constraint) -- map text category/subcategory/sub-subcategory to FK IDs
    8. Upsert resource_tags by resourceId+tagId composite
    9. Make idempotent: running twice produces no duplicates
    10. Log summary: total exported, imported, skipped, errors per table
    11. Add `SOURCE_DATABASE_URL` to `.env.example`
  - **Files**: `scripts/migrate-data.ts` (new), `.env.example`
  - **Done when**: Script connects to source, exports all tables, imports with FK mapping, logs summary
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx tsc --noEmit scripts/migrate-data.ts --skipLibCheck --esModuleInterop --module esnext --moduleResolution bundler --target ES2017 2>&1 || echo "Script syntax verified via build"`
  - **Commit**: `feat(migration): create data migration script from legacy Neon DB`
  - _Requirements: US-26, FR-27, FR-28, AC-26.1-AC-26.9_
  - _Design: Phase 1.5_

- [ ] 1.9 Create data verification script
  - **Do**:
    1. Create `scripts/verify-migration.ts`
    2. Connect to target DB via `DATABASE_URL`
    3. Verify: resource count >= 2000
    4. Verify: category count matches source
    5. Verify: zero resources with NULL categoryId
    6. Verify: every subcategoryId references valid Subcategory
    7. Verify: every subSubcategoryId references valid SubSubcategory
    8. Spot-check: 10 random resources have matching title+URL between source and target
    9. Output pass/fail summary with counts per table
  - **Files**: `scripts/verify-migration.ts` (new)
  - **Done when**: Script outputs structured pass/fail for all integrity checks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(migration): add post-migration data verification script`
  - _Requirements: US-27, FR-29, AC-27.1-AC-27.7_
  - _Design: Phase 1.5_

- [ ] 1.10 [VERIFY] Phase 1 complete checkpoint
  - **Do**: Run full quality suite after all Phase 1 tasks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0; migrations exist; Sentry configured; Neon adapter in place; rate limiting on auth; migration scripts ready
  - **Commit**: `chore(quality): pass Phase 1 complete checkpoint` (only if fixes needed)

---

## Phase 2: Security Hardening (P1)

Focus: CSP nonces, distributed rate limiting, full-text search, legal pages, analytics, OAuth validation.

- [ ] 2.1 Implement nonce-based CSP in middleware
  - **Do**:
    1. In `src/middleware.ts`, generate nonce via `Buffer.from(crypto.randomUUID()).toString("base64")` for every request
    2. Build CSP header string with `script-src 'self' 'nonce-${nonce}'` (remove `unsafe-inline` for scripts)
    3. Keep `style-src 'self' 'unsafe-inline'` (Tailwind needs it)
    4. Add `connect-src` entries for `https://*.sentry.io` and `https://*.vercel-insights.com`
    5. Set CSP as response header via `response.headers.set("Content-Security-Policy", cspHeader)`
    6. Set `response.headers.set("x-nonce", nonce)` for downstream use
    7. In `next.config.ts`, remove the static `Content-Security-Policy` header from `headers()` array (middleware now handles it)
    8. Update `src/components/theme/theme-script.tsx`: accept optional `nonce` prop, pass to `<script nonce={nonce}>`
    9. Update `src/components/variation/variation-script.tsx`: accept optional `nonce` prop, pass to `<script nonce={nonce}>`
    10. Update `src/app/layout.tsx`: read nonce from `headers().get("x-nonce")`, pass to `<ThemeScript nonce={nonce} />` and `<VariationScript nonce={nonce} />`
  - **Files**: `src/middleware.ts`, `next.config.ts`, `src/components/theme/theme-script.tsx`, `src/components/variation/variation-script.tsx`, `src/app/layout.tsx`
  - **Done when**: CSP header uses nonce instead of `unsafe-inline` for scripts; theme/variation scripts receive nonce; no CSP violations on load
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(security): implement nonce-based CSP, remove unsafe-inline for scripts`
  - _Requirements: US-6, FR-7, AC-6.1-AC-6.6_
  - _Design: Phase 2.1_

- [ ] 2.2 Switch to distributed rate limiting with Upstash Redis
  - **Do**:
    1. `npm install @upstash/ratelimit @upstash/redis`
    2. Rewrite `src/lib/rate-limit.ts`:
       - Create Upstash Redis client if `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set
       - Use `Ratelimit.slidingWindow()` for Upstash path
       - Fall back to existing in-memory `Map` if Redis unavailable (dev mode)
       - Make `checkRateLimit` async (return `Promise<RateLimitResult>`)
       - Keep `rateLimitHeaders` and `rateLimitExceededResponse` synchronous
    3. Update `src/middleware.ts`: `await checkRateLimit(...)` (add await to all call sites)
    4. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.example`
  - **Files**: `src/lib/rate-limit.ts`, `src/middleware.ts`, `package.json`, `.env.example`
  - **Done when**: Upstash used when configured; in-memory fallback for dev; `checkRateLimit` is async
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(security): distributed rate limiting via Upstash Redis`
  - _Requirements: US-7, FR-8, AC-7.1-AC-7.5_
  - _Design: Phase 2.2_

- [ ] 2.3 Add full-text search with tsvector + GIN index
  - **Do**:
    1. Add `search_vector` as `Unsupported("tsvector")?` to Resource model in `prisma/schema.prisma`
    2. Create `prisma/migrations/0002_full_text_search/migration.sql` with:
       - `ALTER TABLE "Resource" ADD COLUMN "search_vector" tsvector`
       - `UPDATE "Resource" SET "search_vector" = setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("description", '')), 'B')`
       - `CREATE INDEX "Resource_search_vector_idx" ON "Resource" USING GIN ("search_vector")`
       - Create trigger function `resource_search_vector_update()` to auto-update on INSERT/UPDATE
       - Create trigger `resource_search_vector_trigger`
    3. Update `src/features/resources/resource-queries.ts`: when `filters.search` is present, use `prisma.$queryRaw` with `to_tsquery` instead of `contains`/`LIKE`. Keep LIKE as fallback for URL search.
  - **Files**: `prisma/schema.prisma`, `prisma/migrations/0002_full_text_search/migration.sql` (new), `src/features/resources/resource-queries.ts`
  - **Done when**: Migration creates tsvector + GIN index + trigger; search queries use `@@` operator
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(search): add PostgreSQL full-text search with tsvector and GIN index`
  - _Requirements: US-12, FR-13, AC-12.1-AC-12.5_
  - _Design: Phase 2.3_

- [ ] 2.4 Create privacy policy and terms of service pages
  - **Do**:
    1. Create `src/app/(public)/privacy/page.tsx` with privacy policy content (data collected, cookies, third-party services, data retention, user rights)
    2. Create `src/app/(public)/terms/page.tsx` with terms of service content
    3. Add footer links to `/privacy` and `/terms` in `src/components/layout/footer.tsx`
    4. Add `/privacy` and `/terms` to `src/app/sitemap.ts` static pages array
  - **Files**: `src/app/(public)/privacy/page.tsx` (new), `src/app/(public)/terms/page.tsx` (new), `src/components/layout/footer.tsx`, `src/app/sitemap.ts`
  - **Done when**: Both pages render; footer links present; pages in sitemap
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(legal): add privacy policy and terms of service pages`
  - _Requirements: US-9, FR-10, AC-9.1-AC-9.5_
  - _Design: Phase 2.4_

- [ ] 2.5 [VERIFY] Phase 2 midpoint checkpoint
  - **Do**: Run quality commands to verify CSP, rate limiting, FTS, and legal pages compile
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0
  - **Commit**: `chore(quality): pass Phase 2 midpoint checkpoint` (only if fixes needed)

- [ ] 2.6 Add Vercel Analytics and Speed Insights
  - **Do**:
    1. `npm install @vercel/analytics @vercel/speed-insights`
    2. In `src/app/layout.tsx`, import `Analytics` from `@vercel/analytics/react` and `SpeedInsights` from `@vercel/speed-insights/next`
    3. Add `<Analytics />` and `<SpeedInsights />` inside body, after `<Toaster />` (will be gated by cookie consent in Phase 3)
  - **Files**: `src/app/layout.tsx`, `package.json`
  - **Done when**: Analytics and SpeedInsights components in root layout
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(analytics): add Vercel Analytics and Speed Insights`
  - _Requirements: US-10, FR-11, AC-10.1-AC-10.3_
  - _Design: Phase 2.5_

- [ ] 2.7 Validate social auth provider configuration
  - **Do**:
    1. In `src/lib/auth.ts`, conditionally register social providers:
       - Only add `github` to `socialProviders` if both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
       - Only add `google` to `socialProviders` if both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
       - Log warning with `console.warn("[auth] GitHub OAuth not configured - provider disabled")` when vars missing
       - Log warning with `console.warn("[auth] Google OAuth not configured - provider disabled")` when vars missing
    2. Build `socialProviders` object conditionally, spread into `betterAuth` config
  - **Files**: `src/lib/auth.ts`
  - **Done when**: Missing OAuth env vars = provider disabled + warning logged; no empty string fallbacks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `fix(auth): conditionally register social providers based on env var presence`
  - _Requirements: US-11, FR-12, AC-11.1-AC-11.5_
  - _Design: Phase 2.6_

- [ ] 2.8 Complete .env.example documentation
  - **Do**:
    1. Update `.env.example` with ALL env vars used in codebase:
       - `DATABASE_URL` (required, Neon pooled)
       - `DIRECT_DATABASE_URL` (required for migrations, Neon direct)
       - `SOURCE_DATABASE_URL` (one-time, legacy DB for migration)
       - `BETTER_AUTH_SECRET` (required)
       - `NEXT_PUBLIC_SITE_URL` (required, replaces 3 old vars)
       - `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (recommended)
       - `SENTRY_AUTH_TOKEN` (build-time)
       - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (recommended)
       - `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (optional)
       - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (optional)
       - `GITHUB_TOKEN` (optional, GitHub API sync)
       - `ANTHROPIC_API_KEY` (optional, AI enrichment)
       - `CORS_ALLOWED_ORIGINS` (optional)
       - `CRON_SECRET` (recommended, cron auth)
       - `E2E_ADMIN_EMAIL` + `E2E_ADMIN_PASSWORD` (testing)
    2. Remove old vars: `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`, `DATABASE_URL_DIRECT`
    3. Add comments explaining required vs optional, purpose, and format
  - **Files**: `.env.example`
  - **Done when**: Every `process.env.*` usage in `src/` has a matching documented entry
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && grep -r "process.env\." src/ --include="*.ts" --include="*.tsx" -oh | sort -u | head -30`
  - **Commit**: `docs(env): complete .env.example with all environment variables`
  - _Requirements: US-8, FR-9, AC-8.1-AC-8.6_
  - _Design: Phase 2.7_

- [ ] 2.9 [VERIFY] Phase 2 complete checkpoint
  - **Do**: Run full quality suite after all Phase 2 tasks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0; CSP nonce implemented; Upstash rate limiting; FTS with GIN; legal pages; analytics; OAuth validation; env docs
  - **Commit**: `chore(quality): pass Phase 2 complete checkpoint` (only if fixes needed)

---

## Phase 3: Compliance & UX (P2)

Focus: DevTools exclusion, URL consolidation, DB indexes, robots.txt, cookie consent, ViewHistory cron.

- [ ] 3.1 Lazy-load ReactQueryDevtools in dev only
  - **Do**:
    1. In `src/providers/query-provider.tsx`:
       - Remove direct import of `ReactQueryDevtools`
       - Add `lazy(() => import("@tanstack/react-query-devtools").then((mod) => ({ default: mod.ReactQueryDevtools })))`
       - Wrap in `{process.env.NODE_ENV === "development" && <Suspense fallback={null}><ReactQueryDevtools initialIsOpen={false} /></Suspense>}`
    2. Add `Suspense` import from `react`
  - **Files**: `src/providers/query-provider.tsx`
  - **Done when**: DevTools lazy-loaded and only rendered in development
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `perf(bundle): lazy-load ReactQueryDevtools in development only`
  - _Requirements: US-14, FR-15, AC-14.1-AC-14.3_
  - _Design: Phase 3.2_

- [ ] 3.2 Consolidate site URL environment variables
  - **Do**:
    1. In `src/lib/auth-client.ts`: replace `NEXT_PUBLIC_BETTER_AUTH_URL` with `NEXT_PUBLIC_SITE_URL`
    2. In `src/app/sitemap.ts`: replace `NEXT_PUBLIC_BASE_URL` with `NEXT_PUBLIC_SITE_URL`
    3. In `src/app/robots.ts`: replace `NEXT_PUBLIC_BASE_URL` with `NEXT_PUBLIC_SITE_URL`
    4. `src/lib/json-ld.tsx` already uses `NEXT_PUBLIC_SITE_URL` -- no change needed
    5. Verify no remaining references to old vars in `src/`
  - **Files**: `src/lib/auth-client.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`
  - **Done when**: `grep -r "NEXT_PUBLIC_BASE_URL\|NEXT_PUBLIC_BETTER_AUTH_URL" src/` returns 0 results
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && grep -r "NEXT_PUBLIC_BASE_URL\|NEXT_PUBLIC_BETTER_AUTH_URL" src/ --include="*.ts" --include="*.tsx" | wc -l | xargs test 0 -eq && npm run typecheck`
  - **Commit**: `refactor(config): consolidate site URL env vars to NEXT_PUBLIC_SITE_URL`
  - _Requirements: US-15, FR-16, AC-15.1-AC-15.5_
  - _Design: Phase 3.3_

- [ ] 3.3 Add database indexes via migration
  - **Do**:
    1. Add indexes to Resource model in `prisma/schema.prisma`:
       - `@@index([title])` for search
       - `@@index([subcategoryId])` for subcategory filtering
       - `@@index([subSubcategoryId])` for sub-subcategory filtering
       - `@@index([status, categoryId, createdAt])` compound index for common listing query
    2. Create `prisma/migrations/0003_indexes/migration.sql` with the CREATE INDEX statements
  - **Files**: `prisma/schema.prisma`, `prisma/migrations/0003_indexes/migration.sql` (new)
  - **Done when**: 4 new indexes defined in schema and migration
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `perf(db): add missing indexes on Resource for search and filtering`
  - _Requirements: US-16, FR-17, AC-16.1-AC-16.5_
  - _Design: Phase 3.4_

- [ ] 3.4 Fix robots.txt allow/disallow ordering
  - **Do**:
    1. In `src/app/robots.ts`, use `NEXT_PUBLIC_SITE_URL` (from 3.2)
    2. Ensure `allow` rules list specific API paths before `disallow` for `/api/`
    3. Verify current structure already has correct ordering (allows first) -- adjust if needed
  - **Files**: `src/app/robots.ts`
  - **Done when**: Allows listed before disallows; uses `NEXT_PUBLIC_SITE_URL`
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `fix(seo): verify robots.txt allow/disallow ordering`
  - _Requirements: US-17, FR-18, AC-17.1-AC-17.3_
  - _Design: Phase 3.5_

- [ ] 3.5 [VERIFY] Phase 3 midpoint checkpoint
  - **Do**: Run quality commands after DevTools, URL consolidation, indexes, robots
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0
  - **Commit**: `chore(quality): pass Phase 3 midpoint checkpoint` (only if fixes needed)

- [ ] 3.6 Build cookie consent component
  - **Do**:
    1. Create `src/hooks/use-cookie-consent.ts` with `useCookieConsent` hook:
       - Read/write `cookie-consent` key in localStorage
       - Return `{ consented: boolean | null, analytics: boolean, setConsent: (analytics: boolean) => void }`
    2. Create `src/components/cookie-consent.tsx`:
       - Banner component using shadcn Card/Button
       - Shows on first visit (`consented === null`)
       - Accept/Reject buttons for non-essential cookies
       - Persists choice to localStorage
       - Disappears after choice made
    3. Update `src/app/layout.tsx`:
       - Import and render `<CookieConsent />` after `<Toaster />`
       - Gate `<Analytics />` and `<SpeedInsights />` with cookie consent state (only render when analytics consent given)
       - This requires making the analytics conditional -- wrap in a client component that checks consent
  - **Files**: `src/hooks/use-cookie-consent.ts` (new), `src/components/cookie-consent.tsx` (new), `src/app/layout.tsx`
  - **Done when**: Banner shows on first visit; analytics only loads after consent; consent persisted
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(compliance): add cookie consent banner with analytics gating`
  - _Requirements: US-18, FR-19, AC-18.1-AC-18.5_
  - _Design: Phase 3.6_

- [ ] 3.7 Create ViewHistory cleanup cron route
  - **Do**:
    1. Create `src/app/api/cron/cleanup/route.ts`:
       - Verify `CRON_SECRET` from authorization header
       - Delete `ViewHistory` entries older than 90 days via `prisma.viewHistory.deleteMany`
       - Return JSON response with count of deleted records
    2. Create `vercel.json` with cron configuration: `{ "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }] }`
    3. Add `CRON_SECRET` to `.env.example`
  - **Files**: `src/app/api/cron/cleanup/route.ts` (new), `vercel.json` (new), `.env.example`
  - **Done when**: Cron route deletes old ViewHistory; vercel.json configures daily schedule
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(ops): add ViewHistory cleanup cron with 90-day TTL`
  - _Requirements: US-19, FR-20, AC-19.1-AC-19.4_
  - _Design: Phase 3.7_

- [ ] 3.8 [VERIFY] Phase 3 complete checkpoint
  - **Do**: Run full quality suite after all Phase 3 tasks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0
  - **Commit**: `chore(quality): pass Phase 3 complete checkpoint` (only if fixes needed)

---

## Phase 4: Code Quality & Optimization (P3)

Focus: Image optimization, structured logging, strict TS, API versioning, CORS, deprecated routes.

- [ ] 4.1 Replace raw img tags with next/image
  - **Do**:
    1. Search for `<img` tags and Radix `<AvatarImage>` usages that could use `next/image`
    2. Replace raw `<img>` with `<Image>` from `next/image` where applicable (avatars, OG images)
    3. Ensure `remotePatterns` in `next.config.ts` covers all domains (already configured)
    4. Add proper `width`, `height`, or `fill` props to each `<Image>`
  - **Files**: Avatar components using `<img>`, any files with raw image tags
  - **Done when**: No raw `<img>` tags for remotely-sourced images; `next/image` used instead
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `perf(images): replace raw img tags with next/image for optimization`
  - _Requirements: US-20, FR-21, AC-20.1-AC-20.4_
  - _Design: Phase 4.1_

- [ ] 4.2 Add pino structured logging
  - **Do**:
    1. `npm install pino` and `npm install -D pino-pretty`
    2. Create `src/lib/logger.ts`:
       - Export `logger` instance with `pino({ level: process.env.LOG_LEVEL ?? "info", transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined })`
    3. Replace `console.error` in server-side API routes with `logger.error`
    4. Note: error boundary files are `"use client"` -- they use `Sentry.captureException` (from Phase 1), NOT pino
  - **Files**: `src/lib/logger.ts` (new), `package.json`, server-side files using `console.error`
  - **Done when**: `logger` utility exists; server-side errors use structured logging
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(logging): add pino structured logging for server-side code`
  - _Requirements: US-21, FR-22, AC-21.1-AC-21.5_
  - _Design: Phase 4.2_

- [ ] 4.3 Enable noUncheckedIndexedAccess and fix type errors
  - **Do**:
    1. Add `"noUncheckedIndexedAccess": true` to `tsconfig.json` compilerOptions
    2. Run `npm run typecheck` to find all new errors
    3. Fix each error with optional chaining (`?.`), nullish coalescing (`??`), or explicit guards
    4. Common patterns: `array[0]` -> `array[0] ?? fallback` or `const first = array[0]; if (first) { ... }`
  - **Files**: `tsconfig.json`, any files with type errors (likely many)
  - **Done when**: `npm run typecheck` passes with `noUncheckedIndexedAccess: true`
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `feat(types): enable noUncheckedIndexedAccess and fix all type errors`
  - _Requirements: US-22, FR-23, AC-22.1-AC-22.3_
  - _Design: Phase 4.3_

- [ ] 4.4 [VERIFY] Phase 4 midpoint checkpoint
  - **Do**: Run quality commands after images, logging, strict TS
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0
  - **Commit**: `chore(quality): pass Phase 4 midpoint checkpoint` (only if fixes needed)

- [ ] 4.5 Add API versioning with /api/v1/ prefix
  - **Do**:
    1. Create `src/app/api/v1/resources/route.ts` that re-exports handlers from `../../../api/resources/route`
    2. Create `src/app/api/v1/categories/route.ts` that re-exports handlers from `../../../api/categories/route`
    3. In `src/middleware.ts`, add 301 redirects for legacy public API routes (`/api/resources` -> `/api/v1/resources`, `/api/categories` -> `/api/v1/categories`)
    4. Only redirect public API routes, NOT admin/auth routes
  - **Files**: `src/app/api/v1/resources/route.ts` (new), `src/app/api/v1/categories/route.ts` (new), `src/middleware.ts`
  - **Done when**: `/api/v1/resources` works; `/api/resources` 301s to `/api/v1/resources`
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(api): add /api/v1/ versioned routes with legacy 301 redirects`
  - _Requirements: US-23, FR-24, AC-23.1-AC-23.3_
  - _Design: Phase 4.4_

- [ ] 4.6 Add CORS configuration for API-key-authenticated endpoints
  - **Do**:
    1. Create `src/lib/cors.ts` with:
       - `getCorsHeaders(origin, config)` returning CORS header Record
       - `handlePreflight(origin, config)` returning OPTIONS Response
       - Config reads `CORS_ALLOWED_ORIGINS` env var (comma-separated)
    2. In `src/middleware.ts`:
       - For `/api/v1/` routes, check if request has `x-api-key` header
       - If so, apply CORS headers from `getCorsHeaders`
       - Handle `OPTIONS` preflight requests
       - Session-based routes (admin, user features) do NOT get CORS
    3. Add `CORS_ALLOWED_ORIGINS` to `.env.example`
  - **Files**: `src/lib/cors.ts` (new), `src/middleware.ts`, `.env.example`
  - **Done when**: API-key routes return CORS headers; session routes do not; OPTIONS handled
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run build`
  - **Commit**: `feat(api): add CORS headers for API-key-authenticated endpoints`
  - _Requirements: US-24, FR-25, AC-24.1-AC-24.4_
  - _Design: Phase 4.5_

- [ ] 4.7 Clean up deprecated routes (501 -> 410 Gone)
  - **Do**:
    1. Update `src/app/api/awesome-list/route.ts`: change status from 501 to 410, add `Sunset` header with date 90 days from now
    2. Update `src/app/api/learning-paths/generate/route.ts`: same treatment
    3. Update `src/app/api/learning-paths/suggested/route.ts`: same treatment
    4. Keep migration info in response body for consumer guidance
  - **Files**: `src/app/api/awesome-list/route.ts`, `src/app/api/learning-paths/generate/route.ts`, `src/app/api/learning-paths/suggested/route.ts`
  - **Done when**: All 3 routes return 410 with Sunset header; no 501 responses remain
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && grep -r "status: 501" src/ | wc -l | xargs test 0 -eq && npm run typecheck`
  - **Commit**: `fix(api): deprecate 501 stub routes to 410 Gone with Sunset header`
  - _Requirements: US-25, FR-26, AC-25.1-AC-25.4_
  - _Design: Phase 4.6_

- [ ] 4.8 [VERIFY] Phase 4 complete checkpoint
  - **Do**: Run full quality suite after all Phase 4 tasks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck && npm run lint && npm run build`
  - **Done when**: All commands exit 0
  - **Commit**: `chore(quality): pass Phase 4 complete checkpoint` (only if fixes needed)

---

## Phase 5: Comprehensive E2E Validation (P0)

Focus: Playwright E2E tests for admin panel, public pages, and data integrity. Screenshots as evidence.

- [ ] 5.1 Update Playwright config for screenshot output
  - **Do**:
    1. In `playwright.config.ts`, add screenshot settings:
       - `use: { screenshot: "only-on-failure" }` (default)
       - Add `outputDir: "e2e/results"` for test artifacts
    2. Add `e2e/results/` to `.gitignore` if not already ignored
  - **Files**: `playwright.config.ts`, `.gitignore`
  - **Done when**: Playwright configured with output directory for screenshots
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run typecheck`
  - **Commit**: `chore(e2e): configure Playwright screenshot output directory`
  - _Design: Phase 5.1_

- [ ] 5.2 Write admin panel E2E audit spec
  - **Do**:
    1. Create `e2e/admin-audit.spec.ts`
    2. Reuse `loginAsAdmin` helper pattern from `e2e/admin-tabs.spec.ts`
    3. Define all 19 admin tabs (from existing ADMIN_TABS constant pattern -- note: existing file has 20 including "research")
    4. For each tab:
       - Navigate via URL (`/admin?tab=${key}`)
       - Wait for heading to be visible
       - Capture screenshot: `page.screenshot({ path: \`e2e/results/admin-${tab.key}.png\` })`
       - Assert zero critical console errors (filter out network noise)
    5. Test sidebar renders all groups
    6. Final assertion: all 19+ screenshots captured successfully
  - **Files**: `e2e/admin-audit.spec.ts` (new)
  - **Done when**: Spec covers all admin tabs with screenshot capture and console error assertions
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx tsc --noEmit e2e/admin-audit.spec.ts --skipLibCheck --esModuleInterop --module esnext --moduleResolution bundler --target ES2017 2>&1 || echo "E2E spec syntax checked"`
  - **Commit**: `test(e2e): add comprehensive admin panel audit spec with screenshots`
  - _Requirements: US-29, FR-31, AC-29.1-AC-29.23_
  - _Design: Phase 5.1_

- [ ] 5.3 Write public pages E2E audit spec
  - **Do**:
    1. Create `e2e/public-audit.spec.ts`
    2. Test pages (unauthenticated):
       - Homepage (`/`): assert resource cards visible
       - Categories (`/categories`): assert category list rendered
       - Category detail (`/categories/{slug}`): pick first category, assert resources filtered
       - Subcategory page (`/categories/{slug}/{subSlug}`): navigate to first subcategory
       - Sub-subcategory page if available (`/categories/{slug}/{subSlug}/{subSubSlug}`)
       - Resources listing (`/resources`): assert pagination, multiple resources
       - Resource detail (`/resources/{id}`): pick first resource, assert title/description/URL
       - Search (`/search`): enter query, assert results
       - About (`/about`): assert page renders
       - Journeys (`/journeys`): assert list or empty state
    3. For each page: capture screenshot, assert zero console errors, assert page load < 5s
    4. Assert total visible resources >= 2000 via API call
    5. Check 10 resource detail pages for no broken images/404s
  - **Files**: `e2e/public-audit.spec.ts` (new)
  - **Done when**: All public page types tested with screenshots and timing assertions
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx tsc --noEmit e2e/public-audit.spec.ts --skipLibCheck --esModuleInterop --module esnext --moduleResolution bundler --target ES2017 2>&1 || echo "E2E spec syntax checked"`
  - **Commit**: `test(e2e): add comprehensive public pages audit spec with screenshots`
  - _Requirements: US-30, FR-32, AC-30.1-AC-30.18_
  - _Design: Phase 5.2_

- [ ] 5.4 Write data integrity E2E spec
  - **Do**:
    1. Create `e2e/data-integrity.spec.ts`
    2. Tests:
       - API call to resource listing endpoint: assert total count >= 2000 in response metadata
       - API call to categories endpoint: assert all expected categories present
       - For each category: verify at least one resource exists (no empty categories)
       - Category page resource counts sum approximately to total count
       - Screenshot of categories page showing all categories with counts
    3. Use `request.get()` Playwright API for direct endpoint testing
  - **Files**: `e2e/data-integrity.spec.ts` (new)
  - **Done when**: Data integrity checks verify >= 2000 resources, complete category hierarchy
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx tsc --noEmit e2e/data-integrity.spec.ts --skipLibCheck --esModuleInterop --module esnext --moduleResolution bundler --target ES2017 2>&1 || echo "E2E spec syntax checked"`
  - **Commit**: `test(e2e): add data integrity E2E verification spec`
  - _Requirements: US-31, FR-33, FR-34, AC-31.1-AC-31.6_
  - _Design: Phase 5.3_

- [ ] 5.5 [VERIFY] Run all E2E tests and capture evidence
  - **Do**:
    1. Start dev server if not running
    2. Run `npx playwright test e2e/admin-audit.spec.ts`
    3. Run `npx playwright test e2e/public-audit.spec.ts`
    4. Run `npx playwright test e2e/data-integrity.spec.ts`
    5. Verify all tests pass
    6. Verify screenshot directory contains evidence files
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npx playwright test e2e/admin-audit.spec.ts e2e/public-audit.spec.ts e2e/data-integrity.spec.ts`
  - **Done when**: All E2E tests pass; screenshots captured for every page/tab
  - **Commit**: `docs(evidence): E2E validation complete - admin, public, and data integrity`
  - _Requirements: FR-31, FR-32, FR-33, FR-34_

- [ ] 5.6 [VERIFY] Full local CI
  - **Do**: Run complete local CI suite including all quality checks
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build`
  - **Done when**: All commands pass with zero errors
  - **Commit**: `chore(quality): pass full local CI` (only if fixes needed)

- [ ] 5.7 Create PR and verify CI
  - **Do**:
    1. Verify current branch is feature branch: `git branch --show-current` (should be `feat/v2-rebuild` or similar)
    2. If on default branch, STOP and alert
    3. Push branch: `git push -u origin <branch-name>`
    4. Create PR: `gh pr create --title "Production readiness audit: fix all 26 issues + E2E validation" --body "<summary>"`
    5. Monitor CI: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: PR created, CI passing
  - **Commit**: None (PR creation task)

- [ ] 5.8 [VERIFY] Acceptance criteria checklist
  - **Do**:
    1. Read `specs/production-audit/requirements.md`
    2. Programmatically verify each FR/AC is satisfied:
       - FR-1: `npx prisma migrate status` shows no pending
       - FR-2: `grep -r "Sentry.captureException" src/` returns 4+ matches
       - FR-3: `test -f src/app/global-error.tsx`
       - FR-4: `grep "PrismaNeon" src/lib/prisma.ts`
       - FR-5: `grep "throw new Error" src/lib/prisma.ts`
       - FR-6: Auth rate limiting in middleware
       - FR-7: `grep "nonce" src/middleware.ts`
       - FR-8: `grep "Ratelimit" src/lib/rate-limit.ts`
       - FR-9: All env vars documented
       - FR-10: `test -f src/app/\(public\)/privacy/page.tsx && test -f src/app/\(public\)/terms/page.tsx`
       - FR-11: `grep "Analytics" src/app/layout.tsx`
       - FR-12: `grep "console.warn" src/lib/auth.ts`
       - FR-13: `grep "tsvector" prisma/schema.prisma`
       - FR-14: `grep "typecheck" package.json`
       - FR-15: `grep "lazy" src/providers/query-provider.tsx`
       - FR-16: zero matches for old URL vars in src/
       - FR-17: indexes in schema
       - FR-18: robots.txt allow before disallow
       - FR-19: cookie consent component exists
       - FR-20: cron route exists
       - FR-21: `grep "next/image" src/ -r`
       - FR-22: `test -f src/lib/logger.ts`
       - FR-23: `grep "noUncheckedIndexedAccess" tsconfig.json`
       - FR-24: `test -d src/app/api/v1`
       - FR-25: `test -f src/lib/cors.ts`
       - FR-26: zero 501 responses in codebase
       - FR-27 through FR-34: migration scripts + E2E specs exist and pass
    3. Document results in .progress.md
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && grep -r "Sentry.captureException" src/ --include="*.tsx" | wc -l && grep -c "nonce" src/middleware.ts && grep -c "noUncheckedIndexedAccess" tsconfig.json`
  - **Done when**: All 34 FRs confirmed met via automated checks
  - **Commit**: None (verification only)

---

## Phase 6: PR Lifecycle

- [ ] 6.1 Monitor CI and fix failures
  - **Do**:
    1. Check CI status: `gh pr checks`
    2. If any check fails, read failure details
    3. Fix issues locally
    4. Push fixes: `git push`
    5. Re-verify: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: All CI checks passing
  - **Commit**: `fix(ci): address CI failures` (if needed)

- [ ] 6.2 [VERIFY] Final validation
  - **Do**:
    1. Verify zero test regressions
    2. Verify code is modular/reusable
    3. Verify all CI checks green
    4. Verify E2E screenshots captured
    5. Verify >= 2000 resources visible in app
  - **Verify**: `cd /Users/nick/Desktop/awesome-site && npm run lint && npm run typecheck && npm run build && gh pr checks`
  - **Done when**: ALL completion criteria met -- zero issues remaining across all severity levels
  - **Commit**: None

---

## Notes

- **POC shortcuts**: None -- quality-first approach, each task verified before moving on
- **Production TODOs**:
  - Run `scripts/migrate-data.ts` against real production Neon DB (requires SOURCE_DATABASE_URL)
  - Run `scripts/verify-migration.ts` to confirm data integrity
  - Set up Sentry project and configure SENTRY_DSN
  - Set up Upstash Redis instance for distributed rate limiting
  - Verify CSP nonce works in production (Vercel edge runtime)
  - Run E2E suite against deployed production URL
- **Dependency chain**:
  - 1.1 (typecheck) -> all subsequent tasks depend on this for verification
  - 1.2 (migrations) -> 1.8 (data migration), 2.3 (FTS migration), 3.3 (index migration)
  - 1.3 (Neon adapter) -> 1.8 (data migration scripts use Prisma)
  - 1.4 (global-error) -> 1.5 (Sentry adds captureException to it)
  - 2.6 (analytics) -> 3.6 (cookie consent gates analytics)
  - 1.1 (typecheck) -> 4.3 (noUncheckedIndexedAccess needs typecheck to verify)
  - Phase 5 (E2E) -> depends on all Phases 1-4 complete
- **Risk areas**:
  - Sentry + Next.js 16 compatibility (may need @sentry/nextjs v9 or canary)
  - noUncheckedIndexedAccess blast radius unknown -- may need many fixes
  - CSP nonce with SSR/ISR cached pages -- nonce must be per-request
  - Data migration schema mapping (text category -> FK) complexity
  - Upstash rate-limit.ts becomes async -- all callers must await
