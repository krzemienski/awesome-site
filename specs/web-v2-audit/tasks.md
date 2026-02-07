---
spec: web-v2-audit
phase: tasks
total_tasks: 38
created: 2026-02-06T22:57:00-05:00
---

# Tasks: V2 Rebuild Audit & Production Readiness

## Phase 1: Critical Foundation (Error Boundaries + Seed Script)

- [x] 1.1 Create global error boundary
  - **Do**:
    1. Create `src/app/error.tsx` as `"use client"` component
    2. Accept `{ error, reset }` props (Next.js convention)
    3. Show themed error UI with `Container`, `Button` from existing components
    4. Include retry button calling `reset()` and "Go Home" link to `/`
    5. Show `error.message` only when `process.env.NODE_ENV === "development"`
    6. Log error to `console.error` in all environments
  - **Files**: `src/app/error.tsx`
  - **Done when**: File exists, exports default client component with retry + home nav
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(error): add global error boundary with retry and navigation`
  - _Requirements: FR-1, AC-1.1, AC-1.4, AC-1.5_
  - _Design: WS-1 Global Error Boundary_

- [ ] 1.2 Create public route error boundary
  - **Do**:
    1. Create `src/app/(public)/error.tsx` as `"use client"` component
    2. Same interface as global but with "Browse Resources" (`/resources`) and "View Categories" (`/categories`) navigation links
    3. Suppress stack traces in production via `process.env.NODE_ENV` check
    4. Use `Container`, `Button`, `Card` from existing components
  - **Files**: `src/app/(public)/error.tsx`
  - **Done when**: File exists with themed public-specific error UI
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(error): add public route error boundary`
  - _Requirements: FR-2, AC-1.2, AC-1.4, AC-1.5_
  - _Design: WS-1 Public Error Boundary_

- [ ] 1.3 Create admin error boundary
  - **Do**:
    1. Create `src/app/admin/error.tsx` as `"use client"` component
    2. Same interface but with "Return to Dashboard" link (`/admin`) and admin-specific messaging
    3. Include "If this persists, check server logs" text
  - **Files**: `src/app/admin/error.tsx`
  - **Done when**: File exists with admin-scoped error UI
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(error): add admin error boundary`
  - _Requirements: FR-3, AC-1.3, AC-1.4, AC-1.5_
  - _Design: WS-1 Admin Error Boundary_

- [ ] 1.4 Create global not-found page
  - **Do**:
    1. Create `src/app/not-found.tsx` as server component (no `"use client"`)
    2. Export `metadata` with `title: "Page Not Found | Awesome Video Dashboard"`
    3. Render themed 404 UI with `Container`, `Button`
    4. Include links to home (`/`), resources (`/resources`), and categories (`/categories`)
    5. Display "404" prominently with explanation text
  - **Files**: `src/app/not-found.tsx`
  - **Done when**: Server component exports metadata, renders 404 UI with navigation
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(error): add global 404 not-found page`
  - _Requirements: FR-4, AC-2.1, AC-2.2, AC-2.3, AC-2.4_
  - _Design: WS-1 Global Not Found_

- [ ] 1.5 Create loading skeletons for resources, category, resource detail, and admin
  - **Do**:
    1. Create `src/app/(public)/resources/loading.tsx` -- mirror `ResourceBrowsePage` layout: title bar + view toggle skeleton, filter bar skeleton, 6-card grid skeleton using `Skeleton` from `@/components/ui/skeleton`
    2. Create `src/app/(public)/categories/[slug]/loading.tsx` -- mirror `CategoryDetailPage`: breadcrumb skeleton, title + description, 6-item subcategory grid, 6-item resource grid
    3. Create `src/app/(public)/resources/[id]/loading.tsx` -- mirror `ResourceDetailPage`: breadcrumb, title + URL, metadata row, description block, tags section, related section
    4. Create `src/app/admin/loading.tsx` -- mirror admin layout: sidebar skeleton, tab header, 3 stat cards, table skeleton
    5. All files are server components (no `"use client"`)
    6. Import `Skeleton` from `@/components/ui/skeleton`
  - **Files**: `src/app/(public)/resources/loading.tsx`, `src/app/(public)/categories/[slug]/loading.tsx`, `src/app/(public)/resources/[id]/loading.tsx`, `src/app/admin/loading.tsx`
  - **Done when**: All 4 loading files exist, render layout-matched skeletons
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(ux): add loading skeletons for resources, category, detail, and admin`
  - _Requirements: FR-5, FR-6, FR-7, FR-8, AC-3.1 through AC-3.6_
  - _Design: WS-1 Loading Skeletons_

- [ ] 1.6 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run lint and typecheck, fix any issues introduced by Phase 1 tasks
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5 && npx eslint src/app/error.tsx src/app/not-found.tsx src/app/admin/error.tsx "src/app/(public)/error.tsx" "src/app/(public)/resources/loading.tsx" "src/app/(public)/categories/[slug]/loading.tsx" "src/app/(public)/resources/[id]/loading.tsx" src/app/admin/loading.tsx 2>&1 | tail -5`
  - **Done when**: Zero errors on new files
  - **Commit**: `chore(quality): pass Phase 1 quality checkpoint` (only if fixes needed)

