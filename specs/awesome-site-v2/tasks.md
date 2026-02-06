---
spec: awesome-site-v2
phase: tasks
total_tasks: 98
created: 2026-02-06T15:22:00Z
---

# Tasks: Awesome List Curator V2

## Execution Context

| Key | Value |
|-----|-------|
| Testing depth | Functional validation only (NO mocks, NO unit tests) |
| Deployment | Standard Vercel deploy with Neon PostgreSQL |
| Execution priority | Quality first (thorough, slower, polished) |
| Architecture | Feature-based modules under `src/features/` |
| API pattern | Shared middleware chain (`withAuth`, `withAdmin`, `withValidation`) |
| Admin | Client-side SPA under `/admin` with lazy-loaded tabs |
| Database | Fresh `awesome_list_v2` PostgreSQL via Neon |
| Quality commands | `npm run lint && npx tsc --noEmit && npm run build` |
| Existing scaffold | Next.js 16.1.6, 42 shadcn/ui components, Prisma 7.3 config, TanStack Query, Better Auth, cmdk, Fuse.js, Recharts, next-themes |

---

## Phase 1: Foundation (Make It Work)

Focus: Database schema, auth, theme system, layout, middleware chain. Validate core patterns work end-to-end.

- [x] 1.1 Write complete Prisma schema (31 models)
  - **Do**:
    1. Write full Prisma schema at `prisma/schema.prisma` with all 31 models
    2. Better Auth tables: `User` (extended with role, banned, banReason, banExpires), `Session`, `Account`, `Verification`
    3. Content tables: `Resource`, `Category`, `Subcategory`, `SubSubcategory`, `Tag`, `ResourceTag`
    4. User interaction tables: `UserFavorite`, `UserBookmark`, `UserPreference`, `UserInteraction`, `ViewHistory`
    5. Edit tables: `ResourceEdit`, `ResourceAuditLog`
    6. Journey tables: `LearningJourney`, `JourneyStep`, `UserJourneyProgress`, `StepCompletion`
    7. AI tables: `EnrichmentJob`, `EnrichmentQueueItem`, `AiResponseCache`, `AiUsageDaily`
    8. Research tables: `ResearchJob`, `ResearchFinding`
    9. GitHub tables: `AwesomeList`, `GithubSyncQueue`, `GithubSyncHistory`, `GithubResourceMapping`
    10. API tables: `ApiKey`, `ApiRateLimit`, `ApiUsageLog`
    11. Config table: `SiteSetting`
    12. Use proper FK relations (resource.categoryId Int, not TEXT matching)
    13. Add `@@unique`, `@@index` constraints per design.md
    14. Keep existing generator + datasource config
  - **Files**: `prisma/schema.prisma`
  - **Done when**: Schema has 31 models with all relations, enums, indexes defined
  - **Verify**: `npx prisma validate`
  - **Commit**: `feat(db): add complete Prisma schema with 31 models`
  - _Requirements: FR-1_
  - _Design: Database Schema section_

- [x] 1.2 Push schema to Neon database
  - **Do**:
    1. Run `npx prisma db push` to create all tables in Neon PostgreSQL
    2. Run `npx prisma generate` to generate Prisma client at `src/generated/prisma`
    3. Verify `.gitignore` includes `src/generated/`
  - **Files**: `prisma/schema.prisma` (no changes), `.gitignore`
  - **Done when**: All 31 tables exist in database, Prisma client generated
  - **Verify**: `npx prisma db push --accept-data-loss && npx prisma generate`
  - **Commit**: `feat(db): push schema to Neon and generate Prisma client`
  - _Requirements: FR-1_
  - _Design: Database Schema_

- [x] 1.3 Create Prisma client singleton and shared API utilities
  - **Do**:
    1. Create `src/lib/prisma.ts` -- Prisma client singleton with global caching for dev hot-reload
    2. Create `src/lib/api-response.ts` -- `apiSuccess()`, `apiError()`, `apiPaginated()` helpers returning `Response` objects with `ApiResponse<T>` shape
    3. Create `src/lib/api-error.ts` -- `AppError` class + `Errors` constant object with UNAUTHORIZED, FORBIDDEN, NOT_FOUND, DUPLICATE, VALIDATION, RATE_LIMITED
    4. Create `src/lib/constants.ts` -- domain allowlist array (78+ domains from legacy), rate limit configs, pagination defaults
  - **Files**: `src/lib/prisma.ts`, `src/lib/api-response.ts`, `src/lib/api-error.ts`, `src/lib/constants.ts`
  - **Done when**: All 4 files export correctly typed utilities
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(lib): add Prisma singleton, API response helpers, error handling, constants`
  - _Requirements: NFR-24_
  - _Design: Shared Infrastructure section_

- [x] 1.4 Configure Better Auth server and client
  - **Do**:
    1. Create `src/lib/auth.ts` -- Better Auth server config with Prisma adapter, email/password enabled, GitHub + Google social providers from env vars, session config (7-day expiry)
    2. Create `src/lib/auth-client.ts` -- Better Auth client for browser-side hooks
    3. Create `src/app/api/auth/[...all]/route.ts` -- catch-all route handler delegating to Better Auth
    4. Add env vars to `.env.local` template comments: `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`
  - **Files**: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`
  - **Done when**: Auth server initializes without errors, catch-all route responds
  - **Verify**: `npx tsc --noEmit && npm run build`
  - **Commit**: `feat(auth): configure Better Auth with Prisma adapter and OAuth providers`
  - _Requirements: FR-2, US-10, US-11_
  - _Design: Module: Auth_

- [x] 1.5 Create auth middleware chain (withAuth, withAdmin, withValidation)
  - **Do**:
    1. Create `src/features/auth/auth-middleware.ts` with:
       - `withAuth(handler)` -- validates session cookie via Better Auth, attaches user to context, returns 401 if missing
       - `withAdmin(handler)` -- wraps withAuth, checks `user.role === "admin"`, returns 403 if not admin
       - `withValidation(schema, handler)` -- parses request body with Zod schema, attaches `validated` to context, returns 422 on failure with field-level errors
       - `withApiKey(handler)` -- validates `x-api-key` header via SHA-256 hash lookup
    2. Create `src/features/auth/auth-types.ts` -- `AuthUser`, `RouteContext`, `AuthenticatedRouteContext` types
  - **Files**: `src/features/auth/auth-middleware.ts`, `src/features/auth/auth-types.ts`
  - **Done when**: All 4 middleware wrappers export and compose correctly
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(auth): add withAuth, withAdmin, withValidation, withApiKey middleware`
  - _Requirements: FR-2, US-12, NFR-11_
  - _Design: API Middleware Chain_

- [x] 1.6 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run quality commands, fix any issues
  - **Verify**: `npm run lint && npx tsc --noEmit`
  - **Done when**: Zero lint errors, zero type errors
  - **Commit**: `chore(foundation): pass quality checkpoint` (only if fixes needed)

- [x] 1.7 Set up 4-theme OKLCH system with flash prevention
  - **Do**:
    1. Replace `src/app/globals.css` with 4-theme system:
       - `:root` / `[data-theme="cyberpunk"]` -- pure black bg (#000), hot pink primary (oklch 0.75 0.3225 328.36), cyan accent (oklch 0.7072 0.1679 242.04), JetBrains Mono, 0px radius, no shadows
       - `[data-theme="modern-light"]` -- white bg, blue primary, Inter font, 0.5rem radius
       - `[data-theme="modern-dark"]` -- deep gray bg, lighter blue primary, Inter font, 0.5rem radius
       - `[data-theme="high-contrast"]` -- white bg, dark blue primary, black borders, 0.25rem radius, WCAG AAA
    2. Update `@theme inline` block for font-family CSS vars (`--font-heading`, `--font-body`)
    3. Create `src/components/theme/theme-provider.tsx` -- wraps `next-themes` ThemeProvider with `attribute="data-theme"` and `defaultTheme="cyberpunk"`
    4. Create `src/components/theme/theme-script.tsx` -- inline `<script>` for `<head>` that reads localStorage and sets `data-theme` before first paint
    5. Create `src/components/theme/theme-switcher.tsx` -- dropdown with color dot + label for each theme
  - **Files**: `src/app/globals.css`, `src/components/theme/theme-provider.tsx`, `src/components/theme/theme-script.tsx`, `src/components/theme/theme-switcher.tsx`
  - **Done when**: All 4 themes defined in CSS, provider wraps app, no flash on dark theme load
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(theme): add 4-theme OKLCH system with flash prevention`
  - _Requirements: FR-72 through FR-77, US-45_
  - _Design: Theme mechanism_

- [x] 1.8 Update root layout with providers, fonts, and metadata
  - **Do**:
    1. Update `src/app/layout.tsx`:
       - Replace Geist fonts with JetBrains Mono (next/font/google) + Inter (next/font/google)
       - Add `suppressHydrationWarning` on `<html>`
       - Add ThemeScript in `<head>`
       - Wrap children with ThemeProvider
       - Add default metadata (title, description, OG)
    2. Create `src/providers/query-provider.tsx` -- TanStack QueryClientProvider with defaultOptions (stale times per design)
    3. Create `src/providers/auth-provider.tsx` -- session context from Better Auth client
    4. Wrap layout children: QueryProvider > AuthProvider > ThemeProvider > children
  - **Files**: `src/app/layout.tsx`, `src/providers/query-provider.tsx`, `src/providers/auth-provider.tsx`
  - **Done when**: Root layout renders with all providers, correct fonts, theme attribute on html
  - **Verify**: `npm run build`
  - **Commit**: `feat(layout): add providers, JetBrains Mono + Inter fonts, metadata`
  - _Requirements: FR-3, FR-78_
  - _Design: Root Layout Tree_

