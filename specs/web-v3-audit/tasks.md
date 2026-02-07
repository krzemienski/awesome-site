---
spec: web-v3-audit
phase: tasks
total_tasks: 48
created: 2026-02-07T06:30:00Z
---

# Tasks: V3 Design Audit - Three Variation Rebuild

## Phase 1: Foundation (Variation System + Sidebar Install)

Focus: Install shadcn sidebar primitives, create variation switching infrastructure (provider, CSS tokens, inline script), wire into root layout. No visual changes to existing pages yet.

- [x] 1.1 Install shadcn sidebar component
  - **Do**:
    1. Run `npx shadcn@latest add sidebar` in project root
    2. Verify `src/components/ui/sidebar.tsx` created with SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubButton, SidebarTrigger, SidebarHeader, SidebarFooter, SidebarInset, SidebarSeparator exports
    3. Verify `src/hooks/use-mobile.tsx` created (useIsMobile hook)
  - **Files**: `src/components/ui/sidebar.tsx` (created by CLI), `src/hooks/use-mobile.tsx` (created by CLI)
  - **Done when**: `npx tsc --noEmit` passes; sidebar primitives importable
  - **Verify**: `npx tsc --noEmit && ls src/components/ui/sidebar.tsx`
  - **Commit**: `feat(ui): install shadcn sidebar component primitives`
  - _Requirements: FR-2, FR-1_
  - _Design: WS-1 Foundation_

- [x] 1.2 Create variation CSS token files
  - **Do**:
    1. Create `src/styles/variation-a.css` with `[data-variation="a"]` selector containing tokens: `--sidebar-width: 280px`, `--sidebar-collapsed-width: 64px`, `--content-max-width: 1400px`, `--heading-scale: 1.333`, `--card-padding: 24px`, `--card-gap: 16px`, `--card-border-width: 1px`, `--nav-item-height: 40px`, `--sidebar-header-height: 64px`, `--transition-duration: 200ms`, `--font-weight-heading: 700`
    2. Create `src/styles/variation-b.css` with `[data-variation="b"]` selector (default): `--sidebar-width: 280px`, `--sidebar-collapsed-width: 64px`, `--content-max-width: 1200px`, `--heading-scale: 1.25`, `--card-padding: 20px`, `--card-gap: 12px`, `--card-border-width: 1px`, `--nav-item-height: 36px`, `--sidebar-header-height: 56px`, `--transition-duration: 150ms`, `--font-weight-heading: 600`
    3. Create `src/styles/variation-c.css` with `[data-variation="c"]` selector: `--sidebar-width: 260px`, `--sidebar-collapsed-width: 56px`, `--content-max-width: 1400px`, `--heading-scale: 1.2`, `--card-padding: 16px`, `--card-gap: 16px`, `--card-border-width: 2px`, `--nav-item-height: 44px`, `--sidebar-header-height: 72px`, `--transition-duration: 250ms`, `--font-weight-heading: 800`
    4. Add `@import "../styles/variation-a.css"`, `@import "../styles/variation-b.css"`, `@import "../styles/variation-c.css"` to `src/app/globals.css` after the theme definitions (after the `@layer base` block)
  - **Files**: `src/styles/variation-a.css` (new), `src/styles/variation-b.css` (new), `src/styles/variation-c.css` (new), `src/app/globals.css` (modify)
  - **Done when**: All 3 CSS files exist, globals.css imports them, `npm run build` passes
  - **Verify**: `npm run build`
  - **Commit**: `feat(theme): add CSS token files for 3 design variations`
  - _Requirements: FR-3, FR-4_
  - _Design: CSS Token Architecture_

