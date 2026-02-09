---
spec: web-v3-audit-followup
phase: research
created: 2026-02-07T08:40:00Z
---

# Research: V3 Audit Follow-up

## Context

Follow-up to `specs/web-v3-audit/` which completed 48 implementation tasks. All code compiles clean (tsc, eslint, build). This spec addresses validation gaps and one bug.

## Findings

### Bug: Search Index 422 Error

**Location**: `src/features/search/search-index.ts:22`
**Symptom**: `GET /api/resources?limit=500&status=approved` returns 422
**Root cause**: `resourceFiltersSchema` in `src/features/resources/resource-schemas.ts:72` caps `limit` at `max(100)`, but search-index requests `limit=500` to build client-side Fuse.js index
**Impact**: Search functionality silently fails (resourcesRes.ok is false, no resources indexed)
**Fix**: Raise schema limit from `max(100)` to `max(500)` - this is a bug fix, not a behavior change. The search index legitimately needs all resources for Fuse.js. Alternative: paginate in search-index.ts, but adds unnecessary complexity for <1000 resources.

### Missing Screenshot Evidence

**Finding**: `specs/web-v3-audit/evidence/screenshots/` directories exist (variation-a/, variation-b/, variation-c/) but contain 0 PNG files
**Reason**: Puppeteer MCP captures were session-only (displayed inline) and not persisted to disk
**Impact**: No persistent evidence for the validation report claims
**Fix**: Re-capture screenshots using Puppeteer MCP with explicit file save

### Validation Coverage Gaps

| Area | Previous Coverage | Gap |
|------|-------------------|-----|
| Public pages (Variation B) | 4 pages at 4 breakpoints | Complete |
| Public pages (Variation A, C) | Categories only | Missing home, resources, about |
| Admin tabs | Auth wall only | None of 20 tabs screenshotted |
| Interaction flows | None captured | Sidebar, drawer, switching |
| Resource detail | Not tested | Missing key page |

### Dev Server Observations

From `/tmp/awesome-site-dev.log`:
- Next.js 16.1.6 (Turbopack) starts in 582ms
- Middleware deprecation warning (proxy.ts) - cosmetic, not blocking
- Better Auth warns about missing GitHub/Google clientId/Secret - expected in dev
- Pages compile and render correctly (200 responses)
- Only the `limit=500` endpoint returns 422