- [ ] 1.7 Create seed data fixtures
  - **Do**:
    1. Create `prisma/seed-data/categories.json` with 10+ categories matching legacy structure (e.g., "Video Streaming", "Video Editing", "Live Streaming", "Media Servers", etc.), each with `name`, `slug`, `description`, `icon`, `displayOrder`
    2. Create `prisma/seed-data/resources.json` with 10+ sample resources with real URLs, each with `title`, `url`, `description`, `categorySlug` (for linking), `status: "approved"`
    3. Ensure slugs are kebab-case and URLs are real/valid
  - **Files**: `prisma/seed-data/categories.json`, `prisma/seed-data/resources.json`
  - **Done when**: Both JSON files exist with valid, well-structured seed data
  - **Verify**: `node -e "const c = require('./prisma/seed-data/categories.json'); const r = require('./prisma/seed-data/resources.json'); console.log(c.length + ' categories, ' + r.length + ' resources'); if(c.length < 10 || r.length < 10) process.exit(1)"`
  - **Commit**: `feat(seed): add category and resource seed data fixtures`
  - _Requirements: FR-18, AC-9.1, AC-9.2_
  - _Design: WS-4 Seed Script_

- [ ] 1.8 Create idempotent seed script
  - **Do**:
    1. Create `prisma/seed.ts` importing `PrismaClient` from `@/generated/prisma/client`
    2. Read category and resource JSON fixtures from `prisma/seed-data/`
    3. Use `prisma.category.upsert` on unique `slug` for idempotency
    4. Use `prisma.resource.upsert` on unique `url` for idempotency
    5. Link resources to categories by resolving `categorySlug` to `categoryId`
    6. Add `prisma.seed` to `package.json`: `"prisma": { "seed": "npx tsx prisma/seed.ts" }`
    7. Use proper Prisma client initialization (import from generated client, handle connection/disconnect)
  - **Files**: `prisma/seed.ts`, `package.json`
  - **Done when**: `npx prisma db seed` runs without errors; running twice produces no duplicates
  - **Verify**: `node -e "const pkg = require('./package.json'); if(!pkg.prisma?.seed) { console.error('Missing prisma.seed in package.json'); process.exit(1) } else { console.log('prisma.seed:', pkg.prisma.seed) }"`
  - **Commit**: `feat(seed): add idempotent prisma seed script with upsert`
  - _Requirements: FR-18, FR-19, AC-9.1 through AC-9.4_
  - _Design: WS-4 Seed Script_

## Phase 2: Code Quality (ESLint Fixes)