- [x] 1.9 Build layout shell (TopBar, Footer, Container)
  - **Do**:
    1. Create `src/components/layout/container.tsx` -- 1400px max-width centered wrapper with responsive padding
    2. Create `src/components/layout/top-bar.tsx` -- 64px fixed header with logo text, nav links (Home, Resources, Categories, Journeys), search trigger button (Cmd+K hint), theme switcher, user menu placeholder, mobile hamburger
    3. Create `src/components/layout/footer.tsx` -- about text, GitHub link, API docs link, copyright
    4. Create `src/components/layout/mobile-nav.tsx` -- Sheet-based hamburger menu for mobile
    5. Update `src/app/layout.tsx` to include TopBar + Footer around children
  - **Files**: `src/components/layout/container.tsx`, `src/components/layout/top-bar.tsx`, `src/components/layout/footer.tsx`, `src/components/layout/mobile-nav.tsx`, `src/app/layout.tsx`
  - **Done when**: App shows header with nav + footer on all pages, responsive
  - **Verify**: `npm run build`
  - **Commit**: `feat(layout): add TopBar, Footer, Container, MobileNav`
  - _Requirements: FR-78, FR-79, FR-81, NFR-23_
  - _Design: Component Architecture > Root Layout Tree_

- [x] 1.10 Set up Next.js middleware for auth redirects
  - **Do**:
    1. Create `src/middleware.ts`:
       - Protected routes (`/profile`, `/favorites`, `/bookmarks`, `/history`, `/submit`) redirect to `/login` if no session
       - Admin routes (`/admin`) redirect to `/` if no session or non-admin
       - Auth routes (`/login`, `/register`) redirect to `/` if already authenticated
       - Public routes pass through
    2. Configure `matcher` to exclude `_next`, static files, API routes
  - **Files**: `src/middleware.ts`
  - **Done when**: Middleware correctly redirects based on auth state and route
  - **Verify**: `npm run build`
  - **Commit**: `feat(auth): add Next.js middleware for route protection`
  - _Requirements: US-12, AC-12.4_
  - _Design: Middleware_

- [x] 1.11 [VERIFY] Quality checkpoint + build verification
  - **Do**: Run full local CI suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass with zero errors
  - **Commit**: `chore(foundation): pass Phase 1 quality checkpoint` (only if fixes needed)

- [x] 1.12 POC Checkpoint: Verify foundation works end-to-end
  - **Do**:
    1. Start dev server: `npm run dev`
    2. cURL the home page to verify it renders with layout
    3. cURL `/api/auth/ok` or health endpoint to verify Better Auth responds
    4. Verify Prisma can connect: create a simple test API route that queries the database
    5. Verify theme CSS variables are present in page source
  - **Done when**: Dev server starts, pages render with TopBar/Footer, auth endpoint responds, DB connects
  - **Verify**: `npm run build && curl -s http://localhost:3000 | head -50`
  - **Commit**: `feat(foundation): complete Phase 1 POC`
  - _Requirements: FR-1, FR-2, FR-3, FR-72_

---

## Phase 2: Core Data Layer

Focus: Resource and category services, API routes, public pages (home, categories, resources, search).

- [x] 2.1 Create resource feature module (service, schemas, types)
  - **Do**:
    1. Create `src/features/resources/resource-types.ts` -- `Resource`, `ResourceWithRelations`, `ResourceFilters`, `PaginatedResponse<T>`, `ResourceStatus` enum
    2. Create `src/features/resources/resource-schemas.ts` -- Zod schemas: `createResourceSchema` (title 1-200, url valid, description max 2000), `updateResourceSchema`, `resourceFiltersSchema`
    3. Create `src/features/resources/resource-queries.ts` -- Prisma query builders: `buildResourceWhere()` (category, tags, status, search filters), `buildResourceOrderBy()`, `buildResourceInclude()`
    4. Create `src/features/resources/resource-service.ts` -- `listResources()`, `getResource()`, `createResource()`, `updateResource()`, `deleteResource()`, `checkUrlExists()`, `approveResource()`, `rejectResource()`
  - **Files**: `src/features/resources/resource-types.ts`, `src/features/resources/resource-schemas.ts`, `src/features/resources/resource-queries.ts`, `src/features/resources/resource-service.ts`
  - **Done when**: All CRUD operations typed and implemented with Prisma
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(resources): add resource feature module with service, schemas, types`
  - _Requirements: FR-5 through FR-14_
  - _Design: Module: Resources_

- [x] 2.2 Create category feature module (service, schemas, types)
  - **Do**:
    1. Create `src/features/categories/category-types.ts` -- `Category`, `CategoryWithChildren`, `SubcategoryWithChildren`, `CategoryTree`
    2. Create `src/features/categories/category-schemas.ts` -- Zod: create/update for each level (name, slug auto-gen, description, icon, displayOrder, parentId)
    3. Create `src/features/categories/category-queries.ts` -- Tree building queries with resource counts per level
    4. Create `src/features/categories/category-service.ts` -- `getCategoryTree()`, CRUD for categories/subcategories/sub-subcategories, delete protection (check resource count), display order management
  - **Files**: `src/features/categories/category-types.ts`, `src/features/categories/category-schemas.ts`, `src/features/categories/category-queries.ts`, `src/features/categories/category-service.ts`
  - **Done when**: Full hierarchy CRUD with tree building and delete protection
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(categories): add category feature module with 3-level hierarchy`
  - _Requirements: FR-15 through FR-19_
  - _Design: Module: Categories_

- [x] 2.3 Implement resource API routes (CRUD + filters + pagination)
  - **Do**:
    1. Create `src/app/api/resources/route.ts` -- GET (paginated list with filters), POST (authenticated submission, status: pending)
    2. Create `src/app/api/resources/check-url/route.ts` -- GET (URL uniqueness check)
    3. Create `src/app/api/resources/[id]/route.ts` -- GET (detail with tags/category), PUT (admin update), DELETE (admin soft delete)
    4. Create `src/app/api/resources/[id]/approve/route.ts` -- PUT (admin approve)
    5. Create `src/app/api/resources/[id]/reject/route.ts` -- PUT (admin reject with reason)
    6. Use middleware chain: withAuth for POST, withAdmin for PUT/DELETE/approve/reject, withValidation on all mutations
  - **Files**: `src/app/api/resources/route.ts`, `src/app/api/resources/check-url/route.ts`, `src/app/api/resources/[id]/route.ts`, `src/app/api/resources/[id]/approve/route.ts`, `src/app/api/resources/[id]/reject/route.ts`
  - **Done when**: All resource endpoints respond correctly with proper auth/validation
  - **Verify**: `npx tsc --noEmit && npm run build`
  - **Commit**: `feat(api): add resource API routes with CRUD, filters, pagination`
  - _Requirements: FR-5 through FR-14, NFR-11_
  - _Design: File Structure > api/resources_

- [x] 2.4 Implement category API routes (hierarchy + admin CRUD)
  - **Do**:
    1. Create `src/app/api/categories/route.ts` -- GET (hierarchical tree with counts)
    2. Create `src/app/api/categories/[id]/route.ts` -- PUT, DELETE (admin)
    3. Create `src/app/api/subcategories/route.ts` -- GET, POST (admin)
    4. Create `src/app/api/subcategories/[id]/route.ts` -- PUT, DELETE (admin)
    5. Create `src/app/api/sub-subcategories/route.ts` -- GET, POST (admin)
    6. Create `src/app/api/sub-subcategories/[id]/route.ts` -- PUT, DELETE (admin)
    7. Admin CRUD routes also at `/api/admin/categories/`, `/api/admin/subcategories/`, `/api/admin/sub-subcategories/` with POST for create
  - **Files**: `src/app/api/categories/route.ts`, `src/app/api/categories/[id]/route.ts`, `src/app/api/subcategories/route.ts`, `src/app/api/subcategories/[id]/route.ts`, `src/app/api/sub-subcategories/route.ts`, `src/app/api/sub-subcategories/[id]/route.ts`, plus admin counterparts
  - **Done when**: Category hierarchy readable, all 3 levels have admin CRUD with delete protection
  - **Verify**: `npx tsc --noEmit && npm run build`
  - **Commit**: `feat(api): add category hierarchy API routes with admin CRUD`
  - _Requirements: FR-15 through FR-19_
  - _Design: File Structure > api/categories_

- [x] 2.5 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Run quality commands, fix any issues
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all commands
  - **Commit**: `chore(core): pass quality checkpoint` (only if fixes needed)

