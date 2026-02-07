---
spec: web-v3-audit-followup
phase: requirements
created: 2026-02-07T08:40:00Z
---

# Requirements: V3 Audit Follow-up

## Goal

Fix the search-index 422 bug, capture persistent screenshot evidence across all pages/variations/breakpoints, and validate admin tab rendering.

## User Stories

### US-1: Fix Search Index API Error

**As a** visitor using the search feature
**I want** the search index to load all approved resources
**So that** I can find resources via fuzzy search

**Acceptance Criteria:**
- [ ] AC-1.1: `GET /api/resources?limit=500&status=approved` returns 200 (not 422)
- [ ] AC-1.2: Search index loads 718+ resources into Fuse.js index
- [ ] AC-1.3: Schema change is minimal (raise max from 100 to 500)

### US-2: Persistent Screenshot Evidence

**As an** auditor reviewing the V3 design
**I want** screenshot PNG files saved to disk for every page/variation/breakpoint
**So that** evidence persists beyond the validation session

**Acceptance Criteria:**
- [ ] AC-2.1: Public pages (home, categories, resources, about) captured at 375px, 768px, 1024px, 1440px for all 3 variations = 48 screenshots
- [ ] AC-2.2: Resource detail page captured at 1440px for all 3 variations = 3 screenshots
- [ ] AC-2.3: Admin login page captured at 1440px and 375px = 2 screenshots
- [ ] AC-2.4: All screenshots saved as PNG to `specs/web-v3-audit-followup/evidence/screenshots/`
- [ ] AC-2.5: Validation report updated with file inventory

### US-3: Admin Tab Validation (Authenticated)

**As an** auditor
**I want** to confirm all 20 admin tabs render correctly
**So that** I can verify feature parity

**Acceptance Criteria:**
- [ ] AC-3.1: If authentication is available, capture screenshots of each admin tab
- [ ] AC-3.2: If authentication is NOT available, document that admin validation requires auth setup
- [ ] AC-3.3: Admin sidebar navigation renders correctly at desktop width

### US-4: Interaction Flow Validation

**As an** auditor
**I want** before/after screenshots of key interactions
**So that** I can verify dynamic behavior works

**Acceptance Criteria:**
- [ ] AC-4.1: Variation switching: capture same page with ?variation=a, ?variation=b, ?variation=c showing layout differences
- [ ] AC-4.2: Responsive behavior: same page at 1440px and 375px showing sidebar visible vs hidden