- [ ] 2.1 Fix all unused variable/import ESLint warnings
  - **Do**: Fix all 34 ESLint warnings. Exact fixes by file:
    1. `src/app/(protected)/bookmarks/page.tsx:6` -- remove unused `ResourceGrid` import
    2. `src/app/(protected)/profile/page.tsx:195` -- remove or use `activeKeys` variable
    3. `src/app/api/admin/audit/route.ts:8` -- already underscore-prefixed `_ctx`, check ESLint config or remove param
    4. `src/app/api/admin/categories/route.ts:11` -- `_req` and `_ctx` already prefixed, verify config
    5. `src/app/api/admin/edits/route.ts:9` -- `_ctx` already prefixed
    6. `src/app/api/admin/journeys/route.ts:11` -- `_ctx` already prefixed
    7. `src/app/api/admin/resources/pending/route.ts:9` -- `_ctx` already prefixed
    8. `src/app/api/admin/resources/route.ts:11,68` -- `_ctx` prefixed; remove unused `pageCount`
    9. `src/app/api/admin/sub-subcategories/route.ts:11` -- `_req`, `_ctx` already prefixed
    10. `src/app/api/admin/subcategories/route.ts:11` -- `_req`, `_ctx` already prefixed
    11. `src/app/api/admin/tags/route.ts:9` -- `_req`, `_ctx` already prefixed
    12. `src/app/api/ai/analyze/route.ts:9` -- `_ctx` already prefixed
    13. `src/app/api/categories/route.ts:31` -- `_ctx` already prefixed
    14. `src/app/api/keys/route.ts:13` -- `_user` already prefixed
    15. `src/app/api/sub-subcategories/route.ts:42` -- `_ctx` already prefixed
    16. `src/app/api/subcategories/route.ts:38` -- `_ctx` already prefixed
    17. `src/components/admin/data-table.tsx:18` -- remove unused `cn` import; `:63` remove unused `TData`, `TValue` type params; `:158` suppress `react-hooks/incompatible-library` with `// eslint-disable-next-line react-hooks/incompatible-library`
    18. `src/components/admin/tabs/enrichment-tab.tsx:42` -- remove unused `CollapsibleContent` import
    19. `src/components/admin/tabs/learning-journeys-tab.tsx:6` -- remove unused `Loader2` import
    20. `src/components/journeys/step-completion-dialog.tsx:44` -- remove or prefix `journeyId` with `_`
    21. `src/components/resources/resource-filters.tsx:57` -- fix `useEffect` missing deps (add `onChange` and `value` to dependency array, ensure parent wraps `onChange` in `useCallback`)
    22. `src/components/resources/resource-grid.tsx:3,6` -- remove unused `ResourceCardProps` and `ResourceListItemProps` imports
    23. `src/features/ai/recommendation-engine.ts:19` -- remove unused `TagCount` interface
    24. `src/features/ai/research-service.ts:44` -- remove or prefix `_config`
    25. `src/features/github/awesome-lint.ts:244` -- remove or prefix `currentSectionLine` with `_`
    - For underscore-prefixed params that still warn: update ESLint config `@typescript-eslint/no-unused-vars` rule to add `argsIgnorePattern: "^_"` and `varsIgnorePattern: "^_"` in `eslint.config.mjs`
  - **Files**: ~20 files listed above + `eslint.config.mjs`
  - **Done when**: `npx eslint src/` reports 0 errors and 0 warnings
  - **Verify**: `npx eslint src/ 2>&1 | tail -3`
  - **Commit**: `fix(lint): resolve all 34 ESLint warnings`
  - _Requirements: FR-23 through FR-29, AC-11.1, AC-11.3, AC-11.4_
  - _Design: WS-5 Code Quality_

- [ ] 2.2 [VERIFY] Quality checkpoint: full lint + typecheck
  - **Do**: Run full lint and typecheck to confirm zero issues
  - **Verify**: `npx eslint src/ 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -5`
  - **Done when**: 0 errors, 0 warnings from eslint; 0 errors from tsc
  - **Commit**: `chore(quality): pass Phase 2 quality checkpoint` (only if fixes needed)

## Phase 3: High Priority Features (Endpoints + Cache + ISR)

- [ ] 3.1 Create related resources service
  - **Do**:
    1. Create `src/features/resources/related-resources.ts`
    2. Export `RelatedResource` interface: `{ id, title, url, description, category: { name, slug }, favoriteCount }`
    3. Export `getRelatedResources(resourceId: number, userId?: string, limit = 10)` function
    4. Logic: if `userId` provided, call `getRecommendations(userId, limit)` from `recommendation-engine.ts`, filter to same category as source resource
    5. Fallback (no userId or < 3 interactions): query `prisma.resource.findMany` for same-category approved resources, excluding current, ordered by favorites desc, take limit
    6. Import `getRecommendations` from `@/features/ai/recommendation-engine`
    7. Import `prisma` from `@/lib/prisma`
  - **Files**: `src/features/resources/related-resources.ts`
  - **Done when**: Service exports typed function with recommendation + fallback logic
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(resources): add related resources service with recommendation fallback`
  - _Requirements: FR-9, AC-4.1, AC-4.2, AC-4.3, AC-4.4_
  - _Design: WS-2 Related Resources_

- [ ] 3.2 Create GET /api/resources/[id]/related endpoint
  - **Do**:
    1. Create `src/app/api/resources/[id]/related/route.ts`
    2. Export `GET` handler following existing pattern: `async function GET(req, ctx)`
    3. Parse `id` from `await ctx.params`, validate as positive integer
    4. Optionally extract user from session (non-blocking -- auth is optional here)
    5. Call `getRelatedResources(resourceId, userId?)` from the new service
    6. Return `apiSuccess(results)`
    7. Wrap in try/catch with `handleApiError`
    8. Follow Next.js 16 async params pattern: `ctx: { params: Promise<{ id: string }> }`
  - **Files**: `src/app/api/resources/[id]/related/route.ts`
  - **Done when**: Endpoint returns related resources JSON
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(api): add GET /api/resources/[id]/related endpoint`
  - _Requirements: FR-9, AC-4.1_
  - _Design: WS-2 Related Resources Endpoint_