- [x] 1.3 Create VariationProvider and VariationScript
  - **Do**:
    1. Create `src/components/variation/variation-provider.tsx`: `"use client"` component. Define `type VariationId = "a" | "b" | "c"`. Create React context `VariationContext` with `{ variation: VariationId, setVariation: (v: VariationId) => void }`. Provider reads `?variation=` from `useSearchParams()` (no nuqs dependency - project doesn't use it). Default to `"b"`. On variation change, update `document.documentElement.dataset.variation` and push URL param via `useRouter`. Export `VariationProvider` and `useVariation` hook.
    2. Create `src/components/variation/variation-script.tsx`: Server component with inline `<script>` (same pattern as `ThemeScript`). Script reads `new URLSearchParams(window.location.search).get('variation')` and falls back to `'b'`. Sets `document.documentElement.dataset.variation`. Prevents FOUC.
    3. Create `src/hooks/use-variation.ts`: Re-export `useVariation` from variation-provider for convenient import.
  - **Files**: `src/components/variation/variation-provider.tsx` (new), `src/components/variation/variation-script.tsx` (new), `src/hooks/use-variation.ts` (new)
  - **Done when**: `npx tsc --noEmit` passes; provider and script export correctly
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(variation): create VariationProvider context and anti-FOUC script`
  - _Requirements: FR-3, AC-13.1, AC-13.4_
  - _Design: VariationProvider, VariationScript_

- [x] 1.4 Wire VariationProvider into root layout
  - **Do**:
    1. In `src/app/layout.tsx`: import `VariationProvider` from `@/components/variation/variation-provider` and `VariationScript` from `@/components/variation/variation-script`
    2. Add `<VariationScript />` inside `<head>` after `<ThemeScript />`
    3. Wrap existing content with `<VariationProvider>` inside `<ThemeProvider>` (so variation context is available to all pages)
    4. Do NOT remove TopBar/Footer yet - that happens in Phase 2
  - **Files**: `src/app/layout.tsx` (modify)
  - **Done when**: Root layout renders with both theme and variation data attributes on `<html>`; `npm run build` passes
  - **Verify**: `npm run build`
  - **Commit**: `feat(layout): wire VariationProvider and VariationScript into root layout`
  - _Requirements: FR-3, AC-13.1_
  - _Design: Architecture - RootLayout_

- [x] 1.5 Create VariationSwitcher floating UI
  - **Do**:
    1. Create `src/components/variation/variation-switcher.tsx`: `"use client"` component
    2. Fixed-position floating button (bottom-right, `fixed bottom-4 right-4 z-50`)
    3. Uses shadcn `Popover` + `RadioGroup` (both already installed in components/ui)
    4. 3 radio options: A (Pro Audit), B (shadcn Blocks), C (Stitch Generated)
    5. Calls `setVariation()` from `useVariation()` on selection
    6. Shows current variation label on the trigger button
    7. Add `<VariationSwitcher />` inside `VariationProvider` in `src/app/layout.tsx`
  - **Files**: `src/components/variation/variation-switcher.tsx` (new), `src/app/layout.tsx` (modify)
  - **Done when**: Floating button visible on all pages; clicking opens popover with 3 variation options; selection updates URL param and `data-variation` attribute
  - **Verify**: `npm run build`
  - **Commit**: `feat(variation): add floating VariationSwitcher UI component`
  - _Requirements: FR-21, AC-13.2, AC-13.3, AC-13.5_
  - _Design: VariationSwitcher_

- [x] 1.6 [VERIFY] Phase 1 quality checkpoint
  - **Do**: Run full quality suite: lint, typecheck, build. Start dev server and verify variation switching works via URL param.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All 3 commands pass with zero errors. `?variation=a`, `?variation=b`, `?variation=c` URL params change `data-variation` attribute on `<html>`
  - **Commit**: `chore(quality): pass Phase 1 quality checkpoint` (only if fixes needed)

## Phase 2: Sidebar Integration (Public + Admin)

Focus: Build AppSidebar for public pages, create CategoryTree with API, create public layout with SidebarProvider, upgrade admin sidebar to shadcn with 20-tab grouping, restructure root layout to remove TopBar.

- [ ] 2.1 Create category tree API endpoint
  - **Do**:
    1. Create `src/app/api/categories/tree/route.ts`
    2. Export `GET` handler (public, no auth required)
    3. Use `prisma.category.findMany()` with `buildCategoryTreeInclude()` from `@/features/categories/category-queries` and `buildCategoryOrderBy()`
    4. Transform Prisma result to `CategoryTreeNode[]` shape: `{ id, name, slug, resourceCount: _count.resources, children: subcategories.map(...) }` with nested subcategory and sub-subcategory nodes
    5. Return via `apiSuccess(tree)`
    6. Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` header (5min cache)
  - **Files**: `src/app/api/categories/tree/route.ts` (new)
  - **Done when**: `curl http://localhost:3000/api/categories/tree` returns JSON with category tree including resource counts
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(api): add public category tree endpoint`
  - _Requirements: FR-14, AC-1.3_
  - _Design: CategoryTree data source_

- [x] 2.2 Create use-category-tree hook
  - **Do**:
    1. Create `src/hooks/use-category-tree.ts`
    2. Define `CategoryTreeNode`, `SubcategoryNode`, `SubSubcategoryNode` interfaces (readonly, matching design.md shapes)
    3. Export `useCategoryTree()` hook using `useQuery` with `queryKey: ["categories", "tree"]`, `queryFn` fetches `/api/categories/tree`, `staleTime: 300_000` (5min)
  - **Files**: `src/hooks/use-category-tree.ts` (new)
  - **Done when**: Hook compiles; returns typed category tree data
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(hooks): add useCategoryTree hook for sidebar navigation`
  - _Requirements: FR-14_
  - _Design: CategoryTree_

- [x] 2.3 Create AppSidebar component
  - **Do**:
    1. Create `src/components/sidebar/app-sidebar.tsx`: `"use client"` component
    2. Use shadcn Sidebar primitives: `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarHeader`, `SidebarFooter`, `SidebarSeparator`
    3. **SidebarHeader**: Logo link ("Awesome Video" -> `/`), search trigger button (opens SearchDialog via state)
    4. **SidebarGroup "Navigation"**: 5 links - Home (`/`), Resources (`/resources`), Categories (`/categories`), Journeys (`/journeys`), About (`/about`). Use `usePathname()` for active state highlighting
    5. **SidebarGroup "Categories"**: Render `CategoryTree` component (next task)
    6. **SidebarGroup "User"** (auth-gated): Show when `session` exists from `useAuth()`. Links: Favorites (`/favorites`), Bookmarks (`/bookmarks`), History (`/history`), Profile (`/profile`), Submit Resource (`/submit`). When not authenticated, show "Sign In" link to `/login`
    7. **SidebarFooter**: `ThemeSwitcher` component + `UserMenu` component (existing)
    8. Configure Sidebar with `collapsible="icon"` and `variant="sidebar"`
    9. Use `cn()` for class merging, lucide-react icons for each nav item
  - **Files**: `src/components/sidebar/app-sidebar.tsx` (new)
  - **Done when**: Component compiles; renders all 5 sidebar sections using shadcn primitives
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(sidebar): create AppSidebar with nav, user section, and footer`
  - _Requirements: FR-1, AC-1.2, AC-1.6, AC-1.7, FR-16, FR-17_
  - _Design: AppSidebar_

- [x] 2.4 Create CategoryTree component
  - **Do**:
    1. Create `src/components/sidebar/category-tree.tsx`: `"use client"` component
    2. Use `useCategoryTree()` hook for data
    3. Render top-level categories as `SidebarMenuItem` with `SidebarMenuButton`
    4. Each category wraps children in `Collapsible` (from shadcn) with `SidebarMenuSub` + `SidebarMenuSubButton` for subcategories
    5. Sub-subcategories nested one more level inside their parent subcategory's `Collapsible`
    6. Each item shows: icon (FolderTree/FolderOpen/Folder), name (truncated with `truncate`), resource count in `Badge` (small, outline variant)
    7. Links: `/categories/[slug]`, `/categories/[slug]/[subSlug]`, `/categories/[slug]/[subSlug]/[subSubSlug]`
    8. Loading state: 5 `Skeleton` items. Error state: "Failed to load categories" with retry button
    9. Empty state: "No categories yet" placeholder text
  - **Files**: `src/components/sidebar/category-tree.tsx` (new)
  - **Done when**: Component renders 3-level expandable category tree with resource counts and navigation links
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(sidebar): create CategoryTree component with 3-level expand/collapse`
  - _Requirements: FR-14, AC-1.3_
  - _Design: CategoryTree_

- [x] 2.5 Create public route group layout with SidebarProvider
  - **Do**:
    1. Create `src/app/(public)/layout.tsx`: Server component
    2. Import `SidebarProvider`, `SidebarInset`, `SidebarTrigger` from `@/components/ui/sidebar`
    3. Import `AppSidebar` from `@/components/sidebar/app-sidebar`
    4. Render: `<SidebarProvider defaultOpen={true}>` wrapping `<AppSidebar />` + `<SidebarInset>` containing `<SidebarTrigger />` + `{children}`
    5. SidebarInset contains the page content area with responsive padding
  - **Files**: `src/app/(public)/layout.tsx` (new)
  - **Done when**: All public pages render with sidebar on left and content on right; SidebarTrigger toggles collapse
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(layout): add public route group layout with SidebarProvider`
  - _Requirements: FR-1, FR-5, AC-1.1, AC-1.4, AC-1.5_
  - _Design: Architecture - PublicLayout_

- [x] 2.6 Restructure root layout: remove TopBar and Footer
  - **Do**:
    1. In `src/app/layout.tsx`: Remove `TopBar` import and `<TopBar />` render
    2. Remove `Footer` import and `<Footer />` render
    3. Remove `pt-16` class from `<main>` (no more top bar offset)
    4. Change `<main className="min-h-screen pt-16">` to just `<main className="min-h-screen">`
    5. Keep `<VariationScript />`, `<ThemeScript />`, all providers, `<VariationSwitcher />`
    6. Do NOT delete `top-bar.tsx` or `mobile-nav.tsx` files yet (may be referenced elsewhere)
  - **Files**: `src/app/layout.tsx` (modify)
  - **Done when**: Root layout no longer renders TopBar or Footer; public pages use sidebar from (public)/layout.tsx instead
  - **Verify**: `npm run build`
  - **Commit**: `refactor(layout): remove TopBar and Footer from root layout`
  - _Requirements: FR-1_
  - _Design: Files to Remove - TopBar, MobileNav_

- [x] 2.7 [VERIFY] Quality checkpoint: sidebar integration
  - **Do**: Run lint, typecheck, build. Start dev server and navigate to `/`, `/resources`, `/categories`, `/about` to confirm sidebar renders.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. Public pages show sidebar with nav, category tree, user section. Admin page still functional.
  - **Commit**: `chore(quality): pass Phase 2 sidebar integration checkpoint` (only if fixes needed)

- [x] 2.8 Upgrade AdminSidebar to shadcn with 20-tab grouping
  - **Do**:
    1. Rewrite `src/components/admin/admin-sidebar.tsx` completely
    2. Use shadcn Sidebar primitives: `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarHeader`, `SidebarFooter`
    3. Wrap each group in `Collapsible` (from shadcn/ui) with `CollapsibleTrigger` (chevron icon) and `CollapsibleContent`
    4. Define 6 groups with 20 total nav items:
       - **Overview** (always visible, no collapsible): Dashboard
       - **Content Management** (defaultOpen: true): Resources, Categories, Subcategories, Sub-subcategories, Tags
       - **Moderation** (defaultOpen: true): Edit Suggestions
       - **AI & Intelligence** (defaultOpen: false): Enrichment, Research
       - **Operations** (defaultOpen: false): GitHub Sync, Export, Validation, Link Health, Database, Audit
       - **System** (defaultOpen: false): Users, API Keys, Analytics, Learning Journeys, Settings
    5. Auto-expand group containing active tab via `useSearchParams().get("tab")`
    6. Keep existing nav click behavior: `router.push(/admin?tab=KEY)`
    7. Add appropriate lucide-react icons for each new tab (Download for Export, Database for Database, CheckCircle for Validation, Link for Link Health, ScrollText for Audit, FlaskConical for Research)
  - **Files**: `src/components/admin/admin-sidebar.tsx` (rewrite)
  - **Done when**: Admin sidebar shows 20 tabs in 6 collapsible groups; active tab highlighted; clicking navigates via `?tab=`
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): upgrade sidebar to shadcn with 20-tab collapsible groups`
  - _Requirements: FR-2, AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.6_
  - _Design: AdminSidebar (Upgraded)_

- [x] 2.9 Update AdminLayoutWrapper to use SidebarProvider
  - **Do**:
    1. Rewrite `src/components/admin/admin-layout.tsx`
    2. Replace custom `Sheet` + `div.hidden.md:block` pattern with `SidebarProvider` + `Sidebar` + `SidebarInset`
    3. Import `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger` from `@/components/ui/sidebar`
    4. Render: `<SidebarProvider defaultOpen={true}>` wrapping `<Sidebar collapsible="icon" variant="sidebar">` containing `<AdminSidebar />` content + `<SidebarInset>` containing `<SidebarTrigger />` + `{children}`
    5. Remove custom Sheet, useState for sidebarOpen, hamburger button
    6. Sidebar handles mobile (Sheet), tablet (icon-only), desktop (expanded) automatically via SidebarProvider
  - **Files**: `src/components/admin/admin-layout.tsx` (rewrite)
  - **Done when**: Admin layout uses SidebarProvider; sidebar responsive at all breakpoints; mobile shows drawer, tablet shows icon-only, desktop shows full sidebar
  - **Verify**: `npm run build`
  - **Commit**: `refactor(admin): replace custom layout with SidebarProvider wrapper`
  - _Requirements: FR-2, AC-2.5, AC-2.7_
  - _Design: AdminLayoutWrapper_

- [x] 2.10 [VERIFY] Quality checkpoint: full sidebar system
  - **Do**: Run full quality suite. Verify both public and admin sidebars work. Dev server starts clean.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. Public sidebar with category tree renders. Admin sidebar with 20 tabs in groups renders. Tab switching works. Responsive behavior correct at all breakpoints.
  - **Commit**: `chore(quality): pass Phase 2 full sidebar system checkpoint` (only if fixes needed)

## Phase 3: Missing Admin Tabs

Focus: Build 6 new admin tab UIs consuming existing APIs, register them in admin/page.tsx. One tab per task.

- [x] 3.1 Build ExportTab admin component
  - **Do**:
    1. Create `src/components/admin/tabs/export-tab.tsx`
    2. `"use client"`, named export `ExportTab`
    3. Format selector: `RadioGroup` with JSON, CSV, Markdown options
    4. Category filter: dropdown using `useQuery` for categories list
    5. "Export" button triggers `fetch('/api/admin/export?format=...')` via `useMutation`
    6. Progress indicator via mutation `isPending` state
    7. Download: create Blob from response, trigger `URL.createObjectURL` + click download link
    8. Skeleton loading state, error state with `text-destructive` message
    9. Follow existing tab patterns: `useQuery` for data, `Skeleton` for loading
  - **Files**: `src/components/admin/tabs/export-tab.tsx` (new)
  - **Done when**: Tab renders format selector, category filter, export button; export triggers file download
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Export tab with format selector and file download`
  - _Requirements: FR-7, AC-3.1 through AC-3.5_
  - _Design: ExportTab_

- [x] 3.2 Build DatabaseTab admin component + seed API
  - **Do**:
    1. Create `src/app/api/admin/database/seed/route.ts`: POST handler with `withAdmin` middleware. Imports Prisma client. Runs seed logic (import from existing `prisma/seed.ts` pattern or execute `npx prisma db seed`). Returns `apiSuccess({ message: "Seed complete" })`
    2. Create `src/components/admin/tabs/database-tab.tsx`
    3. `"use client"`, named export `DatabaseTab`
    4. Fetch stats via `useQuery(["admin", "stats"])` (reuse existing `/api/admin/stats` endpoint for model counts)
    5. Display table grid: model name, row count using Card grid
    6. Seed button with `ConfirmDialog` (existing component at `src/components/admin/dialogs/confirm-dialog.tsx`): "This will seed the database. Are you sure?" with destructive variant
    7. Seed triggers `useMutation` calling `POST /api/admin/database/seed`
    8. Connection status badge (hardcode "Connected" for POC)
  - **Files**: `src/app/api/admin/database/seed/route.ts` (new), `src/components/admin/tabs/database-tab.tsx` (new)
  - **Done when**: Tab shows table stats, seed button with confirmation dialog works
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Database tab with stats display and seed endpoint`
  - _Requirements: FR-8, AC-4.1 through AC-4.4_
  - _Design: DatabaseTab_

- [x] 3.3 Build ValidationTab admin component
  - **Do**:
    1. Create `src/components/admin/tabs/validation-tab.tsx`
    2. `"use client"`, named export `ValidationTab`
    3. "Run Validation" button triggers `useMutation` calling `POST /api/admin/export/validate`
    4. Results displayed as data table (use `@tanstack/react-table` already installed): columns for resource name, issue type, severity (Badge with color), message, action button
    5. Filter by issue type via dropdown above table
    6. Skeleton loading during validation run
    7. Empty state: "No validation issues found" with checkmark icon
  - **Files**: `src/components/admin/tabs/validation-tab.tsx` (new)
  - **Done when**: Tab renders validation button, results table with filters, severity badges
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Validation tab with results table and severity filters`
  - _Requirements: FR-9, AC-5.1 through AC-5.5_
  - _Design: ValidationTab_

- [ ] 3.4 [VERIFY] Quality checkpoint: first 3 admin tabs
  - **Do**: Run lint, typecheck, build to catch issues early after creating 3 new tab components + 1 API route.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All 3 commands pass with zero errors
  - **Commit**: `chore(quality): pass admin tabs batch 1 checkpoint` (only if fixes needed)

- [ ] 3.5 Build LinkHealthTab admin component
  - **Do**:
    1. Create `src/components/admin/tabs/link-health-tab.tsx`
    2. `"use client"`, named export `LinkHealthTab`
    3. Summary cards row using `StatCard`: Total Links, Healthy, Broken, Timeout (fetched via `useQuery` calling `GET /api/admin/link-health`)
    4. "Check All Links" button triggers `useMutation` calling `POST /api/admin/link-health`
    5. Results DataTable: URL (truncated, link), status code, last checked (formatted), response time (ms), status badge (healthy=green, broken=red, redirect=yellow, timeout=orange)
    6. Filter by status via dropdown
    7. Quick action column: "Disable" button for broken resources
  - **Files**: `src/components/admin/tabs/link-health-tab.tsx` (new)
  - **Done when**: Tab shows health summary cards, check button, results table with status filtering
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Link Health tab with status dashboard and batch check`
  - _Requirements: FR-10, AC-6.1 through AC-6.6_
  - _Design: LinkHealthTab_

- [ ] 3.6 Build AuditTab admin component
  - **Do**:
    1. Create `src/components/admin/tabs/audit-tab.tsx`
    2. `"use client"`, named export `AuditTab`
    3. Fetch via `useQuery` calling `GET /api/admin/audit?page=1&limit=50`
    4. DataTable: timestamp (formatted with `date-fns`), user (performedById), action (Badge), target resource title, details (expandable)
    5. Filter row: action type dropdown, date range (use `react-day-picker` already installed)
    6. Pagination using existing `PaginationControls` pattern or simple prev/next buttons
    7. Handle null resource gracefully (system actions)
  - **Files**: `src/components/admin/tabs/audit-tab.tsx` (new)
  - **Done when**: Tab shows chronological audit log with filters and pagination
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Audit Log tab with chronological table and filters`
  - _Requirements: FR-11, AC-7.1 through AC-7.5_
  - _Design: AuditTab_

- [ ] 3.7 Build ResearchTab admin component
  - **Do**:
    1. Create `src/components/admin/tabs/research-tab.tsx`
    2. `"use client"`, named export `ResearchTab`
    3. Split layout using `react-resizable-panels` (already installed): left panel = job list, right panel = selected job detail
    4. Job list: fetch via `useQuery(["admin", "research", "jobs"])` calling `GET /api/admin/research/jobs`. Show: status badge, type, created date, findings count
    5. "Start Research" button triggers `useMutation` calling `POST /api/admin/research/jobs`
    6. Job detail panel: shows findings for selected job, fetched via `GET /api/admin/research/jobs/[id]/report`
    7. Cost dashboard section: fetch `GET /api/admin/research/costs?days=30`. Display total cost, daily breakdown using `StatCard` components
    8. State for selectedJobId to track which job is expanded
  - **Files**: `src/components/admin/tabs/research-tab.tsx` (new)
  - **Done when**: Tab shows job list, job detail panel, cost dashboard, start research button
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): add Research tab with job management and cost dashboard`
  - _Requirements: FR-12, AC-8.1 through AC-8.6_
  - _Design: ResearchTab_

- [ ] 3.8 Register 6 new tabs in admin page
  - **Do**:
    1. In `src/app/admin/page.tsx`: Add 6 new lazy imports following existing pattern:
       ```
       const ExportTab = lazy(() => import("@/components/admin/tabs/export-tab").then((m) => ({ default: m.ExportTab })))
       const DatabaseTab = lazy(() => import("@/components/admin/tabs/database-tab").then((m) => ({ default: m.DatabaseTab })))
       const ValidationTab = lazy(() => import("@/components/admin/tabs/validation-tab").then((m) => ({ default: m.ValidationTab })))
       const LinkHealthTab = lazy(() => import("@/components/admin/tabs/link-health-tab").then((m) => ({ default: m.LinkHealthTab })))
       const AuditTab = lazy(() => import("@/components/admin/tabs/audit-tab").then((m) => ({ default: m.AuditTab })))
       const ResearchTab = lazy(() => import("@/components/admin/tabs/research-tab").then((m) => ({ default: m.ResearchTab })))
       ```
    2. Add 6 entries to `TAB_COMPONENTS` record:
       ```
       export: ExportTab,
       database: DatabaseTab,
       validation: ValidationTab,
       "link-health": LinkHealthTab,
       audit: AuditTab,
       research: ResearchTab,
       ```
  - **Files**: `src/app/admin/page.tsx` (modify)
  - **Done when**: All 20 tabs accessible via `?tab=` URL param; lazy loading works for all 6 new tabs
  - **Verify**: `npm run build`
  - **Commit**: `feat(admin): register 6 new tab components in admin page`
  - _Requirements: FR-13, AC-2.7_
  - _Design: TAB_COMPONENTS registry_

- [ ] 3.9 [VERIFY] Quality checkpoint: all 20 admin tabs
  - **Do**: Run full quality suite. Verify all 20 tab keys resolve to components in the TAB_COMPONENTS record.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. All 20 admin tabs compile and build successfully.
  - **Commit**: `chore(quality): pass Phase 3 all admin tabs checkpoint` (only if fixes needed)

## Phase 4: Variation B Implementation (shadcn Blocks - Default)

Focus: Build Variation B first (fastest path). Apply shadcn cyberpunk theme, compose sidebar from blocks, ensure all pages render correctly with variation-b tokens.

- [ ] 4.1 Apply shadcn cyberpunk theme tokens to Variation B CSS
  - **Do**:
    1. Use shadcn MCP `get_theme` tool to fetch cyberpunk theme CSS
    2. Merge any additional theme tokens into `src/styles/variation-b.css` beyond the layout tokens already defined
    3. Ensure `[data-variation="b"]` tokens complement (not conflict with) `[data-theme="cyberpunk"]` tokens in globals.css
    4. Variation B tokens control layout (sidebar width, spacing, typography scale); theme tokens control colors
    5. Verify no CSS specificity conflicts between theme and variation selectors
  - **Files**: `src/styles/variation-b.css` (modify)
  - **Done when**: Variation B CSS has complete token set; no visual conflicts with cyberpunk theme
  - **Verify**: `npm run build`
  - **Commit**: `feat(variation-b): apply cyberpunk theme tokens to Variation B CSS`
  - _Requirements: FR-19, AC-11.3_
  - _Design: CSS Token Architecture_

- [ ] 4.2 Apply variation tokens to AppSidebar and AdminSidebar
  - **Do**:
    1. Update `src/components/sidebar/app-sidebar.tsx`: Replace hardcoded widths/spacing with CSS variable references. Use `w-[var(--sidebar-width)]` or inline styles for sidebar width. Nav item height via `h-[var(--nav-item-height)]`. Header height via `h-[var(--sidebar-header-height)]`
    2. Update `src/components/admin/admin-sidebar.tsx`: Same token application for consistency
    3. Update `src/components/sidebar/category-tree.tsx`: Apply `--transition-duration` to Collapsible animations
    4. Verify all 3 variations render the sidebar with their respective token values
  - **Files**: `src/components/sidebar/app-sidebar.tsx` (modify), `src/components/admin/admin-sidebar.tsx` (modify), `src/components/sidebar/category-tree.tsx` (modify)
  - **Done when**: Sidebar dimensions change when switching variations via `?variation=a|b|c`
  - **Verify**: `npx tsc --noEmit && npm run build`
  - **Commit**: `feat(variation): apply CSS tokens to sidebar components for variation-aware rendering`
  - _Requirements: FR-3, FR-4, AC-13.4_
  - _Design: CSS Token Architecture, Single component tree_

- [ ] 4.3 Apply variation tokens to content layouts
  - **Do**:
    1. Update `src/app/(public)/layout.tsx`: Content area uses `max-w-[var(--content-max-width)]` for width constraint
    2. Update card-based layouts across pages: apply `p-[var(--card-padding)]`, `gap-[var(--card-gap)]` where card grids exist
    3. Apply heading scale: CSS calc using `--heading-scale` for h1/h2/h3 font sizes
    4. Apply `--font-weight-heading` to heading elements
    5. These changes are light-touch - using CSS variables in existing utility classes
  - **Files**: `src/app/(public)/layout.tsx` (modify), `src/app/globals.css` (modify - add base heading styles using variation tokens)
  - **Done when**: Content area, cards, and headings resize when switching variations
  - **Verify**: `npm run build`
  - **Commit**: `feat(variation): apply CSS tokens to content layouts and typography`
  - _Requirements: FR-3, FR-4, FR-5_
  - _Design: CSS Token Architecture_

- [ ] 4.4 [VERIFY] Quality checkpoint: Variation B complete
  - **Do**: Run full quality suite. Verify Variation B renders correctly on all key pages (home, categories, resource detail, admin). Check that variation switching between A/B/C changes layout tokens.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. Variation B is the fully functional default. Variation A and C show different spacing/sizing via their tokens.
  - **Commit**: `chore(quality): pass Phase 4 Variation B checkpoint` (only if fixes needed)

## Phase 5: Variation A (Pro Audit Redesign)

Focus: Expert design refinements to Variation A tokens - improved hierarchy, typography, whitespace, interaction states. Same components, different visual treatment via CSS tokens.

- [ ] 5.1 Refine Variation A CSS tokens for pro design
  - **Do**:
    1. Update `src/styles/variation-a.css` with enhanced design tokens:
       - Larger heading scale (1.333 Perfect Fourth) for stronger hierarchy
       - More generous card padding (24px) and gaps (16px) for whitespace
       - Taller nav items (40px) for touch-friendliness
       - 200ms transitions for smooth interactions
       - Font weight 700 for bold headings
    2. Add Variation A-specific refinements: enhanced focus ring styles, improved hover states with subtle background shifts, better active state indicators (left border accent on sidebar items)
    3. Add typography refinements: letter-spacing adjustments for headings, line-height tuning for body text
    4. Keep within `[data-variation="a"]` selector scope - no component changes
  - **Files**: `src/styles/variation-a.css` (modify)
  - **Done when**: Variation A shows noticeably improved visual hierarchy, whitespace, and interaction states compared to B
  - **Verify**: `npm run build`
  - **Commit**: `feat(variation-a): refine CSS tokens for pro audit redesign`
  - _Requirements: FR-18, AC-10.2, AC-10.3, AC-10.4_
  - _Design: Variation A (Pro Audit)_

- [ ] 5.2 [VERIFY] Quality checkpoint: Variation A
  - **Do**: Run full quality suite. Start dev server, switch to `?variation=a`, verify visual differences from B.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. Variation A renders with distinct pro design treatment.
  - **Commit**: `chore(quality): pass Variation A checkpoint` (only if fixes needed)

## Phase 6: Variation C (Stitch MCP Generated)

Focus: Generate screens via Stitch MCP, extract design tokens, apply to Variation C CSS. Same components, AI-generated visual treatment.

- [ ] 6.1 Generate Stitch MCP screens and extract tokens
  - **Do**:
    1. Use Stitch MCP `generate_screen_from_text` with project ID `14908959412283318545`
    2. Generate home screen (desktop): prompt includes design system constraints (OKLCH colors, JetBrains Mono, 0px radius, cyberpunk aesthetic, sidebar layout)
    3. Generate admin dashboard screen (desktop)
    4. Extract visual tokens from generated screens: spacing, sizing, weight values
    5. Document extracted tokens for Variation C
  - **Files**: None modified directly (Stitch generates in its project)
  - **Done when**: At least 2 screens generated; design tokens extracted
  - **Verify**: `echo "Stitch screens generated and tokens extracted"`
  - **Commit**: None (research/generation step)
  - _Requirements: FR-20, AC-12.1, AC-12.2_
  - _Design: Variation C (Stitch)_

- [ ] 6.2 Apply Stitch-derived tokens to Variation C CSS
  - **Do**:
    1. Update `src/styles/variation-c.css` with tokens extracted from Stitch generation
    2. Key differentiators from A and B: smaller sidebar (260px), thicker borders (2px), taller nav items (44px), larger sidebar header (72px), slower transitions (250ms), extra bold headings (800)
    3. Add any Stitch-specific visual refinements: glow effects, border treatments, shadow patterns (if generated)
    4. Keep within `[data-variation="c"]` selector scope
  - **Files**: `src/styles/variation-c.css` (modify)
  - **Done when**: Variation C shows distinct AI-generated visual treatment
  - **Verify**: `npm run build`
  - **Commit**: `feat(variation-c): apply Stitch MCP-derived design tokens`
  - _Requirements: FR-20, AC-12.2, AC-12.3_
  - _Design: Variation C (Stitch)_

- [ ] 6.3 [VERIFY] Quality checkpoint: all 3 variations
  - **Do**: Run full quality suite. Verify all 3 variations render distinctly. Start dev server, switch between `?variation=a`, `?variation=b`, `?variation=c`.
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass. All 3 variations render with distinct visual treatments. Same components, different tokens.
  - **Commit**: `chore(quality): pass all 3 variations checkpoint` (only if fixes needed)

## Phase 7: AI Recommendations Panel

Focus: Add AI recommendations panel to public resource detail pages, consuming existing recommendation API.

- [ ] 7.1 Add AI Recommendations panel to resource pages
  - **Do**:
    1. Create `src/components/resources/recommendations-panel.tsx`: `"use client"` component
    2. Fetch recommendations via `useQuery(["recommendations", resourceId])` calling existing recommendation API endpoint
    3. Display 5-10 recommended resource cards with: title, category badge, relevance indicator
    4. Feedback buttons: thumbs up / thumbs down per recommendation
    5. Loading skeleton, empty state ("No recommendations yet"), error handling
    6. Integrate into resource detail page: add panel below or beside main resource content
  - **Files**: `src/components/resources/recommendations-panel.tsx` (new), resource detail page (modify to include panel)
  - **Done when**: Resource detail pages show AI recommendations with feedback buttons
  - **Verify**: `npx tsc --noEmit && npm run build`
  - **Commit**: `feat(resources): add AI recommendations panel with feedback buttons`
  - _Requirements: FR-15, AC-9.1 through AC-9.5_
  - _Design: AI Recommendations_

## Phase 8: Functional Validation

Focus: Real browser validation using dev server + Puppeteer MCP. Screenshots at all 4 breakpoints for key pages across all 3 variations.

- [ ] 8.1 Validate public pages across all variations
  - **Do**:
    1. Start dev server: `npm run dev`
    2. For each variation (a, b, c) and each page (home `/`, categories `/categories`, resource detail `/resources/1`, journeys `/journeys`, about `/about`):
       - Navigate via Puppeteer MCP to `http://localhost:3000{page}?variation={v}`
       - Capture screenshots at 375px, 768px, 1024px, 1440px widths
       - Save to `specs/web-v3-audit/evidence/screenshots/variation-{v}/`
    3. Verify: sidebar visible at 1024px+, collapsed at 768px, drawer on 375px
    4. Verify: category tree renders with expandable nodes
    5. Verify: variation switcher floats in bottom-right
  - **Files**: Screenshots saved to `specs/web-v3-audit/evidence/screenshots/`
  - **Done when**: 60 screenshots captured (5 pages x 3 variations x 4 breakpoints)
  - **Verify**: `ls specs/web-v3-audit/evidence/screenshots/variation-b/ | wc -l` shows files
  - **Commit**: `docs(evidence): capture public page screenshots across all variations`
  - _Requirements: FR-22, AC-1.8, AC-14.7, AC-15.1, AC-15.2_
  - _Design: Validation Strategy_

- [ ] 8.2 Validate all 20 admin tabs across variations
  - **Do**:
    1. For each variation (a, b, c) and each of 20 admin tabs:
       - Navigate via Puppeteer MCP to `http://localhost:3000/admin?tab={tab}&variation={v}`
       - Capture screenshot at 1024px width (desktop)
       - Verify tab content renders (not error state)
    2. For each new tab (export, database, validation, link-health, audit, research):
       - Verify interactive elements render (buttons, tables, forms)
    3. Save screenshots with convention: `admin-{tab}-{variation}-1024.png`
  - **Files**: Screenshots saved to `specs/web-v3-audit/evidence/screenshots/`
  - **Done when**: 60 admin tab screenshots captured (20 tabs x 3 variations)
  - **Verify**: `ls specs/web-v3-audit/evidence/screenshots/ | grep admin | wc -l` shows 60+ files
  - **Commit**: `docs(evidence): capture admin tab screenshots across all variations`
  - _Requirements: FR-13, FR-22, AC-2.8, AC-15.3_
  - _Design: Validation Strategy_

- [ ] 8.3 Validate responsive behavior and interaction flows
  - **Do**:
    1. Test sidebar collapse/expand at tablet breakpoint (768px) via Puppeteer
    2. Test mobile drawer open/close at 375px
    3. Test admin tab switching - navigate between 5+ tabs, verify content loads
    4. Test variation switching - switch from B to A to C, verify layout changes
    5. Test category tree expand/collapse in sidebar
    6. Capture before/after screenshots for each interaction
  - **Files**: Screenshots saved to `specs/web-v3-audit/evidence/screenshots/`
  - **Done when**: All interactions verified via screenshot evidence
  - **Verify**: `ls specs/web-v3-audit/evidence/screenshots/ | wc -l` shows 130+ total files
  - **Commit**: `docs(evidence): capture interaction flow screenshots`
  - _Requirements: FR-22, FR-23, AC-14.1 through AC-14.6, AC-15.4_
  - _Design: Validation Strategy_

- [ ] 8.4 [VERIFY] Phase 8 validation checkpoint
  - **Do**: Verify all screenshot evidence exists. Count files. Review key screenshots for correctness.
  - **Verify**: `find specs/web-v3-audit/evidence -name "*.png" | wc -l` shows 130+ screenshots
  - **Done when**: Screenshot evidence library complete. All pages x variations x breakpoints covered.
  - **Commit**: None (evidence verification only)

## Phase 9: Quality Gates

- [ ] 9.1 [VERIFY] Full local CI
  - **Do**: Run complete local CI suite
  - **Verify**: All commands must pass:
    - `npx eslint src/` (zero errors)
    - `npx tsc --noEmit` (zero type errors)
    - `npm run build` (zero build errors)
  - **Done when**: All 3 commands pass with zero errors
  - **Commit**: `chore(quality): pass full local CI` (only if fixes needed)

- [ ] 9.2 Verify API layer unchanged (FR-6)
  - **Do**:
    1. Run `git diff src/app/api/` to verify zero changes to existing API route handlers
    2. Only new files should appear: `src/app/api/categories/tree/route.ts` and `src/app/api/admin/database/seed/route.ts`
    3. Verify no modifications to any existing route.ts files
  - **Verify**: `git diff --name-only src/app/api/ | grep -v tree/route.ts | grep -v database/seed/route.ts | wc -l` returns 0
  - **Done when**: Zero existing API files modified
  - **Commit**: None (verification only)
  - _Requirements: FR-6_

- [ ] 9.3 Create PR and verify CI
  - **Do**:
    1. Verify on `feat/v2-rebuild` branch: `git branch --show-current`
    2. Stage all changes: specific files by directory
    3. Create commit with summary of all changes
    4. Push: `git push -u origin feat/v2-rebuild`
    5. Create PR via `gh pr create --title "feat: V3 design audit - sidebar-first layout with 3 variations" --body "..."`
  - **Verify**: `gh pr checks` shows all green (or no CI configured)
  - **Done when**: PR created, pushed, CI passing
  - **Commit**: Final commit included in PR push

- [ ] 9.4 [VERIFY] CI pipeline passes
  - **Do**: Verify GitHub Actions/CI passes after push
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: CI pipeline passes
  - **Commit**: None

- [ ] 9.5 [VERIFY] AC checklist
  - **Do**: Programmatically verify each acceptance criterion:
    1. AC-1.x: Grep for AppSidebar usage in public layout; verify sidebar primitives
    2. AC-2.x: Grep for 20 tab entries in TAB_COMPONENTS; verify collapsible groups in admin sidebar
    3. AC-3.x through AC-8.x: Verify 6 new tab files exist with correct exports
    4. AC-10.x through AC-12.x: Verify 3 variation CSS files with distinct tokens
    5. AC-13.x: Verify VariationProvider, VariationSwitcher, URL param handling
    6. AC-14.x: Verify responsive breakpoints in SidebarProvider config
    7. AC-15.x: Count screenshot evidence files
  - **Verify**: `ls src/components/admin/tabs/*.tsx | wc -l` shows 20; `ls src/styles/variation-*.css | wc -l` shows 3; `ls specs/web-v3-audit/evidence/screenshots/ | wc -l` shows 130+
  - **Done when**: All acceptance criteria confirmed met via automated checks
  - **Commit**: None

## Phase 10: PR Lifecycle

- [ ] 10.1 Address review feedback
  - **Do**: Monitor PR for review comments. Fix any issues raised. Push fixes.
  - **Verify**: `gh pr checks` after each push
  - **Done when**: All review comments addressed, CI green
  - **Commit**: `fix(review): address PR feedback` (per round)

- [ ] 10.2 Final validation sweep
  - **Do**:
    1. Re-run screenshot capture for any pages affected by review changes
    2. Verify all 3 variations still render correctly
    3. Verify build passes one final time
  - **Verify**: `npm run build && npx tsc --noEmit && npx eslint src/`
  - **Done when**: Final build passes, screenshots updated, all 3 variations functional
  - **Commit**: `chore(quality): final validation sweep` (if changes needed)

---

## Notes

### POC shortcuts taken (Phase 1-3)
- Database tab connection pool status hardcoded to "Connected" (no real pool introspection)
- Database seed endpoint may shell out to `npx prisma db seed` rather than inline seed logic
- Variation CSS tokens are approximate - exact values tuned in Phase 4-6
- Category tree loads eagerly (all nodes in one request) - fine for <100 categories
- No nuqs dependency - using native `useSearchParams` + `useRouter` for variation URL state
- VariationSwitcher uses simple Popover rather than keyboard-shortcut-driven switcher

### Production TODOs (Phase 2 refinement)
- Virtualize category tree if >200 categories
- Add keyboard shortcut (Cmd+Shift+V?) for variation switching
- Add sidebar state persistence to cookie (shadcn default may handle this)
- Consider code-splitting variation CSS files (currently all 3 loaded always)
- Add ARIA labels to all sidebar interactive elements
- Implement real connection pool status for Database tab
- Add bulk fix actions in Validation tab (currently display-only)
- Consider lazy-loading category tree on sidebar expand rather than eager fetch

### File creation summary
- **21 new files**: 4 sidebar components, 3 variation components, 3 variation CSS, 6 admin tabs, 2 API routes, 2 hooks, 1 recommendations panel
- **6 modified files**: layout.tsx, globals.css, admin/page.tsx, admin-sidebar.tsx, admin-layout.tsx, (public)/layout.tsx
- **0 deleted files** (TopBar/MobileNav imports removed from layout but files retained)
