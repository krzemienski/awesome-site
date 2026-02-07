# Tasks: Admin Panel Feature Parity Completion

## Phase 1: Make It Work

Focus: Wire all features end-to-end. Quality-first but pragmatic -- no shortcuts on code quality, but defer polish.

### Toast Infrastructure (FR-10)

- [x] 1.1 Add Toaster to root layout and replace inline messages in export-tab
  - **Do**:
    1. Import `Toaster` from `@/components/ui/sonner` in `src/app/layout.tsx`
    2. Render `<Toaster />` inside `<ThemeProvider>`, after `<VariationSwitcher />`
    3. In `export-tab.tsx`: add `import { toast } from "sonner"`
    4. Move success feedback to `onSuccess` callback: `toast.success("Export downloaded successfully")`
    5. Move error feedback to `onError` callback: `toast.error("Export failed. Please try again.")`
    6. Delete the inline `{exportMutation.isSuccess && ...}` and `{exportMutation.isError && ...}` `<p>` elements
  - **Files**: `src/app/layout.tsx`, `src/components/admin/tabs/export-tab.tsx`
  - **Done when**: Toaster renders in root layout; export tab uses toast instead of inline text
  - **Verify**: `npx tsc --noEmit && npx eslint src/app/layout.tsx src/components/admin/tabs/export-tab.tsx`
  - **Commit**: `feat(admin): add Toaster to root layout and migrate export-tab to toast`
  - _Requirements: AC-10.1, AC-10.2, AC-10.3_
  - _Design: Toast Migration Plan_

- [x] 1.2 Replace inline messages with toasts in database, validation, settings, link-health, github-sync tabs
  - **Do**:
    1. **database-tab.tsx**: Add `import { toast } from "sonner"`. In `seedMutation` add `onSuccess: () => { toast.success("Database seeded successfully"); ... }` and `onError: (e) => toast.error(e.message)`. Delete inline `{seedMutation.isSuccess && ...}` and `{seedMutation.isError && ...}` `<p>` elements.
    2. **validation-tab.tsx**: Add `import { toast } from "sonner"`. In `validateMutation` add `onError: () => toast.error("Validation failed")`. Delete `{validateMutation.isError && ...}` `<p>` element.
    3. **settings-tab.tsx**: Add `import { toast } from "sonner"`. In `mutation` add `onSuccess: () => toast.success("Settings saved successfully")` and `onError: () => toast.error("Failed to save settings")`. Delete inline `{mutation.isSuccess && ...}` and `{mutation.isError && ...}` `<p>` elements.
    4. **link-health-tab.tsx**: Add `import { toast } from "sonner"`. In `checkMutation` add `onError: () => toast.error("Link check failed")`. In `disableMutation` add `onSuccess: () => toast.success("Resource disabled")`. Delete `{checkMutation.isError && ...}` `<p>` element.
    5. **github-sync-tab.tsx**: Add `import { toast } from "sonner"`. In `saveConfigMutation` add `onSuccess: () => toast.success("Configuration saved")` and `onError: (e) => toast.error(e.message)`. In `exportMutation` add `onSuccess` toast and `onError` toast. Delete all inline `{saveConfigMutation.isSuccess && ...}`, `{saveConfigMutation.isError && ...}`, `{exportMutation.isSuccess && ...}`, `{exportMutation.isError && ...}` elements.
  - **Files**: `src/components/admin/tabs/database-tab.tsx`, `src/components/admin/tabs/validation-tab.tsx`, `src/components/admin/tabs/settings-tab.tsx`, `src/components/admin/tabs/link-health-tab.tsx`, `src/components/admin/tabs/github-sync-tab.tsx`
  - **Done when**: All 5 tabs use `toast()` for mutation feedback; zero inline success/error `<p>` elements remain
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/database-tab.tsx src/components/admin/tabs/validation-tab.tsx src/components/admin/tabs/settings-tab.tsx src/components/admin/tabs/link-health-tab.tsx src/components/admin/tabs/github-sync-tab.tsx`
  - **Commit**: `feat(admin): migrate 5 tabs from inline messages to sonner toasts`
  - _Requirements: AC-10.2, AC-10.3, AC-10.4, AC-10.5_
  - _Design: Toast Migration Plan_

- [x] 1.3 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run quality commands and fix any issues
  - **Verify**: `npx eslint && npx tsc --noEmit`
  - **Done when**: Zero lint errors, zero type errors
  - **Commit**: `chore(admin): pass quality checkpoint` (only if fixes needed)

### Research Tab Rebuild (FR-1 through FR-5)

- [x] 1.4 Create research types and helpers
  - **Do**:
    1. Create `src/components/admin/tabs/research/` directory
    2. Create `types.ts` with readonly interfaces: `ResearchJob`, `ResearchFinding`, `CostBreakdownResponse`, `DailyCostEntry`, `JobReport`, `ApiResponse<T>`, type aliases `JobStatus`, `ResearchJobType`
    3. Create `helpers.tsx` with: `statusColor(status)`, `statusIcon(status)` (reuse logic from existing research-tab.tsx), `JOB_TYPE_LABELS` record, `SCOPE_ESTIMATES` record, `JobListItem` component (extract from existing research-tab.tsx)
    4. All interfaces must use `readonly` properties per project patterns
  - **Files**: `src/components/admin/tabs/research/types.ts`, `src/components/admin/tabs/research/helpers.tsx`
  - **Done when**: Types compile, helpers export correctly
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): create research tab types and helpers`
  - _Requirements: FR-1 through FR-5_
  - _Design: Research Tab Decomposition, File Responsibilities_