- [ ] 3.3 Create GET /api/user/submissions endpoint
  - **Do**:
    1. Create `src/app/api/user/submissions/route.ts`
    2. Export `GET` wrapped with `withAuth`
    3. Query `prisma.resource.findMany` where `submittedById = ctx.user.id`
    4. Include `category: { select: { name: true } }` and select `id, title, status, createdAt`
    5. Support pagination via query params (`page`, `limit`) using existing `PAGINATION` constants
    6. Return `apiPaginated(items, meta)`
  - **Files**: `src/app/api/user/submissions/route.ts`
  - **Done when**: Authenticated GET returns user's submitted resources with status
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(api): add GET /api/user/submissions endpoint`
  - _Requirements: FR-10, AC-5.1, AC-5.2, AC-5.3_
  - _Design: WS-2 User Submissions_

- [ ] 3.4 Create GET /api/user/progress endpoint
  - **Do**:
    1. Create `src/app/api/user/progress/route.ts`
    2. Export `GET` wrapped with `withAuth`
    3. Call `getUserJourneys(ctx.user.id)` from `@/features/journeys/journey-service`
    4. Aggregate: `totalJourneys`, `completedCount` (where `completedAt != null`), `overallPercentage`
    5. Map to per-journey summaries: `{ journeyId, title, percentage, lastActivity }`
    6. Return `apiSuccess({ totalJourneys, completedCount, overallPercentage, journeys })`
  - **Files**: `src/app/api/user/progress/route.ts`
  - **Done when**: Authenticated GET returns aggregated journey progress
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(api): add GET /api/user/progress endpoint`
  - _Requirements: FR-11, AC-6.1, AC-6.2, AC-6.3_
  - _Design: WS-2 User Progress_

- [ ] 3.5 Create POST /api/recommendations/feedback endpoint
  - **Do**:
    1. Create `src/app/api/recommendations/feedback/route.ts`
    2. Export `POST` wrapped with `withAuth`
    3. Define Zod schema inline: `{ resourceId: z.number().int().positive(), feedback: z.enum(["up", "down"]) }`
    4. Validate request body with schema
    5. Create `prisma.userInteraction.create` with `type: "rate"`, `metadata: { feedback }`, `userId: ctx.user.id`, `resourceId`
    6. Return `apiSuccess({ stored: true })`
  - **Files**: `src/app/api/recommendations/feedback/route.ts`
  - **Done when**: Authenticated POST stores feedback in UserInteraction table
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(api): add POST /api/recommendations/feedback endpoint`
  - _Requirements: FR-12, AC-7.1, AC-7.2, AC-7.3_
  - _Design: WS-2 Recommendation Feedback_

- [ ] 3.6 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run lint and typecheck on all new endpoint files
  - **Verify**: `npx eslint src/features/resources/related-resources.ts src/app/api/resources/[id]/related/route.ts src/app/api/user/submissions/route.ts src/app/api/user/progress/route.ts src/app/api/recommendations/feedback/route.ts 2>&1 | tail -5 && npx tsc --noEmit 2>&1 | tail -5`
  - **Done when**: Zero lint warnings/errors, zero type errors
  - **Commit**: `chore(quality): pass Phase 3a quality checkpoint` (only if fixes needed)

- [ ] 3.7 Create Cache-Control header helper and apply to public API routes
  - **Do**:
    1. Create `src/lib/api-cache.ts` with `withCacheHeaders(response: Response, maxAge = 60, staleWhileRevalidate = 300): Response` function
    2. Function clones response with added `Cache-Control: public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}` header
    3. Modify `src/app/api/resources/route.ts` GET: wrap return with `withCacheHeaders(apiPaginated(...), 60, 300)`
    4. Modify `src/app/api/resources/[id]/route.ts` GET: wrap return with `withCacheHeaders(apiSuccess(...), 60, 300)`
    5. Modify `src/app/api/categories/route.ts` GET: wrap return with `withCacheHeaders(apiSuccess(...), 300, 3600)`
    6. Modify `src/app/api/categories/[id]/route.ts` GET: wrap return with `withCacheHeaders(apiSuccess(...), 300, 3600)`
    7. Apply to new `src/app/api/resources/[id]/related/route.ts` GET: `withCacheHeaders(apiSuccess(...), 120, 600)`
  - **Files**: `src/lib/api-cache.ts`, `src/app/api/resources/route.ts`, `src/app/api/resources/[id]/route.ts`, `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`, `src/app/api/resources/[id]/related/route.ts`
  - **Done when**: Helper created, 5 public GET routes return Cache-Control headers
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(perf): add Cache-Control headers to public API routes`
  - _Requirements: FR-20, AC-10.1_
  - _Design: WS-4 Cache-Control Headers_