- [x] 2.6 Build shared resource UI components
  - **Do**:
    1. Create `src/components/resources/resource-card.tsx` -- Grid card: title, URL, description (2-line clamp), tags (max 3), category badge, favorite count, favorite/bookmark buttons
    2. Create `src/components/resources/resource-list-item.tsx` -- Horizontal card for list view
    3. Create `src/components/resources/resource-compact-item.tsx` -- Single line: title, category, link icon
    4. Create `src/components/resources/resource-grid.tsx` -- Wrapper switching between grid/list/compact based on viewMode prop
    5. Create `src/components/resources/view-mode-toggle.tsx` -- ToggleGroup with Grid/List/Compact icons
    6. Create `src/components/resources/resource-filters.tsx` -- Category dropdown, tag multi-select, status, search input with 500ms debounce
    7. Create `src/components/resources/resource-sort.tsx` -- Sort dropdown (name, date, popularity)
    8. Create `src/components/shared/pagination-controls.tsx` -- Page size selector (20/50/100) + prev/next navigation
    9. Create `src/components/shared/empty-state.tsx` -- No results placeholder
    10. Create `src/components/shared/loading-skeleton.tsx` -- Reusable skeleton loader
  - **Files**: All listed above
  - **Done when**: All components render without errors, accept proper props
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(ui): add resource cards, grid, filters, pagination components`
  - _Requirements: US-1, US-42, AC-1.1 through AC-1.6, AC-42.1 through AC-42.5_
  - _Design: Component Architecture_

- [x] 2.7 Build home page with category grid
  - **Do**:
    1. Replace `src/app/page.tsx` with home page:
       - Hero section: site title, description, search CTA
       - Category grid: fetch categories server-side, display as cards with icons, resource counts, slug links
       - "Browse All Resources" link
    2. Create `src/components/categories/category-card.tsx` -- Card with icon, name, resource count, link to `/categories/[slug]`
    3. Add `generateMetadata()` for SEO
  - **Files**: `src/app/page.tsx`, `src/components/categories/category-card.tsx`
  - **Done when**: Home page shows category grid from database, links work
  - **Verify**: `npm run build`
  - **Commit**: `feat(pages): build home page with category grid and hero`
  - _Requirements: US-5, AC-5.1, FR-78_
  - _Design: Home page_

- [x] 2.8 Build category pages (3-level navigation with breadcrumbs)
  - **Do**:
    1. Create `src/app/(public)/categories/page.tsx` -- All categories grid (server component)
    2. Create `src/app/(public)/categories/[slug]/page.tsx` -- Category detail showing subcategories + resources
    3. Create `src/app/(public)/categories/[slug]/[subSlug]/page.tsx` -- Subcategory showing sub-subcategories + resources
    4. Create `src/app/(public)/categories/[slug]/[subSlug]/[subSubSlug]/page.tsx` -- Deepest level + resources
    5. Create `src/components/categories/category-breadcrumb.tsx` -- 3-level breadcrumb using shadcn Breadcrumb
    6. Each page: `generateMetadata()`, server-side data fetch, breadcrumb, resource grid
  - **Files**: All 4 page files + `src/components/categories/category-breadcrumb.tsx`
  - **Done when**: Full 3-level navigation works with breadcrumbs, resource counts display
  - **Verify**: `npm run build`
  - **Commit**: `feat(pages): build 3-level category navigation with breadcrumbs`
  - _Requirements: US-5, AC-5.1 through AC-5.6_
  - _Design: File Structure > (public)/categories_

- [x] 2.9 Build resource browse and detail pages
  - **Do**:
    1. Create `src/app/(public)/resources/page.tsx` -- Browse all resources: client component wrapping resource-grid + filters + pagination, URL state via query params
    2. Create `src/app/(public)/resources/[id]/page.tsx` -- Resource detail: server component, full description, category breadcrumb, all tags, AI metadata (if enriched), related resources section (placeholder), favorite/bookmark buttons, "Suggest Edit" button
    3. Create `src/hooks/use-resources.ts` -- TanStack Query hooks: `useResources(filters)`, `useResource(id)` with proper stale times
    4. Create `src/hooks/use-categories.ts` -- TanStack Query hooks: `useCategories()`, `useCategory(slug)` with 30min stale
    5. Create `src/hooks/use-debounce.ts` -- Generic debounce hook (500ms default)
    6. Create `src/hooks/use-view-mode.ts` -- View mode persistence (localStorage + URL)
  - **Files**: `src/app/(public)/resources/page.tsx`, `src/app/(public)/resources/[id]/page.tsx`, `src/hooks/use-resources.ts`, `src/hooks/use-categories.ts`, `src/hooks/use-debounce.ts`, `src/hooks/use-view-mode.ts`
  - **Done when**: Browse page shows filterable resource grid, detail page shows full resource info
  - **Verify**: `npm run build`
  - **Commit**: `feat(pages): build resource browse and detail pages with hooks`
  - _Requirements: US-1, US-2, AC-1.1 through AC-2.6_
  - _Design: File Structure > (public)/resources_

- [x] 2.10 Implement Cmd+K search dialog
  - **Do**:
    1. Create `src/features/search/search-index.ts` -- Fuse.js index builder: fetches resources/categories/tags via API, builds combined index, caches 10min via TanStack Query
    2. Create `src/features/search/search-types.ts` -- `SearchResult` type with kind (resource/category/tag), label, href
    3. Create `src/components/search/search-dialog.tsx` -- cmdk Command dialog: Cmd+K opens, 500ms debounce, results grouped by type with icons, keyboard nav, direct navigation on select
    4. Create `src/components/search/search-trigger.tsx` -- Button in TopBar showing "Search... Cmd+K"
    5. Create `src/hooks/use-search.ts` -- Combines Fuse.js search with dialog state
    6. Update `src/components/layout/top-bar.tsx` to include SearchTrigger
  - **Files**: `src/features/search/search-index.ts`, `src/features/search/search-types.ts`, `src/components/search/search-dialog.tsx`, `src/components/search/search-trigger.tsx`, `src/hooks/use-search.ts`, `src/components/layout/top-bar.tsx`
  - **Done when**: Cmd+K opens search, typing returns fuzzy results, selecting navigates
  - **Verify**: `npm run build`
  - **Commit**: `feat(search): implement Cmd+K search dialog with Fuse.js`
  - _Requirements: US-41, AC-41.1 through AC-41.6, NFR-20_
  - _Design: Module: Search_

- [x] 2.11 [VERIFY] Quality checkpoint + build
  - **Do**: Run full quality suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All pass, zero errors
  - **Commit**: `chore(core-data): pass Phase 2 quality checkpoint` (only if fixes needed)

---

## Phase 3: User Features

Focus: Auth pages, favorites, bookmarks, submissions, profile, preferences.

- [x] 3.1 Build auth pages (login, register, forgot-password)
  - **Do**:
    1. Create `src/components/auth/login-form.tsx` -- Email/password fields + "Sign in with GitHub" + "Sign in with Google" buttons using Better Auth client, Zod validation, error display
    2. Create `src/components/auth/register-form.tsx` -- Name, email, password fields + OAuth buttons
    3. Create `src/components/auth/forgot-password-form.tsx` -- Email field, submit sends reset link
    4. Create `src/app/(auth)/login/page.tsx` -- Login page with LoginForm
    5. Create `src/app/(auth)/register/page.tsx` -- Register page with RegisterForm
    6. Create `src/app/(auth)/forgot-password/page.tsx` -- Forgot password page
    7. Create `src/hooks/use-auth.ts` -- Better Auth client hooks: `useSession()`, `signIn()`, `signUp()`, `signOut()`
  - **Files**: All 7 files listed
  - **Done when**: Login/register/forgot-password pages render with forms, OAuth buttons present
  - **Verify**: `npm run build`
  - **Commit**: `feat(auth): build login, register, forgot-password pages`
  - _Requirements: US-10, US-11, AC-10.1 through AC-11.5_
  - _Design: Module: Auth_

- [x] 3.2 Build user menu and auth state UI
  - **Do**:
    1. Create `src/components/auth/user-menu.tsx` -- Avatar dropdown: profile link, favorites, bookmarks, history, admin (if admin), logout
    2. Update `src/components/layout/top-bar.tsx` -- Show UserMenu when authenticated, Login/Register buttons when not
  - **Files**: `src/components/auth/user-menu.tsx`, `src/components/layout/top-bar.tsx`
  - **Done when**: TopBar shows correct UI based on auth state
  - **Verify**: `npm run build`
  - **Commit**: `feat(auth): add user menu and auth state to TopBar`
  - _Requirements: FR-78, AC-12.1 through AC-12.3_
  - _Design: Root Layout Tree_

- [x] 3.3 Implement favorites service and UI
  - **Do**:
    1. Create `src/features/user/favorite-service.ts` -- `toggleFavorite()`, `listFavorites()`, `isFavorited()`
    2. Create `src/app/api/favorites/route.ts` -- GET (list user favorites)
    3. Create `src/app/api/favorites/[resourceId]/route.ts` -- POST (add), DELETE (remove)
    4. Create `src/components/resources/favorite-button.tsx` -- Heart icon toggle with optimistic update
    5. Create `src/hooks/use-favorites.ts` -- TanStack Query + mutation with optimistic update
    6. Create `src/app/(protected)/favorites/page.tsx` -- Favorites list page with resource grid
  - **Files**: All 6 files
  - **Done when**: Heart icon toggles favorites, favorites page shows all favorited resources
  - **Verify**: `npm run build`
  - **Commit**: `feat(favorites): implement favorite toggle, API, and page`
  - _Requirements: FR-20, US-26, AC-26.1 through AC-26.4_
  - _Design: Module: User_

- [x] 3.4 Implement bookmarks service and UI (with notes)
  - **Do**:
    1. Create `src/features/user/bookmark-service.ts` -- `toggleBookmark()`, `updateBookmarkNotes()`, `listBookmarks()`
    2. Create `src/app/api/bookmarks/route.ts` -- GET (list bookmarks with notes)
    3. Create `src/app/api/bookmarks/[resourceId]/route.ts` -- POST (add), PUT (update notes), DELETE (remove)
    4. Create `src/components/resources/bookmark-button.tsx` -- Bookmark icon + notes dialog (using shadcn Dialog)
    5. Create `src/hooks/use-bookmarks.ts` -- TanStack Query + mutations
    6. Create `src/app/(protected)/bookmarks/page.tsx` -- Bookmarks page with search/filter within bookmarks
  - **Files**: All 6 files
  - **Done when**: Bookmark icon toggles, notes dialog works, bookmarks page shows all with notes
  - **Verify**: `npm run build`
  - **Commit**: `feat(bookmarks): implement bookmarks with notes, API, and page`
  - _Requirements: FR-21, US-27, AC-27.1 through AC-27.5_
  - _Design: Module: User_

- [x] 3.5 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(user): pass quality checkpoint` (only if fixes needed)