- [x] 1.5 Create CostDashboard component
  - **Do**:
    1. Create `src/components/admin/tabs/research/cost-dashboard.tsx`
    2. Use `useQuery` to fetch `GET /api/admin/research/costs?days=30`
    3. Transform `dailyUsage` array: pivot by date, spread model costs as columns for recharts
    4. Render `ChartContainer` + recharts `BarChart` with stacked bars per model (haiku/sonnet/opus)
    5. Use `ChartConfig` with `hsl(var(--chart-1))` etc. per design
    6. Render `StatCard` showing `totalCost` formatted as USD
    7. Show model breakdown summary (per-model totals)
    8. Guard: if no data, show empty state "No cost data yet"
  - **Files**: `src/components/admin/tabs/research/cost-dashboard.tsx`
  - **Done when**: CostDashboard renders BarChart from real API data with model colors
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/cost-dashboard.tsx`
  - **Commit**: `feat(admin): add research cost dashboard with recharts BarChart`
  - _Requirements: AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5_
  - _Design: CostDashboard component_

- [x] 1.6 Create JobCreationDialog component
  - **Do**:
    1. Create `src/components/admin/tabs/research/job-creation-dialog.tsx`
    2. Import Dialog, Select, Button, Input from shadcn
    3. Props: `open`, `onOpenChange`, `onSubmit`, `isLoading`, `hasActiveJob`
    4. Dialog contains: job type selector (5 types from `JOB_TYPE_LABELS`), optional config fields (resourceLimit number input, categoryFilter text input), scope estimate text from `SCOPE_ESTIMATES[selectedType]`
    5. Submit button disabled when `hasActiveJob` or `isLoading`
    6. On submit: call `onSubmit({ type, config })`, show `toast.success("Research job started")`
  - **Files**: `src/components/admin/tabs/research/job-creation-dialog.tsx`
  - **Done when**: Dialog opens, type selectable, config fields work, submit disabled when active job
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/job-creation-dialog.tsx`
  - **Commit**: `feat(admin): add research job creation dialog`
  - _Requirements: AC-3.1, AC-3.2, AC-3.3, AC-3.4, AC-3.5, AC-3.6_
  - _Design: JobCreationDialog component_

