---
spec: web-v3-audit-followup
phase: tasks
total_tasks: 8
created: 2026-02-07T08:40:00Z
---

# Tasks: V3 Audit Follow-up

## Phase 1: Bug Fix

- [ ] 1.1 Fix search-index 422 error by raising schema limit
  - **Do**:
    1. Edit `src/features/resources/resource-schemas.ts` line 72
    2. Change `.max(100)` to `.max(500)` on the `limit` field in `resourceFiltersSchema`
    3. Verify the fix resolves the 422
  - **Files**: `src/features/resources/resource-schemas.ts` (modify)
  - **Done when**: `npx tsc --noEmit` passes; dev server returns 200 for `GET /api/resources?limit=500&status=approved`
  - **Verify**: `npx tsc --noEmit`
  - **Commit**: `fix(api): raise resource filter limit from 100 to 500 for search index`
  - _Requirements: US-1, AC-1.1, AC-1.3_

- [ ] 1.2 [VERIFY] Quality checkpoint
  - **Do**: Run full quality suite
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All commands pass with zero errors

## Phase 2: Screenshot Evidence - Public Pages

- [ ] 2.1 Capture Variation B screenshots (default)
  - **Do**:
    1. Ensure dev server running at localhost:3000
    2. Using Puppeteer MCP, for each page (/, /categories, /resources, /about):
       - Navigate to `http://localhost:3000{page}?variation=b`
       - Set viewport to 1440x900, capture screenshot
       - Set viewport to 1024x768, capture screenshot
       - Set viewport to 768x1024, capture screenshot
       - Set viewport to 375x812, capture screenshot
    3. Save all screenshots to `specs/web-v3-audit-followup/evidence/screenshots/`
    4. Naming: `{page}-b-{width}.png`
  - **Files**: 16 PNG files in evidence/screenshots/
  - **Done when**: 16 screenshots captured for Variation B

- [ ] 2.2 Capture Variation A screenshots
  - **Do**: Same as 2.1 but with `?variation=a` and `-a-` in filenames
  - **Files**: 16 PNG files
  - **Done when**: 16 screenshots captured for Variation A

- [ ] 2.3 Capture Variation C screenshots
  - **Do**: Same as 2.1 but with `?variation=c` and `-c-` in filenames
  - **Files**: 16 PNG files
  - **Done when**: 16 screenshots captured for Variation C

- [ ] 2.4 Capture resource detail and admin login
  - **Do**:
    1. Resource detail at 1440px for all 3 variations: `/resources/1?variation=a|b|c`
    2. Admin login at 1440px and 375px: `/admin`
  - **Files**: 5 PNG files
  - **Done when**: 5 additional screenshots captured

## Phase 3: Validation Report and Cleanup

- [ ] 3.1 Create validation report with evidence inventory
  - **Do**:
    1. Count all screenshot files
    2. Create `specs/web-v3-audit-followup/evidence/validation-report.md` with:
       - Screenshot inventory table
       - Bug fix verification (search index 200 response)
       - Coverage summary
    3. Commit evidence and report
  - **Files**: `specs/web-v3-audit-followup/evidence/validation-report.md` (new)
  - **Done when**: Report documents all evidence
  - **Commit**: `docs(evidence): capture 53+ screenshots across all pages and variations`

- [ ] 3.2 [VERIFY] Final quality gate
  - **Do**: Run full CI, verify all screenshots exist, push to remote
  - **Verify**: `npx eslint src/ && npx tsc --noEmit && npm run build`
  - **Done when**: All clean, evidence committed, pushed
  - **Commit**: `chore(quality): pass v3 audit follow-up quality gates`