- [x] 3.6 Implement resource submission flow
  - **Do**:
    1. Create `src/features/resources/resource-schemas.ts` -- extend with `submitResourceSchema` (multi-step validation)
    2. Create `src/components/resources/submission-form.tsx` -- Multi-step form: Step 1 (URL + title), Step 2 (category cascade 3-level), Step 3 (tags + description), Step 4 (review + submit). URL uniqueness check on blur. "Analyze with AI" button (calls `/api/ai/analyze`).
    3. Create `src/app/(protected)/submit/page.tsx` -- Submit resource page wrapping SubmissionForm
    4. Ensure POST `/api/resources` handles submission with `status: "pending"`
  - **Files**: `src/features/resources/resource-schemas.ts`, `src/components/resources/submission-form.tsx`, `src/app/(protected)/submit/page.tsx`
  - **Done when**: Multi-step form submits resource to pending queue, URL check works
  - **Verify**: `npm run build`
  - **Commit**: `feat(submit): implement multi-step resource submission form`
  - _Requirements: US-3, AC-3.1 through AC-3.6, FR-8, FR-9_
  - _Design: Component Architecture_

- [x] 3.7 Implement edit suggestion flow
  - **Do**:
    1. Create `src/features/edits/edit-service.ts` -- `submitEdit()`, `getEdits()`, `approveEdit()`, `rejectEdit()`, `applyDiff()`
    2. Create `src/features/edits/edit-schemas.ts` -- Zod: edit suggestion (editType, proposedChanges, justification)
    3. Create `src/features/edits/edit-types.ts` -- `EditSuggestion`, `EditDiff`, `AiEditAnalysis`
    4. Create `src/app/api/resources/[id]/edits/route.ts` -- POST (submit edit)
    5. Create `src/components/resources/edit-suggestion-form.tsx` -- Dialog: current values + editable fields, edit type selector, justification text
  - **Files**: All 5 files
  - **Done when**: Users can submit edit suggestions, stored as JSON diff
  - **Verify**: `npm run build`
  - **Commit**: `feat(edits): implement edit suggestion submission and service`
  - _Requirements: FR-25, US-7, AC-7.1 through AC-7.5_
  - _Design: Module: Edits_

- [x] 3.8 Implement user preferences and profile page
  - **Do**:
    1. Create `src/features/user/preference-service.ts` -- `getPreferences()`, `updatePreferences()`
    2. Create `src/features/user/user-schemas.ts` -- Zod: preferences (skillLevel, preferredCategories, learningGoals, timeCommitment, theme, viewMode, emailNotifications)
    3. Create `src/app/api/preferences/route.ts` -- GET, PUT (authenticated)
    4. Create `src/app/(protected)/profile/page.tsx` -- Profile page: user info section, preferences form (skill level, categories multi-select, learning goals, time commitment, theme, view mode, email toggle), API key management section (placeholder for now)
  - **Files**: All 4 files
  - **Done when**: Profile page shows editable preferences, saves to database
  - **Verify**: `npm run build`
  - **Commit**: `feat(profile): implement user preferences and profile page`
  - _Requirements: FR-23, US-28, AC-28.1 through AC-28.7_
  - _Design: Module: User_

- [x] 3.9 Implement view history tracking
  - **Do**:
    1. Create `src/features/user/history-service.ts` -- `recordView()`, `getHistory()`
    2. Create `src/features/user/interaction-service.ts` -- `trackInteraction()` for view/click/bookmark/rate/complete events
    3. Create `src/app/api/history/route.ts` -- GET (view history), POST (record view)
    4. Create `src/app/api/interactions/route.ts` -- POST (track interaction event)
    5. Create `src/app/(protected)/history/page.tsx` -- View history page (recently viewed resources)
    6. Add view tracking call to resource detail page when user is authenticated
  - **Files**: All 6 files
  - **Done when**: Views recorded on resource detail page visits, history page shows recently viewed
  - **Verify**: `npm run build`
  - **Commit**: `feat(history): implement view history and interaction tracking`
  - _Requirements: FR-22, FR-24, US-30, US-31_
  - _Design: Module: User_

- [x] 3.10 [VERIFY] Quality checkpoint + build
  - **Do**: Run full quality suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All pass
  - **Commit**: `chore(user-features): pass Phase 3 quality checkpoint` (only if fixes needed)

---

## Phase 4: Admin Panel

Focus: 14 lazy-loaded admin tabs with DataTables, CRUD dialogs, approval workflows.

- [x] 4.1 Build admin layout with sidebar and lazy tab routing
  - **Do**:
    1. Create `src/app/admin/layout.tsx` -- `"use client"` layout with AdminSidebar + content area
    2. Create `src/app/admin/page.tsx` -- Tab router: URL hash or state drives active tab, lazy loads tab components via `React.lazy` + `Suspense`
    3. Create `src/components/admin/admin-sidebar.tsx` -- 14 nav items: Overview, Resources, Categories, Subcategories, Sub-subcategories, Users, Edit Suggestions, Enrichment, GitHub Sync, API Keys, Analytics, Tags, Learning Journeys, Settings
    4. Create `src/components/admin/admin-layout.tsx` -- Wrapper with sidebar + content area
    5. Create `src/hooks/use-admin.ts` -- TanStack Query hooks for admin data (1min stale time)
  - **Files**: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/admin-sidebar.tsx`, `src/components/admin/admin-layout.tsx`, `src/hooks/use-admin.ts`
  - **Done when**: Admin page loads with sidebar, tab switching works, lazy loading functions
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build admin layout with sidebar and 14 lazy-loaded tabs`
  - _Requirements: FR-60, NFR-18_
  - _Design: Admin Layout Tree_

- [x] 4.2 Build reusable DataTable component
  - **Do**:
    1. Install `@tanstack/react-table` (already in deps) and `@tanstack/react-virtual` (add if missing)
    2. Create `src/components/admin/data-table.tsx` -- Generic TanStack Table wrapper: sortable columns, row selection with checkboxes, server-side pagination, column visibility toggle, responsive
    3. Create `src/components/admin/stat-card.tsx` -- Dashboard stat card: icon, label, value, trend
    4. Create `src/components/shared/confirm-dialog.tsx` -- Delete confirmation using AlertDialog
    5. Create `src/components/shared/error-display.tsx` -- Error message card
  - **Files**: All 4 component files
  - **Done when**: DataTable renders with sorting, selection, pagination; StatCard renders metrics
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add reusable DataTable, StatCard, ConfirmDialog components`
  - _Requirements: NFR-22_
  - _Design: Admin Layout Tree_

- [x] 4.3 Build admin overview tab (stats + activity feed)
  - **Do**:
    1. Create `src/features/admin/stats-service.ts` -- `getDashboardStats()`: total resources, pending, total users, active users (30d), pending edits, enriched count
    2. Create `src/app/api/admin/stats/route.ts` -- GET (dashboard stats, withAdmin)
    3. Create `src/components/admin/tabs/overview-tab.tsx` -- 6 StatCards, quick action buttons (Start Enrichment, View Pending, Export), recent activity feed (last 20 from audit log), auto-refresh 1min
  - **Files**: `src/features/admin/stats-service.ts`, `src/app/api/admin/stats/route.ts`, `src/components/admin/tabs/overview-tab.tsx`
  - **Done when**: Overview tab shows real stats from database, activity feed populates
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build overview tab with stats, quick actions, activity feed`
  - _Requirements: US-32, AC-32.1 through AC-32.4, FR-57_
  - _Design: Admin Layout Tree > OverviewTab_

- [x] 4.4 Build admin resources tab (DataTable + CRUD + approval)
  - **Do**:
    1. Create `src/app/api/admin/resources/route.ts` -- GET (all resources, admin view), POST (create auto-approved)
    2. Create `src/app/api/admin/resources/pending/route.ts` -- GET (pending queue)
    3. Create `src/app/api/admin/resources/[id]/route.ts` -- PUT (update), DELETE (soft delete with audit)
    4. Create `src/components/admin/tabs/resources-tab.tsx` -- DataTable with columns: Name, URL, Category, Status, Tags, Enriched, Created, Actions. Filters: status, category, search, enriched toggle. Row selection for bulk ops. Pagination 20/50/100.
    5. Create `src/components/admin/dialogs/resource-dialog.tsx` -- Create/edit dialog with category cascade dropdowns, all fields
    6. Create `src/features/admin/audit-service.ts` -- `createAuditLog()` records create/update/delete/approve/reject
  - **Files**: All 6 files
  - **Done when**: Resource DataTable with full CRUD, approval workflow, audit logging works
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build resources tab with DataTable, CRUD, approval workflow`
  - _Requirements: US-34, AC-34.1 through AC-34.7, US-9, FR-10 through FR-14, US-40_
  - _Design: Admin Layout Tree > ResourcesTab_

- [x] 4.5 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(admin): pass quality checkpoint` (only if fixes needed)