- [ ] 3.8 Add ISR revalidate exports to server-rendered pages
  - **Do**:
    1. Add `export const revalidate = 300` to `src/app/(public)/categories/[slug]/page.tsx`
    2. Add `export const revalidate = 300` to `src/app/(public)/resources/[id]/page.tsx`
    3. Add `export const revalidate = 600` to `src/app/(public)/categories/page.tsx`
    4. Add `export const revalidate = 600` to `src/app/(public)/journeys/page.tsx`
    5. Add `export const revalidate = 600` to `src/app/page.tsx`
    6. Place export near top of file, after imports and before component
  - **Files**: `src/app/(public)/categories/[slug]/page.tsx`, `src/app/(public)/resources/[id]/page.tsx`, `src/app/(public)/categories/page.tsx`, `src/app/(public)/journeys/page.tsx`, `src/app/page.tsx`
  - **Done when**: All 5 pages export `revalidate` constant
  - **Verify**: `grep -l "export const revalidate" src/app/page.tsx "src/app/(public)/categories/page.tsx" "src/app/(public)/categories/[slug]/page.tsx" "src/app/(public)/resources/[id]/page.tsx" "src/app/(public)/journeys/page.tsx" | wc -l | xargs test 5 -eq`
  - **Commit**: `feat(perf): add ISR revalidation to public pages`
  - _Requirements: FR-21, FR-22, AC-10.2, AC-10.3_
  - _Design: WS-4 ISR Configuration_

- [ ] 3.9 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Full quality check after Phase 3 changes
  - **Verify**: `npx eslint src/ 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -5 && npm run build 2>&1 | tail -10`
  - **Done when**: 0 lint issues, 0 type errors, build succeeds
  - **Commit**: `chore(quality): pass Phase 3 quality checkpoint` (only if fixes needed)

## Phase 4: Production Readiness (Security + Metadata + Accessibility + Related UI)

- [ ] 4.1 Security review: verify auth middleware coverage on all protected routes
  - **Do**:
    1. Grep all route.ts files for `withAuth`, `withAdmin`, `withApiKey`
    2. List any POST/PUT/PATCH/DELETE handlers that do NOT use auth middleware
    3. Verify all `/api/admin/**` routes use `withAdmin`
    4. Verify all user-specific routes (`/api/favorites`, `/api/bookmarks`, etc.) use `withAuth`
    5. Verify public GET routes (`/api/resources`, `/api/categories`) correctly omit auth
    6. If any gaps found, add appropriate middleware wrapper
  - **Files**: All `src/app/api/**/route.ts` files (review only, modify if gaps found)
  - **Done when**: All protected routes verified to use correct auth middleware
  - **Verify**: `grep -rL "withAuth\|withAdmin\|withApiKey" src/app/api/admin/ --include="route.ts" | head -5` (should return empty)
  - **Commit**: `fix(security): ensure auth middleware on all protected routes` (only if fixes needed)
  - _Requirements: FR-30, NFR-9_
  - _Design: WS-6 Security Review_

- [ ] 4.2 Security review: verify no hardcoded secrets
  - **Do**:
    1. Run grep for common secret patterns: `sk-`, `password.*=.*["']`, API key literals
    2. Verify all sensitive values use `process.env`
    3. Verify `.env` is in `.gitignore`
  - **Files**: All `src/**` files (review only)
  - **Done when**: Zero hardcoded secrets found
  - **Verify**: `grep -rn "sk-[a-zA-Z]" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -5` (should return empty)
  - **Commit**: `fix(security): remove hardcoded secrets` (only if issues found)
  - _Requirements: FR-31_
  - _Design: WS-6 Security Review_

- [ ] 4.3 Verify Zod validation on all mutation endpoints
  - **Do**:
    1. Grep all POST/PUT/PATCH/DELETE route handlers
    2. Verify each uses Zod schema validation (either inline `safeParse` or `withValidation` middleware)
    3. Document any endpoints missing validation
    4. Add Zod validation to any missing endpoints
  - **Files**: All `src/app/api/**/route.ts` (review, modify if gaps)
  - **Done when**: All mutation endpoints validated with Zod
  - **Verify**: `grep -rL "safeParse\|withValidation" src/app/api/ --include="route.ts" | xargs grep -l "POST\|PUT\|PATCH\|DELETE" | head -10`
  - **Commit**: `fix(validation): add Zod validation to mutation endpoints` (only if fixes needed)
  - _Requirements: FR-32, NFR-8_
  - _Design: WS-6 Zod Validation Audit_

