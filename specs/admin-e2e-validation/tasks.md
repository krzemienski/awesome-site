# Admin E2E Validation - Tasks

## Phase 1: Authentication & Setup
- [x] 1.1 Create admin test user (admin@test.local / TestAdmin1234)
- [x] 1.2 Promote test user to admin role in database
- [x] 1.3 Use Puppeteer to log in as admin user and verify redirect to /admin

## Phase 2: Test All 20 Admin Tabs via Puppeteer
Each tab must be navigated to, screenshot captured, and key functionality verified.

### Overview Group
- [x] 2.1 Overview/Dashboard - Navigate, verify stat cards render with real data, screenshot

### Content Management Group
- [x] 2.2 Resources - Navigate, verify data table loads with resources, test search filter, screenshot
- [x] 2.3 Categories - Navigate, verify categories table loads, screenshot
- [x] 2.4 Subcategories - Navigate, verify subcategories table loads, screenshot
- [x] 2.5 Sub-subcategories - Navigate, verify table loads, screenshot
- [x] 2.6 Tags - Navigate, verify tags table loads, screenshot

### Moderation Group
- [x] 2.7 Edit Suggestions - Navigate, verify table loads, screenshot

### AI & Intelligence Group
- [x] 2.8 Enrichment - Navigate, verify enrichment UI renders, screenshot
- [x] 2.9 Research - Navigate, verify research jobs UI renders, screenshot

### Operations Group
- [x] 2.10 GitHub Sync - Navigate, verify sync UI renders, screenshot
- [x] 2.11 Export - Navigate, test all 3 export formats (JSON/CSV/Markdown), screenshot
- [x] 2.12 Validation - Navigate, run awesome-lint validation, capture results, screenshot
- [x] 2.13 Link Health - Navigate, verify link health UI renders, screenshot
- [x] 2.14 Database - Navigate, verify connection status and table stats, screenshot
- [x] 2.15 Audit - Navigate, verify audit log table loads, screenshot

### System Group
- [x] 2.16 Users - Navigate, verify users table loads, screenshot
- [x] 2.17 API Keys - Navigate, verify API keys UI renders, screenshot
- [x] 2.18 Analytics - Navigate, verify analytics charts render, screenshot
- [x] 2.19 Learning Journeys - Navigate, verify journeys table loads, screenshot
- [x] 2.20 Settings - Navigate, verify settings form renders, screenshot

## Phase 3: Export & Awesome-Lint Validation
- [x] 3.1 Use Puppeteer to navigate to Export tab, select Markdown format, trigger export
- [x] 3.2 Capture the exported markdown content via page.evaluate()
- [x] 3.3 Save markdown to evidence file
- [x] 3.4 Run awesome-lint validation via Puppeteer on the Validation tab
- [x] 3.5 Screenshot the validation results
- [x] 3.6 Verify the markdown passes awesome-lint (or document failures)

## Phase 4: Evidence & Report
- [x] 4.1 Compile all screenshots into evidence directory
- [x] 4.2 Write validation report with findings
- [x] 4.3 Commit all evidence and report