- [ ] 4.6 Build admin category tabs (3 levels)
  - **Do**:
    1. Create `src/components/admin/tabs/categories-tab.tsx` -- DataTable: name, slug, description, icon, resource count, display order. CRUD via dialog.
    2. Create `src/components/admin/tabs/subcategories-tab.tsx` -- DataTable: name, slug, parent category, resource count, display order.
    3. Create `src/components/admin/tabs/sub-subcategories-tab.tsx` -- DataTable: name, slug, parent subcategory, resource count.
    4. Create `src/components/admin/dialogs/category-dialog.tsx` -- Create/edit dialog with cascading parent dropdowns, icon picker (for top level), slug auto-generation
    5. Create admin API routes: `src/app/api/admin/categories/route.ts` (POST), `src/app/api/admin/categories/[id]/route.ts` (PATCH, DELETE), and same for subcategories and sub-subcategories
  - **Files**: 3 tab components + 1 dialog + 6 API route files
  - **Done when**: All 3 category-level tabs show DataTables with full CRUD, delete protection works
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build category management tabs with 3-level CRUD`
  - _Requirements: US-6, AC-6.1 through AC-6.6, FR-16 through FR-19_
  - _Design: Admin Layout Tree > CategoriesTab_

- [ ] 4.7 Build admin users tab
  - **Do**:
    1. Create `src/features/admin/user-management-service.ts` -- `listUsers()`, `changeRole()`, `banUser()`, `unbanUser()`
    2. Create `src/app/api/admin/users/route.ts` -- GET (paginated user list)
    3. Create `src/app/api/admin/users/[id]/role/route.ts` -- PUT (change role)
    4. Create `src/app/api/admin/users/[id]/ban/route.ts` -- PUT (ban/unban with reason)
    5. Create `src/components/admin/tabs/users-tab.tsx` -- DataTable: username, email, role, created, last active. Search by username/email. Role dropdown. Ban/unban. Side sheet for profile details.
  - **Files**: All 5 files
  - **Done when**: User DataTable with search, role change, ban/unban works
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build user management tab`
  - _Requirements: US-33, AC-33.1 through AC-33.5, FR-58, FR-59_
  - _Design: Admin Layout Tree > UsersTab_

- [ ] 4.8 Build admin edit suggestions tab
  - **Do**:
    1. Create `src/app/api/admin/edits/route.ts` -- GET (pending edits list)
    2. Create `src/app/api/admin/edits/[id]/approve/route.ts` -- PUT (approve, apply changes)
    3. Create `src/app/api/admin/edits/[id]/reject/route.ts` -- PUT (reject with feedback)
    4. Create `src/components/admin/tabs/edits-tab.tsx` -- DataTable: resource, submitter, edit type, status, AI recommendation. Expandable row with side-by-side diff. Approve/reject buttons. Bulk actions for high-confidence AI recs.
  - **Files**: All 4 files
  - **Done when**: Edit suggestions visible with diff view, approve/reject applies changes and records audit
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build edit suggestions review tab`
  - _Requirements: US-8, AC-8.1 through AC-8.6, FR-26 through FR-28_
  - _Design: Admin Layout Tree > EditsTab_

- [ ] 4.9 Build admin tags tab
  - **Do**:
    1. Create `src/app/api/admin/tags/route.ts` -- GET (all tags with usage counts)
    2. Create `src/app/api/admin/tags/[id]/route.ts` -- PUT (rename), DELETE (delete unused)
    3. Create `src/app/api/admin/tags/merge/route.ts` -- POST (merge tags)
    4. Create `src/components/admin/tabs/tags-tab.tsx` -- DataTable: name, slug, usage count, description. Sort by usage. Merge dialog. Rename inline. Delete (only if count=0).
  - **Files**: All 4 files
  - **Done when**: Tags DataTable with merge, rename, delete functionality
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build tag management tab with merge`
  - _Requirements: US-35, AC-35.1 through AC-35.5_
  - _Design: Admin Layout Tree > TagsTab_

- [ ] 4.10 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(admin): pass quality checkpoint` (only if fixes needed)

- [ ] 4.11 Build admin API keys tab
  - **Do**:
    1. Create `src/features/api-keys/api-key-service.ts` -- `createKey()` (generate, SHA-256 hash, store prefix), `revokeKey()`, `validateKey()`, `listKeys()`, `getKeyUsage()`
    2. Create `src/features/api-keys/api-key-schemas.ts` -- Zod: create (name, tier, expiry, scopes)
    3. Create `src/app/api/keys/route.ts` -- GET (user's keys), POST (create key -- returns full key once)
    4. Create `src/app/api/keys/[id]/route.ts` -- DELETE (revoke)
    5. Create `src/app/api/admin/api-keys/route.ts` -- GET (all keys)
    6. Create `src/app/api/admin/api-keys/[id]/route.ts` -- PUT (tier change), DELETE (revoke)
    7. Create `src/components/admin/tabs/api-keys-tab.tsx` -- DataTable: prefix, name, user, tier, status, last used. Filter by tier/status. Revoke + tier change actions. Usage stats.
    8. Update profile page to include API key management section
  - **Files**: All 8 files
  - **Done when**: API keys can be created (full key shown once), listed, revoked, admin can manage all
  - **Verify**: `npm run build`
  - **Commit**: `feat(api-keys): implement API key management with tier-based system`
  - _Requirements: US-13, US-36, AC-13.1 through AC-13.7, FR-65 through FR-68_
  - _Design: Module: API Keys_

- [ ] 4.12 Build admin settings tab
  - **Do**:
    1. Create `src/features/admin/settings-service.ts` -- `getSetting()`, `setSetting()`, `getAllSettings()`
    2. Create `src/app/api/admin/settings/route.ts` -- GET, PUT
    3. Create `src/components/admin/tabs/settings-tab.tsx` -- Form sections: site info (name, description), default theme, domain allowlist management (add/remove domains), AI config (model, temperature, max tokens), rate limit config per tier, email template text
  - **Files**: All 3 files
  - **Done when**: Settings form saves and retrieves values from site_setting table
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build settings tab with domain allowlist and AI config`
  - _Requirements: US-39, AC-39.1 through AC-39.6_
  - _Design: Admin Layout Tree > SettingsTab_

- [ ] 4.13 Build admin analytics tab
  - **Do**:
    1. Create `src/app/api/admin/analytics/route.ts` -- GET with query params for time window (7/30/90 days). Returns: top viewed resources, most favorited, user growth data, submission trends, category distribution, API usage by endpoint
    2. Create `src/components/admin/tabs/analytics-tab.tsx` -- Charts using Recharts: TopViewedChart (bar), UserGrowthChart (line), CategoryDistributionChart (pie), SubmissionTrendChart (area). Time window selector.
  - **Files**: `src/app/api/admin/analytics/route.ts`, `src/components/admin/tabs/analytics-tab.tsx`
  - **Done when**: Analytics tab shows charts with real data, time window filter works
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build analytics tab with Recharts visualizations`
  - _Requirements: US-37, AC-37.1 through AC-37.6_
  - _Design: Admin Layout Tree > AnalyticsTab_

- [ ] 4.14 [VERIFY] Quality checkpoint + full build
  - **Do**: Run full quality suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All pass
  - **Commit**: `chore(admin): pass Phase 4 quality checkpoint` (only if fixes needed)

---

## Phase 5: Advanced Features

Focus: AI enrichment, GitHub sync, learning journeys, link health.

- [ ] 5.1 Implement Claude AI analysis service
  - **Do**:
    1. Create `src/features/ai/claude-service.ts` -- `analyzeUrl(url)`: validate URL against domain allowlist, scrape URL metadata (title, description, OG image), call Claude haiku-4-5 for suggestions (title, description, tags, category, difficulty, confidence, keyTopics), generate blurhash from OG image, return `AiAnalysisResult`
    2. Create `src/features/ai/ai-cache-service.ts` -- Content-hash keyed cache: `getCachedResponse()`, `cacheResponse()`, increment hit counter on cache hit
    3. Create `src/features/ai/ai-types.ts` -- `AiAnalysisResult`, `AiCacheEntry`, `EnrichmentJob`, `EnrichmentQueueItem`
    4. Create `src/features/ai/ai-schemas.ts` -- Zod: analyze request (url), enrichment job config
    5. Create `src/app/api/ai/analyze/route.ts` -- POST (authenticated, accepts URL, returns AI analysis)
  - **Files**: All 5 files
  - **Done when**: URL analysis endpoint calls Claude API, caches responses, returns structured suggestions
  - **Verify**: `npm run build`
  - **Commit**: `feat(ai): implement Claude URL analysis with response caching`
  - _Requirements: US-14, AC-14.1 through AC-14.6, FR-34, FR-40_
  - _Design: Module: AI_

- [ ] 5.2 Implement batch enrichment service
  - **Do**:
    1. Create `src/features/ai/enrichment-service.ts` -- `startJob()`: create job record, query resources (all/unenriched filter), create queue items, start async processing loop. `processQueue()`: sequential with 2s batch delay, 1s item delay, max 3 retries with exponential backoff, update resource metadata on success, track progress counts. `cancelJob()`: set status cancelled. `getJobStatus()`: return progress.
    2. Create `src/app/api/admin/enrichment/route.ts` -- POST (start job, withAdmin)
    3. Create `src/app/api/admin/enrichment/jobs/route.ts` -- GET (list jobs)
    4. Create `src/app/api/admin/enrichment/jobs/[id]/route.ts` -- GET (status with progress), DELETE (cancel)
    5. Create `src/hooks/use-enrichment.ts` -- TanStack Query with 5s polling interval for active jobs
  - **Files**: All 5 files
  - **Done when**: Enrichment jobs can be started, monitored, cancelled. Resources get enriched metadata.
  - **Verify**: `npm run build`
  - **Commit**: `feat(ai): implement batch enrichment with job queue and retry logic`
  - _Requirements: US-15, AC-15.1 through AC-15.9, FR-35 through FR-38_
  - _Design: Batch Enrichment Flow_

- [ ] 5.3 Build admin enrichment tab
  - **Do**:
    1. Create `src/components/admin/tabs/enrichment-tab.tsx` -- Start job form (filter: all/unenriched, batch size), active job progress card (progress bar, processed/failed/skipped counts, cancel button), job history DataTable (status, totals, cost, duration), expandable error logs per job, cost summary section
    2. Create `src/components/admin/dialogs/enrichment-start-dialog.tsx` -- Start enrichment dialog with filter and batch size options
  - **Files**: `src/components/admin/tabs/enrichment-tab.tsx`, `src/components/admin/dialogs/enrichment-start-dialog.tsx`
  - **Done when**: Enrichment tab shows job management UI with real-time progress
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build enrichment tab with job management and progress tracking`
  - _Requirements: US-15, AC-15.1 through AC-15.9_
  - _Design: Admin Layout Tree > EnrichmentTab_