- [ ] 4.4 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run lint and typecheck after security/validation changes
  - **Verify**: `npx eslint src/ 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -5`
  - **Done when**: 0 lint issues, 0 type errors
  - **Commit**: `chore(quality): pass Phase 4a quality checkpoint` (only if fixes needed)

- [ ] 4.5 Add metadata to protected pages via layout files
  - **Do**:
    1. Create `src/app/(protected)/favorites/layout.tsx` -- export `metadata: { title: "Favorites | Awesome Video Dashboard", description: "Your favorited resources." }`, render `children`
    2. Create `src/app/(protected)/bookmarks/layout.tsx` -- export `metadata: { title: "Bookmarks | Awesome Video Dashboard", description: "Your bookmarked resources." }`, render `children`
    3. Create `src/app/(protected)/history/layout.tsx` -- export `metadata: { title: "History | Awesome Video Dashboard", description: "Your recently viewed resources." }`, render `children`
    4. Create `src/app/(protected)/profile/layout.tsx` -- export `metadata: { title: "Profile | Awesome Video Dashboard", description: "Manage your profile and preferences." }`, render `children`
    5. Add `export const metadata` directly to `src/app/(protected)/submit/page.tsx` (this page is NOT `"use client"`, so it can export metadata directly): `{ title: "Submit Resource | Awesome Video Dashboard", description: "Share a resource with the community." }`
    6. Create `src/app/(public)/resources/[id]/suggest-edit/layout.tsx` -- export `metadata: { title: "Suggest Edit | Awesome Video Dashboard", description: "Suggest improvements to this resource." }`, render `children`
    7. Follow existing `src/app/(public)/journeys/[id]/layout.tsx` pattern
  - **Files**: `src/app/(protected)/favorites/layout.tsx`, `src/app/(protected)/bookmarks/layout.tsx`, `src/app/(protected)/history/layout.tsx`, `src/app/(protected)/profile/layout.tsx`, `src/app/(protected)/submit/page.tsx`, `src/app/(public)/resources/[id]/suggest-edit/layout.tsx`
  - **Done when**: All 6 pages have metadata via layout or direct export
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(seo): add generateMetadata to 6 pages missing it`
  - _Requirements: FR-35, NFR-6_
  - _Design: WS-6 Metadata Verification_

- [ ] 4.6 Wire related resources service into resource detail page
  - **Do**:
    1. Open `src/app/(public)/resources/[id]/page.tsx`
    2. Replace inline `prisma.resource.findMany` query (lines 67-82) with call to `getRelatedResources(resourceId)` from `@/features/resources/related-resources`
    3. Remove direct `prisma` import if no longer needed
    4. Map service response to match existing template variables (the related resources card at lines 258-288)
    5. Keep the existing related resources UI card structure
  - **Files**: `src/app/(public)/resources/[id]/page.tsx`
  - **Done when**: Resource detail page uses service instead of inline query
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `refactor(resources): wire related resources service into detail page`
  - _Requirements: FR-34, AC-4.5_
  - _Design: WS-6 Related Resources UI_

- [ ] 4.7 Add keyboard accessibility to custom interactive elements
  - **Do**:
    1. Review resource cards in `src/components/resources/resource-card.tsx` -- ensure links have visible focus styles
    2. Review admin tab navigation in `src/app/admin/page.tsx` -- ensure tabs are keyboard-navigable
    3. Add `tabIndex={0}` and `role` attributes to any custom interactive elements that need them
    4. Verify focus-visible ring is styled (confirmed in globals.css as `outline-ring/50`)
    5. This is mostly verification -- shadcn/Radix components handle a11y natively
  - **Files**: Review `src/components/resources/resource-card.tsx`, `src/app/admin/page.tsx` (modify only if gaps found)
  - **Done when**: All interactive elements are keyboard-operable
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `fix(a11y): ensure keyboard navigation on interactive elements` (only if fixes needed)
  - _Requirements: FR-33, NFR-5_
  - _Design: WS-6 Keyboard Navigation_

- [ ] 4.8 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run lint and typecheck after Phase 4 changes
  - **Verify**: `npx eslint src/ 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -5`
  - **Done when**: 0 lint issues, 0 type errors
  - **Commit**: `chore(quality): pass Phase 4b quality checkpoint` (only if fixes needed)

## Phase 5: Medium/Low Features (About + Search + Legacy Stubs)

- [ ] 5.1 Create About page
  - **Do**:
    1. Create `src/app/(public)/about/page.tsx` as server component
    2. Export `metadata: Metadata` with title, description, openGraph
    3. Render static content: project description, how it works, feature highlights, contributing section
    4. Include GitHub repo link, link to `/resources`, link to `/categories`
    5. Use `Container`, `Card`, `Button` from existing components
    6. Match site theme via CSS custom properties
  - **Files**: `src/app/(public)/about/page.tsx`
  - **Done when**: `/about` renders with content and proper metadata
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(pages): add about page with project info and metadata`
  - _Requirements: FR-16, AC-8.1 through AC-8.4_
  - _Design: WS-3 About Page_

