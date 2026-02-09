---
spec: web-v3-audit-followup
phase: design
created: 2026-02-07T08:40:00Z
---

# Design: V3 Audit Follow-up

## Architecture

No new architecture. This spec makes one minimal bug fix and captures screenshot evidence.

## Bug Fix Design

### Search Index Schema Fix

**File**: `src/features/resources/resource-schemas.ts`
**Change**: Line 72, change `.max(100)` to `.max(500)`
**Rationale**: The search-index.ts legitimately needs all resources (currently 718) to build the Fuse.js client-side search index. The 100 cap was an arbitrary safety limit that conflicts with this use case. 500 is sufficient for the current dataset and reasonable for growth.

## Evidence Capture Strategy

### Screenshot Naming Convention
```
{page}-{variation}-{width}.png
```
Examples: `home-b-1440.png`, `categories-a-375.png`, `about-c-768.png`

### Pages to Capture
| Page | URL Path | Breakpoints |
|------|----------|-------------|
| Home | `/` | 375, 768, 1024, 1440 |
| Categories | `/categories` | 375, 768, 1024, 1440 |
| Resources | `/resources` | 375, 768, 1024, 1440 |
| About | `/about` | 375, 768, 1024, 1440 |
| Resource Detail | `/resources/1` | 1440 |
| Admin Login | `/admin` | 1440, 375 |

### Variations
- `a` - Pro Audit
- `b` - shadcn Blocks (default)
- `c` - Stitch Generated

### Total Screenshots
- 4 pages x 4 breakpoints x 3 variations = 48
- 1 page x 1 breakpoint x 3 variations = 3 (resource detail)
- 1 page x 2 breakpoints x 1 variation = 2 (admin login)
- **Total: 53 screenshots minimum**

## Tools
- Puppeteer MCP for browser automation and screenshot capture
- Dev server at localhost:3000