- [ ] 5.4 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(ai): pass quality checkpoint` (only if fixes needed)

- [ ] 5.5 Implement GitHub sync service (import)
  - **Do**:
    1. Create `src/features/github/github-client.ts` -- Octokit wrapper: `getRepoContent()`, `getReadme()`, `searchAwesomeLists()`, `createCommit()`
    2. Create `src/features/github/markdown-parser.ts` -- Parse awesome-list markdown: `##` = category, `###` = subcategory, `####` = sub-subcategory, `- [Title](URL) - Description` = resources. Handle edge cases.
    3. Create `src/features/github/sync-service.ts` -- `importFromGithub()`: fetch README, parse markdown, apply conflict strategy (skip/update/create), auto-create missing categories, track stats (added/updated/skipped/conflicts). Queue-based processing.
    4. Create `src/features/github/github-types.ts` -- `SyncConfig`, `ImportResult`, `ConflictStrategy`, `GithubSyncStatus`
    5. Create `src/features/github/github-schemas.ts` -- Zod: config, import request
  - **Files**: All 5 files
  - **Done when**: GitHub README can be fetched, parsed into resources, and imported with conflict handling
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(github): implement GitHub import with markdown parser and conflict resolution`
  - _Requirements: US-19, AC-19.1 through AC-19.7, FR-48, FR-56_
  - _Design: Module: GitHub_

- [ ] 5.6 Implement GitHub sync service (export + lint)
  - **Do**:
    1. Create `src/features/github/markdown-formatter.ts` -- Generate awesome-lint compliant markdown: TOC, alphabetical resources per section, proper heading hierarchy
    2. Create `src/features/github/awesome-lint.ts` -- Validate generated markdown: check TOC, heading hierarchy, link format, alphabetical order, no dead sections
    3. Extend `src/features/github/sync-service.ts` -- `exportToGithub()`: generate markdown, validate, create commit via GitHub API, update resource `githubSyncStatus`, store snapshot in sync history
  - **Files**: `src/features/github/markdown-formatter.ts`, `src/features/github/awesome-lint.ts`, `src/features/github/sync-service.ts`
  - **Done when**: Export generates valid awesome-list markdown, validates with lint, pushes to GitHub
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(github): implement export with markdown generation and awesome-lint validation`
  - _Requirements: US-20, AC-20.1 through AC-20.5, FR-49, FR-55_
  - _Design: Module: GitHub_

- [ ] 5.7 Build GitHub sync API routes and admin tab
  - **Do**:
    1. Create API routes: `src/app/api/admin/github/config/route.ts` (GET, PUT), `import/route.ts` (POST), `export/route.ts` (POST), `history/route.ts` (GET), `status/route.ts` (GET), `process-queue/route.ts` (POST), `awesome-lists/route.ts` (GET), `search/route.ts` (GET)
    2. Create `src/components/admin/tabs/github-tab.tsx` -- Config form (username, repo, branch, file path, token, direction, auto-sync toggle), import button with dialog, export button, sync history DataTable, current status display
    3. Create `src/components/admin/dialogs/github-import-dialog.tsx` -- Import dialog: repo URL, conflict strategy, validate links toggle, auto-approve toggle
  - **Files**: 8 API route files + 2 component files
  - **Done when**: GitHub tab allows config, import, export, shows history and status
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): build GitHub sync tab with import/export and history`
  - _Requirements: US-19 through US-22, FR-47 through FR-56_
  - _Design: Admin Layout Tree > GithubTab_

- [ ] 5.8 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(github): pass quality checkpoint` (only if fixes needed)

- [ ] 5.9 Implement learning journeys (service + API)
  - **Do**:
    1. Create `src/features/journeys/journey-service.ts` -- `listPublished()`, `getJourney()`, `createJourney()`, `updateJourney()`, `deleteJourney()`, `addStep()`, `removeStep()`, `reorderSteps()`, `enrollUser()`, `completeStep()`, `getUserProgress()`, `getUserJourneys()`
    2. Create `src/features/journeys/journey-schemas.ts` -- Zod: create/update journey, step completion (rating 1-5, timeSpent, notes)
    3. Create `src/features/journeys/journey-types.ts` -- `Journey`, `JourneyStep`, `JourneyProgress`, `StepCompletion`
    4. Create API routes: `src/app/api/journeys/route.ts` (GET list), `[id]/route.ts` (GET detail), `[id]/start/route.ts` (POST enroll), `[id]/progress/route.ts` (GET, PUT), `user/route.ts` (GET user's journeys)
  - **Files**: 3 feature files + 5 API route files
  - **Done when**: Journey CRUD, enrollment, step completion, progress tracking all work via API
  - **Verify**: `npm run build`
  - **Commit**: `feat(journeys): implement learning journey service with progress tracking`
  - _Requirements: FR-29 through FR-33, US-23 through US-25_
  - _Design: Module: Journeys_

- [ ] 5.10 Build journey pages and admin tab
  - **Do**:
    1. Create `src/app/(public)/journeys/page.tsx` -- Journey list: cards with title, description, difficulty badge, duration, step count, progress (if enrolled). Filter by difficulty/category. Featured highlighted.
    2. Create `src/app/(public)/journeys/[id]/page.tsx` -- Journey detail: title, description, ordered steps with completion status, linked resources, "Start Journey"/"Complete Step" buttons, progress percentage
    3. Create `src/components/journeys/journey-card.tsx` -- Journey card with difficulty badge, progress bar
    4. Create `src/components/journeys/journey-steps.tsx` -- Ordered step list with checkboxes, resource links
    5. Create `src/components/journeys/step-completion-dialog.tsx` -- Complete step dialog: rating (1-5), time spent, notes
    6. Create `src/components/admin/tabs/journeys-tab.tsx` -- DataTable: title, difficulty, status, enrollments. CRUD dialog. Step editor with drag-to-reorder. Publish/feature toggles.
    7. Create `src/components/admin/dialogs/journey-dialog.tsx` -- Create/edit journey dialog
    8. Create admin API routes: `src/app/api/admin/journeys/route.ts` (POST), `[id]/route.ts` (PUT, DELETE)
  - **Files**: 8 files
  - **Done when**: Journey list/detail pages work, enrollment/completion flow functions, admin manages journeys
  - **Verify**: `npm run build`
  - **Commit**: `feat(journeys): build journey pages, step tracking, and admin management`
  - _Requirements: US-23 through US-25, AC-23.1 through AC-25.5_
  - _Design: File Structure > journeys_

- [ ] 5.11 Implement link health checking
  - **Do**:
    1. Create `src/features/admin/link-health-service.ts` -- `checkLinks()`: concurrent URL checking (Promise.allSettled with concurrency limit), retry once on timeout, record status code + response time + error. `getResults()`: return broken links with filters.
    2. Create `src/app/api/admin/link-health/route.ts` -- POST (trigger check, withAdmin), GET (results with filter/sort)
  - **Files**: `src/features/admin/link-health-service.ts`, `src/app/api/admin/link-health/route.ts`
  - **Done when**: Link health check runs, results stored, broken links queryable
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): implement link health checking with concurrent requests`
  - _Requirements: US-44, AC-44.1 through AC-44.4, FR-69_
  - _Design: Module: Admin_

- [ ] 5.12 [VERIFY] Quality checkpoint + full build
  - **Do**: Run full quality suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All pass
  - **Commit**: `chore(advanced): pass Phase 5 quality checkpoint` (only if fixes needed)

---

## Phase 6: AI Research and Polish

Focus: Research jobs, recommendations, export tools, awesome-lint.

- [ ] 6.1 Implement AI research job system
  - **Do**:
    1. Create `src/features/ai/research-service.ts` -- `startResearchJob()`: create job, process based on type (validation/enrichment/discovery/trend_analysis/comprehensive), generate findings. `applyFinding()`: execute suggested change. `dismissFinding()`: mark dismissed.
    2. Create research API routes: `src/app/api/admin/research/jobs/route.ts` (GET list, POST start), `jobs/[id]/route.ts` (GET detail, DELETE cancel), `jobs/[id]/report/route.ts` (GET report), `findings/[id]/apply/route.ts` (POST), `findings/[id]/dismiss/route.ts` (POST), `costs/route.ts` (GET cost breakdown)
  - **Files**: 1 service + 6 API route files
  - **Done when**: Research jobs can be started, findings generated, applied/dismissed, costs tracked
  - **Verify**: `npm run build`
  - **Commit**: `feat(research): implement AI research job system with findings management`
  - _Requirements: US-17, US-18, FR-41 through FR-46_
  - _Design: Module: AI_

- [ ] 6.2 Implement AI recommendations
  - **Do**:
    1. Create `src/features/ai/recommendation-engine.ts` -- Weighted scoring: category preference (30%), tag overlap (25%), co-viewed (20%), learning goal similarity (15%), recency (10%). Exclude viewed/favorited/completed. Filter by skill level. Return top 10 with confidence + explanations. Fallback: popular-in-category for minimal history.
    2. Create `src/app/api/ai/recommendations/route.ts` -- GET (authenticated, returns personalized recommendations)
  - **Files**: `src/features/ai/recommendation-engine.ts`, `src/app/api/ai/recommendations/route.ts`
  - **Done when**: Recommendations endpoint returns scored resources with explanations
  - **Verify**: `npm run build`
  - **Commit**: `feat(ai): implement personalized recommendation engine`
  - _Requirements: US-29, AC-29.1 through AC-29.5, FR-39_
  - _Design: Module: AI_

- [ ] 6.3 Implement export tools (markdown, JSON, CSV)
  - **Do**:
    1. Create `src/features/admin/export-service.ts` -- `exportMarkdown()`: generate awesome-list formatted markdown. `exportJson()`: full DB backup as JSON. `exportCsv()`: selected resources as CSV. `validateAwesomeLint()`: validate markdown.
    2. Create `src/app/api/admin/export/route.ts` -- POST (markdown), GET (JSON full backup)
    3. Create `src/app/api/admin/export/validate/route.ts` -- POST (awesome-lint validation, return results)
  - **Files**: `src/features/admin/export-service.ts`, `src/app/api/admin/export/route.ts`, `src/app/api/admin/export/validate/route.ts`
  - **Done when**: Export produces valid markdown/JSON/CSV, validation returns lint results
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): implement export tools and awesome-lint validation`
  - _Requirements: US-38, AC-38.1 through AC-38.5, FR-55_
  - _Design: Module: Admin_