- [ ] 5.2 Create Advanced Search page with layout for metadata
  - **Do**:
    1. Create `src/app/(public)/search/layout.tsx` with static metadata: `{ title: "Search | Awesome Video Dashboard", description: "Search and filter resources by category, tags, and more." }`
    2. Create `src/app/(public)/search/page.tsx` as `"use client"` component
    3. Reuse existing components: `ResourceFilters`, `ResourceSort`, `ResourceGrid`, `PaginationControls` from `@/components/resources/` and `@/components/shared/`
    4. Use `useSearchParams` for URL-driven state (shareable/bookmarkable)
    5. Reuse `useResources` and `useCategories` hooks
    6. Support filters: category, subcategory, tags, sort order
    7. Create `src/app/(public)/search/loading.tsx` with skeleton matching search layout
  - **Files**: `src/app/(public)/search/layout.tsx`, `src/app/(public)/search/page.tsx`, `src/app/(public)/search/loading.tsx`
  - **Done when**: `/search` page renders with multi-filter UI and URL-driven state
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(pages): add advanced search page with multi-filter UI`
  - _Requirements: FR-17, AC-12.1 through AC-12.4_
  - _Design: WS-3 Advanced Search Page_

- [ ] 5.3 Create legacy compatibility endpoint stubs
  - **Do**:
    1. Create `src/app/api/awesome-list/route.ts` -- GET returns 501 JSON: `{ success: false, error: "This endpoint has been deprecated...", code: "DEPRECATED", migration: { newEndpoint: "/api/resources", docs: "/about" } }`
    2. Create `src/app/api/learning-paths/suggested/route.ts` -- GET returns 501 JSON: `{ success: false, error: "...", code: "DEPRECATED", migration: { newEndpoint: "/api/journeys" } }`
    3. Create `src/app/api/learning-paths/generate/route.ts` -- POST returns 501 JSON with same pattern
    4. All stubs return `{ status: 501 }` with migration guidance
  - **Files**: `src/app/api/awesome-list/route.ts`, `src/app/api/learning-paths/suggested/route.ts`, `src/app/api/learning-paths/generate/route.ts`
  - **Done when**: All 3 endpoints return 501 with migration info
  - **Verify**: `npx tsc --noEmit 2>&1 | tail -5`
  - **Commit**: `feat(api): add legacy compatibility endpoint stubs (501)`
  - _Requirements: FR-13, FR-14, FR-15, AC-13.1, AC-13.2_
  - _Design: WS-2 Legacy Compat Endpoints_

- [ ] 5.4 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run lint and typecheck on all Phase 5 files
  - **Verify**: `npx eslint src/ 2>&1 | tail -3 && npx tsc --noEmit 2>&1 | tail -5`
  - **Done when**: 0 lint issues, 0 type errors
  - **Commit**: `chore(quality): pass Phase 5 quality checkpoint` (only if fixes needed)

## Phase 6: Final Validation & Quality Gates

- [ ] 6.1 [VERIFY] Full local CI: lint + typecheck + build
  - **Do**: Run complete local CI suite
  - **Verify**: `npx eslint src/ 2>&1 | tail -5 && npx tsc --noEmit 2>&1 | tail -5 && npm run build 2>&1 | tail -15`
  - **Done when**: All commands pass with exit code 0
  - **Commit**: `chore(quality): pass full local CI` (only if fixes needed)

- [ ] 6.2 [VERIFY] Functional validation: new error/loading/not-found pages
  - **Do**:
    1. Start dev server: `npm run dev` (background)
    2. Verify `/nonexistent` returns 404 page: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nonexistent` (expect 404)
    3. Verify about page exists: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/about` (expect 200)
    4. Verify search page exists: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/search` (expect 200)
    5. Verify new API endpoints respond:
       - `curl -s http://localhost:3000/api/awesome-list | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['code']=='DEPRECATED'; print('OK')"` (501 stub)
       - `curl -s http://localhost:3000/api/learning-paths/suggested | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['code']=='DEPRECATED'; print('OK')"`
    6. Verify cache headers: `curl -sI http://localhost:3000/api/resources 2>&1 | grep -i cache-control`
    7. Verify cache headers on categories: `curl -sI http://localhost:3000/api/categories 2>&1 | grep -i cache-control`
  - **Done when**: All curl commands return expected status codes and headers
  - **Verify**: All commands in Do section exit successfully
  - **Commit**: None (verification only)
  - _Requirements: NFR-10, Success Criteria 1-10_