- [x] 1.7 Create FindingsList component
  - **Do**:
    1. Create `src/components/admin/tabs/research/findings-list.tsx`
    2. Props: `findings: readonly ResearchFinding[]`, `onApply: (id) => void`, `onDismiss: (id) => void`, `isApplying: boolean`, `isDismissing: boolean`
    3. Add type filter dropdown: `all | broken_link | missing_metadata | new_resource | trend`
    4. Each finding row: type badge, title, description, confidence as percentage badge (e.g., `95%`), created timestamp
    5. Apply button -> calls `onApply(finding.id)`; Dismiss button -> calls `onDismiss(finding.id)`
    6. Applied findings: show green "Applied" badge, buttons disabled
    7. Dismissed findings: show yellow "Dismissed" badge, buttons disabled
  - **Files**: `src/components/admin/tabs/research/findings-list.tsx`
  - **Done when**: Findings render with filter, apply/dismiss buttons work, status badges show
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/findings-list.tsx`
  - **Commit**: `feat(admin): add research findings list with apply/dismiss actions`
  - _Requirements: AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5, AC-2.6, AC-2.7_
  - _Design: FindingsList component_

- [x] 1.8 Create ReportViewer component
  - **Do**:
    1. Create `src/components/admin/tabs/research/report-viewer.tsx`
    2. Props: `report: JobReport | null`
    3. Render as Card with key-value pairs: Type, Total Findings, Completed At
    4. If `report.error`, show destructive Alert
    5. Guard: if `report` is null, render nothing
    6. Structured display -- NOT `JSON.stringify`
  - **Files**: `src/components/admin/tabs/research/report-viewer.tsx`
  - **Done when**: Report renders as structured Card, not raw JSON
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/report-viewer.tsx`
  - **Commit**: `feat(admin): add research report viewer component`
  - _Requirements: AC-5.1, AC-5.2, AC-5.3_
  - _Design: ReportViewer component_

- [x] 1.9 [VERIFY] Quality checkpoint: lint + typecheck
  - **Do**: Run quality commands and fix any issues
  - **Verify**: `npx eslint && npx tsc --noEmit`
  - **Done when**: Zero lint errors, zero type errors
  - **Commit**: `chore(admin): pass quality checkpoint` (only if fixes needed)

- [x] 1.10 Create JobDetailPanel component
  - **Do**:
    1. Create `src/components/admin/tabs/research/job-detail-panel.tsx`
    2. Props: `jobId: number | null`
    3. Use `useQuery` to fetch `GET /api/admin/research/jobs/{jobId}` (which returns job with findings)
    4. Use `useQuery` to fetch `GET /api/admin/research/jobs/{jobId}/report` for report data
    5. Show header: job type, id, status badge, created timestamp
    6. Processing state: show elapsed time, cancel button that calls `DELETE /api/admin/research/jobs/{jobId}`
    7. Info cards: status, findings count (same pattern as existing JobDetailPanel)
    8. Timeline card: created, started, completed timestamps
    9. Config card: display config object (existing pattern)
    10. Render `<FindingsList />` with findings from job data
    11. Render `<ReportViewer />` with report data
    12. Apply finding: `POST /api/admin/research/findings/{id}/apply` -> `toast.success("Finding applied")` -> invalidate job query
    13. Dismiss finding: `POST /api/admin/research/findings/{id}/dismiss` -> `toast.success("Finding dismissed")` -> invalidate job query
  - **Files**: `src/components/admin/tabs/research/job-detail-panel.tsx`
  - **Done when**: Detail panel fetches job + findings, shows cancel for processing, renders FindingsList and ReportViewer
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/job-detail-panel.tsx`
  - **Commit**: `feat(admin): add research job detail panel with findings and report`
  - _Requirements: AC-2.1, AC-4.1, AC-4.3, AC-5.1_
  - _Design: JobDetailPanel, FindingsList, ReportViewer integration_

- [x] 1.11 Create research index orchestrator, delete old file, update import
  - **Do**:
    1. Create `src/components/admin/tabs/research/index.tsx` (~180 lines)
    2. Orchestrator layout: header + "Start Research" button (opens JobCreationDialog), stat cards row (Jobs Completed, Total Findings, CostDashboard), ResizablePanelGroup (job list left, detail right)
    3. Use `useQuery` for `GET /api/admin/research/jobs` with `refetchInterval: 5000` when any job is processing
    4. Job creation: `useMutation` for `POST /api/admin/research/jobs` with type + config, auto-select new job on success
    5. Export `ResearchTab` as named export (matching existing pattern)
    6. Delete `src/components/admin/tabs/research-tab.tsx`
    7. Update `src/app/admin/page.tsx` lazy import: change `research-tab` path to `research/index` (keep `.then((m) => ({ default: m.ResearchTab }))` since named export is `ResearchTab`)
  - **Files**: `src/components/admin/tabs/research/index.tsx`, `src/components/admin/tabs/research-tab.tsx` (DELETE), `src/app/admin/page.tsx`
  - **Done when**: Research tab loads from new folder, shows cost dashboard + job list + detail panel with polling
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/research/ src/app/admin/page.tsx`
  - **Commit**: `feat(admin): rebuild research tab as modular folder with 8 components`
  - _Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, AC-4.2, AC-4.4_
  - _Design: Research Tab Decomposition_