- [ ] 6.4 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(research): pass Phase 6 quality checkpoint` (only if fixes needed)

---

## Phase 7: SEO and Final Polish

Focus: Sitemap, OG images, JSON-LD, rate limiting, audit logging, mobile polish.

- [ ] 7.1 Implement dynamic sitemap.xml and robots.txt
  - **Do**:
    1. Create `src/app/sitemap.ts` -- Dynamic XML sitemap from DB: all categories (with nested slugs), all approved resources, all published journeys. Proper `lastmod`, `changefreq`, `priority`.
    2. Create `src/app/robots.ts` -- Disallow: /admin, /profile, /bookmarks, /favorites, /history, /api/. Allow: /api/resources (public), /api/categories (public).
  - **Files**: `src/app/sitemap.ts`, `src/app/robots.ts`
  - **Done when**: `/sitemap.xml` returns valid XML with all public pages, `/robots.txt` correct
  - **Verify**: `npm run build`
  - **Commit**: `feat(seo): implement dynamic sitemap.xml and robots.txt`
  - _Requirements: FR-61, FR-64, AC-43.1, AC-43.4_
  - _Design: File Structure_

- [ ] 7.2 Implement dynamic OG images
  - **Do**:
    1. Create `src/app/opengraph-image.tsx` -- Default OG image: cyberpunk-styled with site name, tagline
    2. Create `src/app/(public)/resources/[id]/opengraph-image.tsx` -- Per-resource OG: resource title, category, tags on cyberpunk background
    3. Create `src/app/(public)/categories/[slug]/opengraph-image.tsx` -- Per-category OG: category name, resource count
    4. Use Next.js `ImageResponse` API for generation
  - **Files**: 3 OG image files
  - **Done when**: OG images generate correctly for home, resources, categories
  - **Verify**: `npm run build`
  - **Commit**: `feat(seo): implement dynamic OG images with cyberpunk styling`
  - _Requirements: FR-62, AC-43.2_
  - _Design: SEO_

- [ ] 7.3 Add JSON-LD structured data and generateMetadata to all public pages
  - **Do**:
    1. Add JSON-LD to home page: `Organization` schema
    2. Add JSON-LD to resource detail: `Article` schema with author, date, tags
    3. Add JSON-LD to category pages: `CollectionPage` schema
    4. Add JSON-LD to journey pages: `Course` schema with steps as `hasPart`
    5. Verify every public page has `generateMetadata()` with title, description, og tags
    6. Create `src/lib/json-ld.ts` helper functions for each schema type
  - **Files**: `src/lib/json-ld.ts`, update all public page files
  - **Done when**: All public pages have JSON-LD script tags and proper metadata
  - **Verify**: `npm run build`
  - **Commit**: `feat(seo): add JSON-LD structured data and metadata to all public pages`
  - _Requirements: FR-63, AC-43.3, AC-43.5, AC-43.6_
  - _Design: SEO_

- [ ] 7.4 [VERIFY] Quality checkpoint
  - **Do**: Run quality commands
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors
  - **Commit**: `chore(seo): pass quality checkpoint` (only if fixes needed)

- [ ] 7.5 Implement API key rate limiting and authentication
  - **Do**:
    1. Update `src/features/auth/auth-middleware.ts` -- `withApiKey()`: validate `x-api-key` header via SHA-256 hash lookup, enforce rate limits per tier (free=60/hr, standard=1000/hr, premium=10000/hr), update last_used_at, log to api_usage_log
    2. Create rate limiting utility in `src/lib/rate-limit.ts` -- In-memory sliding window Map, 3 tiers: anonymous (30/min/IP), session (100/min/user), API key (tier-based/hr)
    3. Update `src/middleware.ts` to apply anonymous rate limiting on API routes
  - **Files**: `src/features/auth/auth-middleware.ts`, `src/lib/rate-limit.ts`, `src/middleware.ts`
  - **Done when**: Rate limits enforced per tier, API key auth works via header
  - **Verify**: `npm run build`
  - **Commit**: `feat(security): implement API key rate limiting and tiered auth`
  - _Requirements: FR-68, NFR-8 through NFR-10, NFR-15, AC-13.6, AC-13.7_
  - _Design: Security Considerations_

- [ ] 7.6 Add audit logging to all admin mutations
  - **Do**:
    1. Update `src/features/admin/audit-service.ts` -- ensure all mutations (create, update, delete, approve, reject) across resources, categories, users, tags, settings call `createAuditLog()` with previous state, new state, user, timestamp
    2. Create `src/app/api/admin/audit/route.ts` -- GET (audit log with filters, pagination)
    3. Verify resource audit log entries viewable in admin panel (add section to overview tab or resources tab)
  - **Files**: `src/features/admin/audit-service.ts`, `src/app/api/admin/audit/route.ts`, update relevant tabs
  - **Done when**: All admin mutations logged, audit trail viewable
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): add comprehensive audit logging to all mutations`
  - _Requirements: US-40, AC-40.1 through AC-40.4_
  - _Design: Error Handling_

- [ ] 7.7 Mobile responsive polish
  - **Do**:
    1. Review and fix all public pages at sm(640), md(768), lg(1024) breakpoints
    2. Ensure TopBar hamburger menu works on mobile
    3. Resource grid switches to single column on mobile
    4. Category cards stack vertically on mobile
    5. Admin panel sidebar collapses to hamburger on mobile
    6. Search dialog is full-screen on mobile
    7. All forms are usable on mobile (no horizontal scroll)
  - **Files**: Update CSS/classes across components as needed
  - **Done when**: All pages render correctly at all breakpoints
  - **Verify**: `npm run build`
  - **Commit**: `feat(responsive): polish mobile responsive layout across all pages`
  - _Requirements: NFR-23, AC-46.2_
  - _Design: Performance Considerations_

- [ ] 7.8 Update next.config.ts with production settings
  - **Do**:
    1. Add image domains for OG images and external resource images
    2. Add security headers (CSP, X-Frame-Options, etc.)
    3. Configure redirects if needed
    4. Enable output: 'standalone' for Vercel
  - **Files**: `next.config.ts`
  - **Done when**: Config has all production settings
  - **Verify**: `npm run build`
  - **Commit**: `feat(config): add production Next.js configuration`
  - _Requirements: NFR-13_
  - _Design: Security Considerations_

- [ ] 7.9 [VERIFY] Quality checkpoint + full build
  - **Do**: Run full quality suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: All pass
  - **Commit**: `chore(polish): pass Phase 7 quality checkpoint` (only if fixes needed)