- [ ] 6.3 Create PR and verify CI
  - **Do**:
    1. Verify current branch is feature branch: `git branch --show-current`
    2. If on default branch, STOP and alert user
    3. Stage all changes: `git add -A`
    4. Push branch: `git push -u origin $(git branch --show-current)`
    5. Create PR: `gh pr create --title "feat: v2 audit - error boundaries, endpoints, quality, production readiness" --body "...summary..."`
  - **Verify**: `gh pr checks --watch` (wait for CI, all green)
  - **Done when**: PR created, all CI checks passing
  - **If CI fails**: Read failures via `gh pr checks`, fix locally, push, re-verify

## Phase 7: PR Lifecycle

- [ ] 7.1 [VERIFY] CI pipeline passes
  - **Do**: Verify GitHub Actions/CI passes after push
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: CI pipeline passes
  - **Commit**: None

- [ ] 7.2 [VERIFY] AC checklist -- programmatic verification
  - **Do**: Verify each acceptance criteria is met:
    1. AC-1.x: `test -f src/app/error.tsx && test -f "src/app/(public)/error.tsx" && test -f src/app/admin/error.tsx && echo "Error boundaries: PASS"`
    2. AC-2.x: `test -f src/app/not-found.tsx && echo "Not-found: PASS"`
    3. AC-3.x: `ls "src/app/(public)/resources/loading.tsx" "src/app/(public)/categories/[slug]/loading.tsx" "src/app/(public)/resources/[id]/loading.tsx" src/app/admin/loading.tsx 2>/dev/null | wc -l | xargs test 4 -eq && echo "Loading: PASS"`
    4. AC-4.x: `test -f src/app/api/resources/[id]/related/route.ts && test -f src/features/resources/related-resources.ts && echo "Related: PASS"`
    5. AC-5-7: `test -f src/app/api/user/submissions/route.ts && test -f src/app/api/user/progress/route.ts && test -f src/app/api/recommendations/feedback/route.ts && echo "User endpoints: PASS"`
    6. AC-8.x: `test -f "src/app/(public)/about/page.tsx" && echo "About: PASS"`
    7. AC-9.x: `test -f prisma/seed.ts && echo "Seed: PASS"`
    8. AC-10.x: `test -f src/lib/api-cache.ts && echo "Cache: PASS"`
    9. AC-11.x: `npx eslint src/ 2>&1 | tail -1` (expect "0 problems")
    10. AC-12.x: `test -f "src/app/(public)/search/page.tsx" && echo "Search: PASS"`
    11. AC-13.x: `test -f src/app/api/awesome-list/route.ts && test -f src/app/api/learning-paths/suggested/route.ts && test -f src/app/api/learning-paths/generate/route.ts && echo "Legacy stubs: PASS"`
    12. NFR-3: `npx tsc --noEmit 2>&1 | tail -1` (expect "0 errors")
    13. NFR-10: `npm run build 2>&1 | tail -1` (expect exit 0)
  - **Verify**: All AC checks pass
  - **Done when**: All acceptance criteria confirmed met
  - **Commit**: None

---

## Notes

- **Correction from design.md**: `journeys/[id]/layout.tsx` already exists with metadata -- only 6 pages need metadata (not 7)
- **ESLint underscore-prefix issue**: Many `_ctx`, `_req` params are already underscore-prefixed but still warn. The ESLint config likely needs `argsIgnorePattern: "^_"` added to `@typescript-eslint/no-unused-vars` rule in `eslint.config.mjs`
- **data-table.tsx incompatible-library warning**: The `react-hooks/incompatible-library` warning on `useReactTable` is a known React Compiler issue with TanStack Table. Suppress with eslint-disable comment.
- **Submit page is server component**: `src/app/(protected)/submit/page.tsx` does NOT have `"use client"` so can export metadata directly (no layout needed)
- **Protected pages need layout.tsx for metadata**: favorites, bookmarks, history, profile are all `"use client"` so cannot export metadata -- need layout files
- **ISR on client pages**: Resources browse page (`/resources`) is `"use client"` so cannot use ISR `revalidate` export. ISR applies only to the 5 server-rendered pages identified.
- **Cache headers**: Applied only to public GET routes, not to authenticated or mutation endpoints
- **Seed script**: Uses `npx tsx` as runner since project has TypeScript. `prisma.seed` in `package.json` points to `npx tsx prisma/seed.ts`
- **No prisma.config.ts found**: Prisma 7 may use package.json config instead