- [ ] 1.12 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all three commands
  - **Commit**: `chore(admin): pass quality checkpoint after research tab rebuild` (only if fixes needed)

### Database Tab Enhancement (FR-6, FR-7)

- [ ] 1.13 Expand getDashboardStats with category/subcategory/tag/journey counts
  - **Do**:
    1. In `src/features/admin/stats-service.ts`, add to `getDashboardStats()`:
       - `prisma.category.count()` -> `totalCategories`
       - `prisma.subcategory.count()` -> `totalSubcategories`
       - `prisma.subSubcategory.count()` -> `totalSubSubcategories`
       - `prisma.tag.count()` -> `totalTags`
       - `prisma.learningJourney.count()` -> `totalJourneys`
    2. Add these 5 counts to the Promise.all and return object
    3. Keep all existing counts (totalResources, pendingResources, etc.)
  - **Files**: `src/features/admin/stats-service.ts`
  - **Done when**: `getDashboardStats()` returns all original + 5 new count fields
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): expand dashboard stats with category/tag/journey counts`
  - _Requirements: AC-7.1, AC-7.2, AC-7.3_
  - _Design: Database Enhancement_

- [ ] 1.14 Implement real database seed with clearExisting and per-entity counts
  - **Do**:
    1. In `src/app/api/admin/database/seed/route.ts`:
    2. Import `parseAwesomeListMarkdown` from `@/features/github/markdown-parser`
    3. Accept `clearExisting: boolean` from request body
    4. If `clearExisting`, delete resources, subcategories, categories, tags in dependency order (inside transaction)
    5. Fetch awesome-list markdown from GitHub (use configured repo or hardcoded `krzemienski/awesome-video` README.md)
    6. Parse with `parseAwesomeListMarkdown(markdown)`
    7. Insert parsed categories, subcategories, resources via Prisma
    8. Return detailed counts: `{ categories, subcategories, resources, tags }`
    9. Use `toast.success()` pattern in response message
  - **Files**: `src/app/api/admin/database/seed/route.ts`
  - **Done when**: POST actually imports data, returns per-entity counts, supports clearExisting
  - **Verify**: `npx tsc --noEmit && npx eslint src/app/api/admin/database/seed/route.ts`
  - **Commit**: `feat(admin): implement real database seed via awesome-list import`
  - _Requirements: AC-6.1, AC-6.2, AC-6.3_
  - _Design: Database Seed Enhancement_

- [ ] 1.15 Enhance database-tab UI: expanded stats, clearExisting checkbox, per-entity result
  - **Do**:
    1. Update `DashboardStats` interface to include `totalCategories`, `totalSubcategories`, `totalSubSubcategories`, `totalTags`, `totalJourneys`
    2. Update `buildModelStats()` to include new counts in the grid
    3. Add `clearExisting` checkbox state, pass to seed mutation body as `JSON.stringify({ clearExisting })`
    4. Add checkbox UI in the seed Card (before the button): "Clear existing data first" with Checkbox component
    5. If `clearExisting` is true, show double-confirm: first ConfirmDialog asks "Seed Database", second destructive dialog warns about data deletion
    6. On seed success, display per-entity counts from response in toast: `toast.success(\`Seeded: ${counts.categories} categories, ${counts.resources} resources\`)`
    7. Remove inline success/error `<p>` elements (already done in 1.2 but verify)
  - **Files**: `src/components/admin/tabs/database-tab.tsx`
  - **Done when**: Stats grid shows all entity counts, seed with clearExisting works, results shown in toast
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/database-tab.tsx`
  - **Commit**: `feat(admin): enhance database tab with expanded stats and real seed UI`
  - _Requirements: AC-6.4, AC-6.5, AC-6.6, AC-6.7, AC-7.1, AC-7.2, AC-7.4_
  - _Design: Database Seed Enhancement, Database Stats_

- [ ] 1.16 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all three commands
  - **Commit**: `chore(admin): pass quality checkpoint after database enhancement` (only if fixes needed)

### Link Health Enhancement (FR-8, FR-9)

- [ ] 1.17 Add history tracking to link-health-service
  - **Do**:
    1. In `src/features/admin/link-health-service.ts`, after `setSetting("linkHealth.lastResults", ...)`:
    2. Define `LinkHealthHistoryEntry` interface: `{ timestamp, totalChecked, healthy, broken, timeout }`
    3. Read existing history: `getSetting<LinkHealthHistoryEntry[]>("linkHealth.history") ?? []`
    4. Append new entry with current run stats
    5. Cap at 50 entries (slice last 50 -- FIFO)
    6. Save via `setSetting("linkHealth.history", cappedHistory, "Link health check history")`
  - **Files**: `src/features/admin/link-health-service.ts`
  - **Done when**: Each `checkLinks()` call appends summary to `linkHealth.history` settings key
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `feat(admin): track link health check history in settings`
  - _Requirements: AC-9.1_
  - _Design: Link Health History Design_

- [ ] 1.18 Create TrendChart and JobHistory components for link health
  - **Do**:
    1. Create `src/components/admin/tabs/link-health/` directory
    2. Create `trend-chart.tsx`: Props `history: LinkHealthHistoryEntry[]`. Use `ChartContainer` + recharts `AreaChart` with areas for healthy (green), broken (red), timeout (orange). Guard: `if (history.length < 2) return <p>Not enough data for trend chart</p>`
    3. Create `job-history.tsx`: Props `history: LinkHealthHistoryEntry[]`. Render as collapsible section (Collapsible from shadcn). Show each run: timestamp, total/healthy/broken/timeout counts in a compact table row.
  - **Files**: `src/components/admin/tabs/link-health/trend-chart.tsx`, `src/components/admin/tabs/link-health/job-history.tsx`
  - **Done when**: TrendChart renders AreaChart from history data, JobHistory shows collapsible past runs
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/link-health/`
  - **Commit**: `feat(admin): add link health trend chart and job history components`
  - _Requirements: AC-8.1, AC-8.2, AC-8.3, AC-8.4, AC-9.2_
  - _Design: LinkHealth TrendChart_

- [ ] 1.19 Enhance link-health-tab with chart, history, polling, and progress
  - **Do**:
    1. Import `TrendChart` and `JobHistory` from `./link-health/`
    2. Add `useQuery` for `linkHealth.history` data (fetch from `/api/admin/link-health` or add query param `?includeHistory=true` -- check if history is returned alongside results, or add a separate settings fetch)
    3. Render `<TrendChart />` above the DataTable when history has >= 2 entries
    4. Render `<JobHistory />` as collapsible section below DataTable
    5. Add `refetchInterval: 5000` to the link-health query while `checkMutation.isPending`
    6. Update button text during check: `"Checking {checked}/{total}..."` using progress from polling response
    7. On check complete, show toast: `toast.success(\`Check complete: ${healthy} healthy, ${broken} broken\`)`
  - **Files**: `src/components/admin/tabs/link-health-tab.tsx`
  - **Done when**: Trend chart shows above table, history section below, polling during check, progress text on button
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/link-health-tab.tsx`
  - **Commit**: `feat(admin): enhance link health tab with trend chart, history, and polling`
  - _Requirements: AC-8.1, AC-8.3, AC-9.2, AC-9.3, AC-9.4, AC-9.5_
  - _Design: Link Health Tab Enhancement_

- [ ] 1.20 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all three commands
  - **Commit**: `chore(admin): pass quality checkpoint after link health enhancement` (only if fixes needed)

### Polish (FR-11, FR-12, FR-13)

- [ ] 1.21 Merge Moderation sidebar group into Content Management
  - **Do**:
    1. In `src/components/admin/admin-sidebar.tsx`, move `{ key: "edit-suggestions", label: "Edit Suggestions", icon: GitPullRequest }` into the Content Management `items` array (after Tags)
    2. Remove the entire Moderation group object from `NAV_GROUPS`
    3. Result: 5 groups (Overview, Content Management, AI & Intelligence, Operations, System)
  - **Files**: `src/components/admin/admin-sidebar.tsx`
  - **Done when**: Sidebar shows 5 groups, Edit Suggestions is under Content Management
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/admin-sidebar.tsx`
  - **Commit**: `feat(admin): merge Moderation group into Content Management sidebar`
  - _Requirements: AC-11.1, AC-11.2, AC-11.3, AC-11.4_
  - _Design: Sidebar Group Consolidation_

- [ ] 1.22 Resolve audit log user IDs to names via batch lookup
  - **Do**:
    1. In `src/features/admin/audit-service.ts`, modify `listAuditLogs()`:
       - After fetching items, collect unique `performedById` values
       - Batch lookup: `prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true, email: true } })`
       - Build a `Map<string, { name, email }>` from results
       - Attach `performedBy: { name, email }` to each item before returning (or return the map alongside items)
    2. In `src/app/api/admin/audit/route.ts`: pass the enriched items to `apiPaginated()`
    3. In `src/components/admin/tabs/audit-tab.tsx`:
       - Update `AuditLogItem` interface to include `performedBy?: { name: string | null; email: string | null }`
       - Update the User column cell: display `item.performedBy?.name ?? item.performedBy?.email ?? item.performedById.slice(0, 8) + "..."`
       - Keep search on `performedById` for filter compatibility
  - **Files**: `src/features/admin/audit-service.ts`, `src/app/api/admin/audit/route.ts`, `src/components/admin/tabs/audit-tab.tsx`
  - **Done when**: Audit log User column shows names/emails, falls back to truncated UUID
  - **Verify**: `npx tsc --noEmit && npx eslint src/features/admin/audit-service.ts src/app/api/admin/audit/route.ts src/components/admin/tabs/audit-tab.tsx`
  - **Commit**: `feat(admin): resolve audit log user IDs to names via batch lookup`
  - _Requirements: AC-12.1, AC-12.2, AC-12.3, AC-12.4_
  - _Design: Audit User Resolution Detail_

- [ ] 1.23 Fix validation tab "View" action to copy line number
  - **Do**:
    1. In `src/components/admin/tabs/validation-tab.tsx`, update the actions column cell:
    2. Replace `<a href={#line-${row.original.line}}>` with a `<Button>` that calls `navigator.clipboard.writeText(String(row.original.line))` and shows `toast.success(\`Line ${row.original.line} copied to clipboard\`)`
    3. Change icon label from "View" to "Copy Line" or keep "View" with tooltip explaining it copies line number
    4. Import `toast` from `"sonner"` if not already imported
  - **Files**: `src/components/admin/tabs/validation-tab.tsx`
  - **Done when**: "View" button copies line number to clipboard and shows toast
  - **Verify**: `npx tsc --noEmit && npx eslint src/components/admin/tabs/validation-tab.tsx`
  - **Commit**: `fix(admin): replace broken View anchor with copy-line-number action`
  - _Requirements: AC-13.1, AC-13.2, AC-13.3_
  - _Design: Validation "View" fix_

- [ ] 1.24 [VERIFY] Quality checkpoint: full lint + typecheck + build
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all three commands
  - **Commit**: `chore(admin): pass quality checkpoint after polish phase` (only if fixes needed)

- [ ] 1.25 POC Checkpoint: verify all features via build
  - **Do**:
    1. Run `npm run build` to verify production build
    2. Verify no console.log in admin tabs: `grep -r "console.log" src/components/admin/tabs/ --include="*.tsx" --include="*.ts" | grep -v node_modules`
    3. Verify no inline success/error `<p>` elements remain: `grep -rn "isSuccess\|isError" src/components/admin/tabs/ --include="*.tsx" | grep -v "node_modules" | grep -v "//"`
    4. Verify research folder has 8 files: `ls src/components/admin/tabs/research/`
    5. Verify old research-tab.tsx is deleted: `test ! -f src/components/admin/tabs/research-tab.tsx`
  - **Done when**: Build passes, no console.log, no inline messages, research folder correct
  - **Verify**: `npm run build && ! grep -r "console.log" src/components/admin/tabs/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -q .`
  - **Commit**: `feat(admin): complete POC - all admin features implemented`

## Phase 2: Refactoring

- [ ] 2.1 Ensure immutable patterns and clean error handling across all new files
  - **Do**:
    1. Audit all 10 new files for mutation patterns (direct object mutation, array push, etc.)
    2. Replace any mutation with spread/new object patterns
    3. Add try/catch with descriptive error messages to all fetch calls
    4. Ensure all `useMutation` have both `onSuccess` and `onError` callbacks
    5. Verify all interfaces use `readonly` on all properties
    6. Ensure functions are < 50 lines, files < 400 lines
  - **Files**: All files in `src/components/admin/tabs/research/`, `src/components/admin/tabs/link-health/`
  - **Done when**: All new code follows immutable patterns, proper error handling
  - **Verify**: `npx eslint && npx tsc --noEmit`
  - **Commit**: `refactor(admin): enforce immutable patterns and error handling`
  - _Design: Existing Patterns to Follow_

- [ ] 2.2 Extract shared types and consolidate API response handling
  - **Do**:
    1. Check if `ApiResponse<T>` type is duplicated across files -- consolidate to a shared location if needed
    2. Ensure research types are all imported from `research/types.ts` (no inline re-declarations)
    3. Verify link health types in `link-health-service.ts` are properly exported and used in UI components
  - **Files**: `src/components/admin/tabs/research/types.ts`, related tab files
  - **Done when**: No duplicated type definitions, clean imports
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `refactor(admin): consolidate shared types and API response handling`

- [ ] 2.3 [VERIFY] Quality checkpoint: lint + typecheck + build
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint && npx tsc --noEmit && npm run build`
  - **Done when**: Zero errors across all three commands
  - **Commit**: `chore(admin): pass quality checkpoint after refactoring` (only if fixes needed)

## Phase 3: Testing

- [ ] 3.1 Create Playwright E2E test suite for admin tab navigation
  - **Do**:
    1. Create `e2e/admin-tabs.spec.ts` (or extend existing E2E setup if present)
    2. Install Playwright if not already: `npx playwright install chromium`
    3. Test: navigate to `/admin`, verify sidebar renders with 5 groups
    4. Test: click each of the 20 tab sidebar items, verify tab content loads (check for heading text)
    5. Test: verify lazy loading works (each tab renders without error)
  - **Files**: `e2e/admin-tabs.spec.ts` (or `tests/e2e/admin-tabs.spec.ts`)
  - **Done when**: Playwright tests pass for all 20 admin tabs
  - **Verify**: `npx playwright test e2e/admin-tabs.spec.ts --reporter=list`
  - **Commit**: `test(admin): add Playwright E2E tests for admin tab navigation`
  - _Requirements: NFR-1_

- [ ] 3.2 Create Playwright E2E tests for research tab flows
  - **Do**:
    1. Create `e2e/admin-research.spec.ts`
    2. Test: research tab loads cost dashboard section
    3. Test: "Start Research" button opens dialog
    4. Test: job list renders when jobs exist
    5. Test: selecting a job shows detail panel
  - **Files**: `e2e/admin-research.spec.ts`
  - **Done when**: Research tab E2E flows pass
  - **Verify**: `npx playwright test e2e/admin-research.spec.ts --reporter=list`
  - **Commit**: `test(admin): add Playwright E2E tests for research tab`
  - _Requirements: FR-1, FR-3, FR-4_

- [ ] 3.3 Create Playwright E2E tests for database and link health tabs
  - **Do**:
    1. Create `e2e/admin-database-linkhealth.spec.ts`
    2. Test: database tab shows expanded stats grid
    3. Test: seed button opens confirm dialog
    4. Test: link health tab shows stat cards
    5. Test: trend chart renders or shows empty state
    6. Test: "Check All Links" button is clickable
  - **Files**: `e2e/admin-database-linkhealth.spec.ts`
  - **Done when**: Database and link health E2E flows pass
  - **Verify**: `npx playwright test e2e/admin-database-linkhealth.spec.ts --reporter=list`
  - **Commit**: `test(admin): add Playwright E2E tests for database and link health tabs`
  - _Requirements: FR-6, FR-7, FR-8, FR-9_

- [ ] 3.4 [VERIFY] Quality checkpoint: lint + typecheck + all tests
  - **Do**: Run full quality suite including E2E
  - **Verify**: `npx eslint && npx tsc --noEmit && npx playwright test --reporter=list`
  - **Done when**: All commands pass
  - **Commit**: `chore(admin): pass quality checkpoint after E2E tests` (only if fixes needed)

## Phase 4: Quality Gates

- [ ] 4.1 [VERIFY] Full local CI: lint + typecheck + build + E2E
  - **Do**: Run complete local CI suite
  - **Verify**: All commands must pass:
    - `npx eslint` (lint)
    - `npx tsc --noEmit` (typecheck)
    - `npm run build` (build)
    - `npx playwright test --reporter=list` (E2E)
    - `! grep -rn "console.log" src/components/admin/tabs/ --include="*.tsx" --include="*.ts" | grep -q .` (no console.log)
  - **Done when**: All commands pass with zero errors
  - **Commit**: `fix(admin): address final lint/type issues` (if fixes needed)

- [ ] 4.2 Create PR and verify CI
  - **Do**:
    1. Verify current branch is a feature branch: `git branch --show-current`
    2. If on default branch, STOP and alert user
    3. Push branch: `git push -u origin $(git branch --show-current)`
    4. Create PR: `gh pr create --title "feat(admin): complete admin panel feature parity" --body "..."`
    5. PR body should summarize: toast infrastructure, research tab rebuild, database seed, link health charts, sidebar consolidation, audit user resolution, validation fix
  - **Verify**: `gh pr checks --watch` -- all checks must show passing
  - **Done when**: All CI checks green, PR ready for review
  - **If CI fails**: read `gh pr checks`, fix locally, push, re-verify

## Phase 5: PR Lifecycle

- [ ] 5.1 [VERIFY] CI pipeline passes
  - **Do**: Verify GitHub Actions/CI passes after push
  - **Verify**: `gh pr checks` shows all green
  - **Done when**: CI pipeline passes
  - **Commit**: None

- [ ] 5.2 [VERIFY] AC checklist
  - **Do**: Programmatically verify each acceptance criterion:
    1. AC-1.x (Cost Dashboard): grep for `ChartContainer`, `BarChart`, `getCostBreakdown` in research/cost-dashboard.tsx
    2. AC-2.x (Findings): grep for `applyFinding`, `dismissFinding`, type filter in findings-list.tsx
    3. AC-3.x (Job Dialog): grep for `Dialog`, job types, scope estimate in job-creation-dialog.tsx
    4. AC-4.x (Polling): grep for `refetchInterval` in research/index.tsx
    5. AC-5.x (Report): grep for `Card` (not JSON.stringify) in report-viewer.tsx
    6. AC-6.x (Seed): verify seed route imports parser, accepts clearExisting
    7. AC-7.x (Stats): verify stats-service returns category/tag/journey counts
    8. AC-8.x (Trend Chart): grep for `AreaChart`, `ChartContainer` in trend-chart.tsx
    9. AC-9.x (History): grep for `linkHealth.history` in link-health-service.ts
    10. AC-10.x (Toast): verify Toaster in layout.tsx, no inline `<p>` success/error in 6 tabs
    11. AC-11.x (Sidebar): verify 5 groups in admin-sidebar.tsx, no Moderation group
    12. AC-12.x (Audit User): verify batch user lookup in audit-service.ts
    13. AC-13.x (Validation View): verify clipboard copy in validation-tab.tsx
  - **Verify**: Run grep/verification commands for each AC
  - **Done when**: All 13 user stories' acceptance criteria confirmed met
  - **Commit**: None

- [ ] 5.3 Address PR review comments
  - **Do**: If review comments exist, fix issues, push, re-verify CI
  - **Verify**: `gh pr checks` all green after fixes
  - **Done when**: All review comments resolved, CI passes
  - **Commit**: `fix(admin): address PR review feedback`

## Notes

- **POC shortcuts taken**: None -- quality-first execution per user directive
- **Production TODOs**:
  - Budget threshold line on cost chart (deferred per requirements Out of Scope)
  - Agent log viewer for research jobs (requires backend agent orchestration not in V2)
  - Seed source toggle (GitHub markdown vs bundled fixture) -- currently GitHub-only
- **Key dependency chain**: Toast (1.1-1.2) must come first since all later features use toasts. Research types (1.4) must precede all research components. Stats service (1.13) before database-tab UI (1.15). Link health service (1.17) before trend chart UI (1.18-1.19).
- **File count**: 10 new files created, 15 existing files modified, 1 file deleted
- **All 7 research API routes already exist** -- zero backend API work needed for research
- **No DB migrations needed** -- link health history uses Settings JSON, all other tables exist