---

## Phase 8: Functional Validation

Focus: Real browser/cURL validation of every feature with evidence. No mocks, no unit tests.

- [ ] 8.1 Validate foundation: dev server, database, themes
  - **Do**:
    1. Start dev server
    2. cURL home page, verify HTML renders with TopBar + Footer
    3. Verify Prisma connects: cURL `/api/categories` returns valid JSON
    4. Verify 4 theme CSS variables present in page source
    5. Verify auth endpoint responds: cURL `/api/auth/ok`
  - **Verify**: `npm run build && npm run start & sleep 3 && curl -s http://localhost:3000 | grep -c "data-theme" && curl -s http://localhost:3000/api/categories | python3 -c "import sys,json;json.load(sys.stdin);print('valid JSON')" && kill %1`
  - **Done when**: All cURL checks pass
  - **Commit**: `chore(validate): verify foundation end-to-end`

- [ ] 8.2 Validate resource lifecycle (create, approve, edit, delete)
  - **Do**:
    1. Seed a test admin user in database
    2. cURL POST `/api/resources` with auth to create pending resource
    3. cURL GET `/api/admin/resources/pending` to verify pending queue
    4. cURL PUT `/api/resources/:id/approve` to approve
    5. cURL GET `/api/resources` to verify approved resource appears
    6. cURL PUT `/api/admin/resources/:id` to update
    7. cURL DELETE `/api/admin/resources/:id` to delete
    8. Verify audit log has entries for each action
  - **Verify**: Series of cURL commands testing full lifecycle
  - **Done when**: All CRUD operations verified via cURL responses
  - **Commit**: `chore(validate): verify resource lifecycle end-to-end`
  - _Requirements: FR-5 through FR-14_

- [ ] 8.3 Validate category hierarchy and navigation
  - **Do**:
    1. cURL POST to create category, subcategory, sub-subcategory
    2. cURL GET `/api/categories` to verify tree structure
    3. cURL home page to verify category cards render
    4. Verify delete protection: cURL DELETE category with resources returns error
    5. Verify breadcrumb data in category page responses
  - **Verify**: cURL commands testing hierarchy CRUD and navigation
  - **Done when**: 3-level hierarchy works, delete protection active
  - **Commit**: `chore(validate): verify category hierarchy end-to-end`
  - _Requirements: FR-15 through FR-19_

- [ ] 8.4 Validate auth flows
  - **Do**:
    1. cURL POST `/api/auth/sign-up/email` to register
    2. cURL POST `/api/auth/sign-in/email` to login, capture session cookie
    3. cURL protected endpoint with session cookie to verify auth
    4. cURL admin endpoint without admin role to verify 403
    5. Verify middleware redirects for unauthenticated requests
  - **Verify**: cURL commands testing auth flows
  - **Done when**: Registration, login, session validation, role-based access all verified
  - **Commit**: `chore(validate): verify auth flows end-to-end`
  - _Requirements: FR-2, US-10, US-12_

- [ ] 8.5 Validate user features (favorites, bookmarks, preferences)
  - **Do**:
    1. cURL POST to add favorite (with auth)
    2. cURL GET favorites list to verify
    3. cURL POST to add bookmark with notes
    4. cURL GET bookmarks to verify notes
    5. cURL PUT preferences with skill level and categories
    6. cURL GET preferences to verify persistence
  - **Verify**: cURL commands testing all user features
  - **Done when**: Favorites, bookmarks, preferences all CRUD verified
  - **Commit**: `chore(validate): verify user features end-to-end`
  - _Requirements: FR-20, FR-21, FR-23_

- [ ] 8.6 Validate admin panel API endpoints
  - **Do**:
    1. cURL GET `/api/admin/stats` to verify dashboard data
    2. cURL GET `/api/admin/users` to verify user list
    3. cURL PUT user role change
    4. cURL tag operations (list, rename, merge, delete)
    5. cURL settings GET/PUT
    6. cURL analytics endpoint
  - **Verify**: cURL commands testing all admin endpoints
  - **Done when**: All admin API endpoints respond correctly
  - **Commit**: `chore(validate): verify admin panel APIs end-to-end`
  - _Requirements: FR-57 through FR-60_

- [ ] 8.7 Validate SEO (sitemap, robots, OG, metadata)
  - **Do**:
    1. cURL GET `/sitemap.xml` to verify valid XML with categories + resources
    2. cURL GET `/robots.txt` to verify disallow rules
    3. cURL home page, check for JSON-LD and meta tags in HTML
    4. cURL resource detail page, check for Article JSON-LD
    5. Verify OG image URLs return valid images
  - **Verify**: `curl -s http://localhost:3000/sitemap.xml | head -20 && curl -s http://localhost:3000/robots.txt`
  - **Done when**: Sitemap valid, robots.txt correct, JSON-LD present, meta tags complete
  - **Commit**: `chore(validate): verify SEO implementation end-to-end`
  - _Requirements: FR-61 through FR-64_

- [ ] 8.8 Validate API key system
  - **Do**:
    1. cURL POST `/api/keys` to create API key (capture full key from response)
    2. cURL GET `/api/resources` with `x-api-key` header using created key
    3. Verify rate limit headers in response
    4. cURL multiple rapid requests to trigger rate limiting
    5. cURL DELETE `/api/keys/:id` to revoke, verify revoked key returns 401
  - **Verify**: cURL commands testing full API key lifecycle
  - **Done when**: Key creation, usage, rate limiting, revocation all verified
  - **Commit**: `chore(validate): verify API key system end-to-end`
  - _Requirements: FR-65 through FR-68_

- [ ] 8.9 [VERIFY] Full local CI: lint + typecheck + build
  - **Do**: Run complete local CI suite
  - **Verify**: `npm run lint && npx tsc --noEmit && npm run build`
  - **Done when**: Build succeeds, all checks pass
  - **Commit**: `chore(validate): pass full local CI` (if fixes needed)

---

## Phase 9: Quality Gates

- [ ] 9.1 Local quality check (final)
  - **Do**: Run ALL quality checks locally
  - **Verify**: All commands must pass:
    - Type check: `npx tsc --noEmit`
    - Lint: `npm run lint`
    - Build: `npm run build`
  - **Done when**: All commands pass with no errors
  - **Commit**: `fix(quality): address final lint/type issues` (if fixes needed)

- [ ] 9.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is a feature branch: `git branch --show-current`
    2. If on default branch, STOP and alert user
    3. Push branch: `git push -u origin <branch-name>`
    4. Create PR: `gh pr create --title "feat: Awesome List Curator V2 - Full Rebuild" --body "..."`
    5. Wait for CI: `gh pr checks --watch`
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: All CI checks green, PR ready for review
  - **If CI fails**: Read failure, fix locally, push, re-verify

---

## Phase 10: PR Lifecycle

- [ ] 10.1 Monitor CI and fix failures
  - **Do**:
    1. Run `gh pr checks` to see CI status
    2. If any check fails, read details and fix
    3. Push fixes and re-verify
  - **Verify**: `gh pr checks` all green
  - **Done when**: All CI checks passing
  - **Commit**: `fix(ci): address CI failures` (if needed)

- [ ] 10.2 [VERIFY] AC checklist - verify all acceptance criteria
  - **Do**:
    1. Read requirements.md
    2. Programmatically verify each FR-XX is satisfied:
       - Grep codebase for API route implementations
       - Verify schema has all 31 models
       - Verify all 14 admin tabs exist
       - Verify 4 themes in globals.css
       - Verify middleware chain exists
    3. Document verification results
  - **Verify**: Grep for route files count, model count, tab count, theme count
  - **Done when**: All acceptance criteria confirmed met
  - **Commit**: None (verification only)

---

## Notes

### POC Shortcuts (Phase 1)
- Email verification/reset not functional until email provider configured (Resend/SendGrid)
- Google OAuth requires Google Cloud OAuth app credentials in env
- GitHub OAuth requires GitHub OAuth app credentials in env
- Rate limiting uses in-memory Map (resets on deploy)
- Job processing is in-process async (no external queue)

### Production TODOs (Post-MVP)
- Configure email provider for Better Auth verification/reset
- Set up Vercel Cron for scheduled link health checks (FR-70)
- Add virtual scrolling for admin tables with 1000+ rows (NFR-22)
- Data migration from legacy database (JSON export/import)
- Stitch MCP screen designs for all 18 screens (US-46)
- Performance optimization for Lighthouse 90+ (NFR-1)

### Dependency Chain
- Phase 2 depends on Phase 1 (database, auth, middleware)
- Phase 3 depends on Phase 2 (resource/category services exist)
- Phase 4 depends on Phase 2 (admin needs data to manage)
- Phase 5 depends on Phase 2 + Phase 4 (AI/GitHub use resources + admin UI)
- Phase 6 depends on Phase 5 (research uses enrichment, export uses resources)
- Phase 7 depends on Phase 2-6 (SEO covers all public pages)
- Phase 8 depends on all prior phases (validation of everything)

### Key Risk Areas
- **Better Auth + Prisma 7 compatibility**: Test auth flows early in Phase 1
- **GitHub sync bidirectional**: Import first (Phase 5.5), export second (Phase 5.6)
- **60+ route handlers**: Shared middleware reduces boilerplate but still large surface area
- **Claude API integration**: Requires valid ANTHROPIC_API_KEY env var
