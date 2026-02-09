import { chromium, type Page, type Browser } from "@playwright/test"
import fs from "fs/promises"
import path from "path"

const BASE_URL = "http://localhost:3000"
const EVIDENCE_DIR = path.resolve("specs/admin-functionality/evidence")
const ADMIN_EMAIL = "admin@test.local"
const ADMIN_PASSWORD = "password123"

const ADMIN_TABS = [
  { key: "overview", heading: "Overview" },
  { key: "resources", heading: "Resources" },
  { key: "categories", heading: "Categories" },
  { key: "subcategories", heading: "Subcategories" },
  { key: "sub-subcategories", heading: "Sub-subcategories" },
  { key: "tags", heading: "Tags" },
  { key: "edit-suggestions", heading: "Edit Suggestions" },
  { key: "enrichment", heading: "AI Enrichment" },
  { key: "research", heading: "Research" },
  { key: "github-sync", heading: "GitHub Sync" },
  { key: "export", heading: "Export" },
  { key: "validation", heading: "Validation" },
  { key: "link-health", heading: "Link Health" },
  { key: "database", heading: "Database" },
  { key: "audit", heading: "Audit Log" },
  { key: "users", heading: "Users" },
  { key: "api-keys", heading: "API Keys" },
  { key: "analytics", heading: "Analytics" },
  { key: "learning-journeys", heading: "Learning Journeys" },
  { key: "settings", heading: "Settings" },
] as const

interface TabResult {
  key: string
  heading: string
  loaded: boolean
  headingFound: boolean
  screenshotPath: string
  error?: string
  details?: string
}

interface ValidationReport {
  timestamp: string
  loginSuccess: boolean
  loginError?: string
  tabs: TabResult[]
  crud: {
    createDialogOpened: boolean
    formFilled: boolean
    submitted: boolean
    resourceVisible: boolean
    error?: string
  }
  exportTest: {
    navigated: boolean
    formatSelected: boolean
    exportTriggered: boolean
    error?: string
  }
  validationTest: {
    navigated: boolean
    buttonClicked: boolean
    resultsAppeared: boolean
    error?: string
  }
  publicPages: {
    home: { loaded: boolean; screenshotPath: string; error?: string }
    categories: Array<{ slug: string; loaded: boolean; screenshotPath: string; error?: string }>
    resources: Array<{ id: string; loaded: boolean; screenshotPath: string; error?: string }>
    sidebar: { opened: boolean; screenshotPath: string; error?: string }
    search: { opened: boolean; screenshotPath: string; error?: string }
  }
  consoleErrors: string[]
  summary: {
    totalTabs: number
    tabsLoaded: number
    tabsFailed: number
    publicPagesLoaded: number
    publicPagesFailed: number
    criticalErrors: number
  }
}

const report: ValidationReport = {
  timestamp: new Date().toISOString(),
  loginSuccess: false,
  tabs: [],
  crud: {
    createDialogOpened: false,
    formFilled: false,
    submitted: false,
    resourceVisible: false,
  },
  exportTest: {
    navigated: false,
    formatSelected: false,
    exportTriggered: false,
  },
  validationTest: {
    navigated: false,
    buttonClicked: false,
    resultsAppeared: false,
  },
  publicPages: {
    home: { loaded: false, screenshotPath: "" },
    categories: [],
    resources: [],
    sidebar: { opened: false, screenshotPath: "" },
    search: { opened: false, screenshotPath: "" },
  },
  consoleErrors: [],
  summary: {
    totalTabs: 20,
    tabsLoaded: 0,
    tabsFailed: 0,
    publicPagesLoaded: 0,
    publicPagesFailed: 0,
    criticalErrors: 0,
  },
}

const consoleErrors: string[] = []

function setupConsoleCapture(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      consoleErrors.push(text)
    }
  })
}

async function screenshot(page: Page, name: string, subdir: string = "admin"): Promise<string> {
  const filePath = path.join(EVIDENCE_DIR, subdir, `${name}.png`)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await page.screenshot({ path: filePath, fullPage: true })
  return filePath
}

async function loginAsAdmin(page: Page): Promise<boolean> {
  console.log("\n=== LOGIN FLOW ===")
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30_000 })
    console.log("  Navigated to /login")

    const emailInput = page.locator('input[id="email"]')
    const passwordInput = page.locator('input[id="password"]')

    const formVisible = await emailInput.isVisible({ timeout: 10_000 }).catch(() => false)
    if (!formVisible) {
      console.log("  ERROR: Login form not visible")
      report.loginError = "Login form not visible"
      await screenshot(page, "login-form-not-found")
      return false
    }

    await screenshot(page, "login-form", "admin")
    console.log("  Login form visible, filling credentials...")

    await emailInput.fill(ADMIN_EMAIL)
    await passwordInput.fill(ADMIN_PASSWORD)
    await screenshot(page, "login-filled", "admin")

    await page.locator('button[type="submit"]').click()
    console.log("  Submitted login form")

    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 15_000,
      })
      console.log(`  Redirected to: ${page.url()}`)
      await screenshot(page, "login-success", "admin")
      report.loginSuccess = true
      return true
    } catch {
      // Check if there's a server error message displayed
      const errorMsg = await page.locator('[class*="destructive"]').textContent().catch(() => null)
      report.loginError = errorMsg ?? "Login redirect timed out"
      console.log(`  ERROR: ${report.loginError}`)
      await screenshot(page, "login-failed", "admin")
      return false
    }
  } catch (err) {
    report.loginError = err instanceof Error ? err.message : String(err)
    console.log(`  ERROR: ${report.loginError}`)
    return false
  }
}

async function testAllAdminTabs(page: Page): Promise<void> {
  console.log("\n=== ADMIN TABS (20) ===")

  for (const tab of ADMIN_TABS) {
    const result: TabResult = {
      key: tab.key,
      heading: tab.heading,
      loaded: false,
      headingFound: false,
      screenshotPath: "",
    }

    try {
      console.log(`  [${tab.key}] Navigating...`)
      await page.goto(`${BASE_URL}/admin?tab=${tab.key}`, {
        waitUntil: "networkidle",
        timeout: 30_000,
      })
      result.loaded = true

      // Wait for heading to appear (lazy loaded tabs)
      const heading = page.locator("h1", { hasText: tab.heading })
      try {
        await heading.waitFor({ state: "visible", timeout: 15_000 })
        result.headingFound = true
        console.log(`  [${tab.key}] Heading "${tab.heading}" found`)
      } catch {
        console.log(`  [${tab.key}] WARNING: Heading "${tab.heading}" not found within timeout`)
        // Try to find any h1
        const anyH1 = await page.locator("h1").first().textContent().catch(() => null)
        if (anyH1) {
          result.details = `Found h1: "${anyH1}" instead of "${tab.heading}"`
          console.log(`  [${tab.key}] ${result.details}`)
        }
      }

      // Gather tab-specific details
      const dataRows = await page.locator("table tbody tr").count().catch(() => 0)
      const cards = await page.locator('[class*="card"]').count().catch(() => 0)
      if (dataRows > 0) {
        result.details = (result.details ? result.details + "; " : "") + `${dataRows} table rows`
      }
      if (cards > 0) {
        result.details = (result.details ? result.details + "; " : "") + `${cards} cards`
      }

      result.screenshotPath = await screenshot(page, tab.key, "admin")
      console.log(`  [${tab.key}] Screenshot saved`)
    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err)
      console.log(`  [${tab.key}] ERROR: ${result.error}`)
      try {
        result.screenshotPath = await screenshot(page, `${tab.key}-error`, "admin")
      } catch {
        // screenshot failed too
      }
    }

    report.tabs.push(result)
  }
}

async function testResourcesCrud(page: Page): Promise<void> {
  console.log("\n=== RESOURCES CRUD ===")

  try {
    // Navigate to resources tab
    await page.goto(`${BASE_URL}/admin?tab=resources`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    })

    // Wait for the tab to load
    const heading = page.locator("h1", { hasText: "Resources" })
    await heading.waitFor({ state: "visible", timeout: 15_000 })

    // Find and click "Add Resource" button
    const addButton = page.locator("button", { hasText: "Add Resource" })
    const addButtonVisible = await addButton.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!addButtonVisible) {
      console.log("  WARNING: 'Add Resource' button not found, trying 'Create' or '+' button")
      const createBtn = page.locator("button", { hasText: /Create|New|Add|\+/ }).first()
      await createBtn.click()
    } else {
      await addButton.click()
    }

    console.log("  Clicked Add Resource button")
    await screenshot(page, "crud-dialog-open", "crud")

    // Wait for dialog to appear
    const dialog = page.locator('[role="dialog"]')
    await dialog.waitFor({ state: "visible", timeout: 5_000 })
    report.crud.createDialogOpened = true
    console.log("  Dialog opened")

    // Fill the form
    const titleInput = dialog.locator('input[id="res-title"]')
    const urlInput = dialog.locator('input[id="res-url"]')
    const descInput = dialog.locator('textarea[id="res-desc"]')

    await titleInput.fill("Test Resource from Validation Script")
    await urlInput.fill("https://example.com/test-validation")
    await descInput.fill("This is a test resource created by the Playwright validation script.")

    // Select a category if available
    const categoryTrigger = dialog.locator('button[role="combobox"]').first()
    if (await categoryTrigger.isVisible().catch(() => false)) {
      await categoryTrigger.click()
      // Wait for dropdown, click first option
      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await firstOption.click()
        console.log("  Selected first category")
      }
    }

    report.crud.formFilled = true
    await screenshot(page, "crud-form-filled", "crud")
    console.log("  Form filled")

    // Submit the form
    const submitBtn = dialog.locator('button[type="submit"]')
    await submitBtn.click()
    console.log("  Submitted form")

    // Wait for dialog to close (success) or error to appear
    try {
      await dialog.waitFor({ state: "hidden", timeout: 10_000 })
      report.crud.submitted = true
      console.log("  Dialog closed (submission successful)")
      await screenshot(page, "crud-after-submit", "crud")

      // Check if the new resource appears in the table
      await page.waitForTimeout(2_000) // allow TanStack Query to refetch
      const resourceInTable = page.locator("text=Test Resource from Validation Script")
      const visible = await resourceInTable.isVisible({ timeout: 5_000 }).catch(() => false)
      report.crud.resourceVisible = visible
      if (visible) {
        console.log("  New resource visible in table")
      } else {
        console.log("  WARNING: New resource not visible in table (may be on different page)")
      }
      await screenshot(page, "crud-resource-listed", "crud")
    } catch {
      // Dialog still open - check for error
      const errorText = await dialog.locator('[class*="destructive"], [class*="error"]')
        .textContent()
        .catch(() => null)
      report.crud.error = errorText ?? "Dialog did not close after submission"
      console.log(`  ERROR: ${report.crud.error}`)
      await screenshot(page, "crud-submit-error", "crud")
    }
  } catch (err) {
    report.crud.error = err instanceof Error ? err.message : String(err)
    console.log(`  CRUD ERROR: ${report.crud.error}`)
    try {
      await screenshot(page, "crud-error", "crud")
    } catch {
      // ignore
    }
  }
}

async function testExport(page: Page): Promise<void> {
  console.log("\n=== EXPORT TEST ===")

  try {
    await page.goto(`${BASE_URL}/admin?tab=export`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    })

    const heading = page.locator("h1", { hasText: "Export" })
    await heading.waitFor({ state: "visible", timeout: 15_000 })
    report.exportTest.navigated = true
    console.log("  Export tab loaded")

    // Select Markdown format
    const markdownRadio = page.locator('button[role="radio"][value="markdown"], label:has-text("Markdown")')
    if (await markdownRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await markdownRadio.click()
      report.exportTest.formatSelected = true
      console.log("  Selected Markdown format")
    } else {
      // Try clicking the radio by id
      const radioById = page.locator("#format-markdown")
      if (await radioById.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await radioById.click()
        report.exportTest.formatSelected = true
        console.log("  Selected Markdown format (by id)")
      } else {
        console.log("  WARNING: Could not find Markdown radio button")
      }
    }

    await screenshot(page, "export-format-selected", "admin")

    // Click export button
    const exportButton = page.locator("button", { hasText: "Export" }).first()

    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 30_000 }).catch(() => null)

    await exportButton.click()
    report.exportTest.exportTriggered = true
    console.log("  Export button clicked")

    // The export uses blob URLs and programmatic download, not a real download event
    // Wait a bit for the download to trigger
    await page.waitForTimeout(5_000)

    const download = await downloadPromise
    if (download) {
      const suggestedName = download.suggestedFilename()
      const savePath = path.join(EVIDENCE_DIR, "exports", suggestedName)
      await download.saveAs(savePath)
      console.log(`  Download saved: ${suggestedName}`)
    } else {
      console.log("  NOTE: Export uses blob URL (no download event captured - this is expected for client-side blob downloads)")
    }

    await screenshot(page, "export-after-click", "admin")
  } catch (err) {
    report.exportTest.error = err instanceof Error ? err.message : String(err)
    console.log(`  EXPORT ERROR: ${report.exportTest.error}`)
    try {
      await screenshot(page, "export-error", "admin")
    } catch {
      // ignore
    }
  }
}

async function testValidation(page: Page): Promise<void> {
  console.log("\n=== VALIDATION TAB TEST ===")

  try {
    await page.goto(`${BASE_URL}/admin?tab=validation`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    })

    const heading = page.locator("h1", { hasText: "Validation" })
    await heading.waitFor({ state: "visible", timeout: 15_000 })
    report.validationTest.navigated = true
    console.log("  Validation tab loaded")

    // Click "Run Validation" button
    const runButton = page.locator("button", { hasText: "Run Validation" })
    if (await runButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await runButton.click()
      report.validationTest.buttonClicked = true
      console.log("  Clicked 'Run Validation'")

      // Wait for results - either the loading state finishes or results appear
      try {
        // Wait for the skeleton/loading to appear and then disappear
        await page.waitForTimeout(2_000)

        // Wait for either "Valid" badge, "error(s)" text, or "No validation issues" text
        const resultIndicator = page.locator(
          'text=/Valid|error\\(s\\)|No validation issues|Validation Results/'
        )
        await resultIndicator.first().waitFor({ state: "visible", timeout: 30_000 })
        report.validationTest.resultsAppeared = true
        console.log("  Validation results appeared")
      } catch {
        console.log("  WARNING: Validation results did not appear within 30s")
      }

      await screenshot(page, "validation-results", "admin")
    } else {
      console.log("  WARNING: 'Run Validation' button not found")
      await screenshot(page, "validation-no-button", "admin")
    }
  } catch (err) {
    report.validationTest.error = err instanceof Error ? err.message : String(err)
    console.log(`  VALIDATION ERROR: ${report.validationTest.error}`)
    try {
      await screenshot(page, "validation-error", "admin")
    } catch {
      // ignore
    }
  }
}

async function testPublicPages(browser: Browser): Promise<void> {
  console.log("\n=== PUBLIC PAGES ===")

  // Use a fresh context (no auth cookies) for public pages
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  setupConsoleCapture(page)

  try {
    // Home page
    console.log("  [home] Loading...")
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 })
    const homeH1 = await page.locator("h1").first().textContent().catch(() => null)
    report.publicPages.home.loaded = true
    report.publicPages.home.screenshotPath = await screenshot(page, "home", "public")
    console.log(`  [home] Loaded, h1: "${homeH1}"`)

    // Find category links from the home page
    const categoryLinks = await page.locator('a[href^="/categories/"]').all()
    const categorySlugs: string[] = []
    for (const link of categoryLinks.slice(0, 3)) {
      const href = await link.getAttribute("href")
      if (href) {
        const slug = href.replace("/categories/", "")
        if (slug && !categorySlugs.includes(slug)) {
          categorySlugs.push(slug)
        }
      }
      if (categorySlugs.length >= 3) break
    }

    // If no category links found on home, try hardcoded paths
    if (categorySlugs.length === 0) {
      categorySlugs.push("programming", "web-development", "data-science")
    }

    // Navigate to category pages
    for (const slug of categorySlugs.slice(0, 3)) {
      const catResult = { slug, loaded: false, screenshotPath: "", error: undefined as string | undefined }
      try {
        console.log(`  [category/${slug}] Loading...`)
        await page.goto(`${BASE_URL}/categories/${slug}`, {
          waitUntil: "networkidle",
          timeout: 20_000,
        })
        catResult.loaded = true
        catResult.screenshotPath = await screenshot(page, `category-${slug}`, "public")
        const catH1 = await page.locator("h1").first().textContent().catch(() => null)
        console.log(`  [category/${slug}] Loaded, h1: "${catH1}"`)
      } catch (err) {
        catResult.error = err instanceof Error ? err.message : String(err)
        console.log(`  [category/${slug}] ERROR: ${catResult.error}`)
      }
      report.publicPages.categories.push(catResult)
    }

    // Find resource links
    const resourceLinks = await page.locator('a[href^="/resources/"]').all()
    const resourceIds: string[] = []
    for (const link of resourceLinks.slice(0, 2)) {
      const href = await link.getAttribute("href")
      if (href) {
        const id = href.replace("/resources/", "")
        if (id && !resourceIds.includes(id)) {
          resourceIds.push(id)
        }
      }
    }

    // Navigate to resource pages
    for (const id of resourceIds.slice(0, 2)) {
      const resResult = { id, loaded: false, screenshotPath: "", error: undefined as string | undefined }
      try {
        console.log(`  [resource/${id}] Loading...`)
        await page.goto(`${BASE_URL}/resources/${id}`, {
          waitUntil: "networkidle",
          timeout: 20_000,
        })
        resResult.loaded = true
        resResult.screenshotPath = await screenshot(page, `resource-${id}`, "public")
        console.log(`  [resource/${id}] Loaded`)
      } catch (err) {
        resResult.error = err instanceof Error ? err.message : String(err)
        console.log(`  [resource/${id}] ERROR: ${resResult.error}`)
      }
      report.publicPages.resources.push(resResult)
    }

    // Sidebar test - go home and open sidebar
    console.log("  [sidebar] Testing...")
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20_000 })

    // The sidebar might be in a SidebarProvider, try clicking the sidebar trigger
    const sidebarTrigger = page.locator('[data-sidebar="trigger"], button[aria-label*="sidebar" i], button[aria-label*="menu" i]').first()
    if (await sidebarTrigger.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sidebarTrigger.click()
      await page.waitForTimeout(500)
      report.publicPages.sidebar.opened = true
      console.log("  [sidebar] Opened")
    } else {
      // Sidebar might already be visible on desktop viewport
      const sidebarEl = page.locator('[data-sidebar="sidebar"]').first()
      if (await sidebarEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
        report.publicPages.sidebar.opened = true
        console.log("  [sidebar] Already visible (desktop)")
      } else {
        console.log("  [sidebar] Could not find sidebar trigger")
      }
    }
    report.publicPages.sidebar.screenshotPath = await screenshot(page, "sidebar", "public")

    // Search test - try Cmd+K or click search trigger
    console.log("  [search] Testing...")
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20_000 })

    // Try keyboard shortcut first
    await page.keyboard.press("Meta+k")
    await page.waitForTimeout(500)

    // Check if search dialog opened
    const searchDialog = page.locator('[role="dialog"], [cmdk-dialog], [data-radix-dialog-content]').first()
    let searchOpened = await searchDialog.isVisible({ timeout: 3_000 }).catch(() => false)

    if (!searchOpened) {
      // Try clicking the search trigger button
      const searchBtn = page.locator('button[aria-label="Search"], button:has-text("Search database")')
        .first()
      if (await searchBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await searchBtn.click()
        await page.waitForTimeout(500)
        searchOpened = await searchDialog.isVisible({ timeout: 3_000 }).catch(() => false)
      }
    }

    report.publicPages.search.opened = searchOpened
    report.publicPages.search.screenshotPath = await screenshot(page, "search", "public")
    console.log(`  [search] ${searchOpened ? "Opened" : "Could not open"}`)

  } catch (err) {
    console.log(`  PUBLIC PAGES ERROR: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    await context.close()
  }
}

function computeSummary(): void {
  const tabsLoaded = report.tabs.filter((t) => t.loaded && t.headingFound).length
  const tabsFailed = report.tabs.filter((t) => !t.loaded || !t.headingFound).length

  let publicLoaded = 0
  let publicFailed = 0
  if (report.publicPages.home.loaded) publicLoaded++
  else publicFailed++
  for (const cat of report.publicPages.categories) {
    if (cat.loaded) publicLoaded++
    else publicFailed++
  }
  for (const res of report.publicPages.resources) {
    if (res.loaded) publicLoaded++
    else publicFailed++
  }

  // Filter critical console errors
  const criticalErrors = consoleErrors.filter(
    (e) =>
      !e.includes("Failed to fetch") &&
      !e.includes("NetworkError") &&
      !e.includes("net::ERR") &&
      !e.includes("404") &&
      !e.includes("401") &&
      !e.includes("500") &&
      !e.includes("favicon") &&
      (e.includes("React") ||
        e.includes("Uncaught") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("SyntaxError"))
  )

  report.consoleErrors = consoleErrors
  report.summary = {
    totalTabs: 20,
    tabsLoaded,
    tabsFailed,
    publicPagesLoaded: publicLoaded,
    publicPagesFailed: publicFailed,
    criticalErrors: criticalErrors.length,
  }
}

function generateMarkdownReport(): string {
  const lines: string[] = []

  lines.push("# Frontend Validation Report")
  lines.push("")
  lines.push(`**Generated:** ${report.timestamp}`)
  lines.push("")

  // Summary
  lines.push("## Summary")
  lines.push("")
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Login | ${report.loginSuccess ? "SUCCESS" : `FAILED: ${report.loginError}`} |`)
  lines.push(`| Admin Tabs Loaded | ${report.summary.tabsLoaded}/${report.summary.totalTabs} |`)
  lines.push(`| Admin Tabs Failed | ${report.summary.tabsFailed} |`)
  lines.push(`| Public Pages Loaded | ${report.summary.publicPagesLoaded} |`)
  lines.push(`| Public Pages Failed | ${report.summary.publicPagesFailed} |`)
  lines.push(`| Critical JS Errors | ${report.summary.criticalErrors} |`)
  lines.push(`| Total Console Errors | ${report.consoleErrors.length} |`)
  lines.push("")

  // Login
  lines.push("## Login Flow")
  lines.push("")
  if (report.loginSuccess) {
    lines.push("Login with admin@test.local succeeded. Redirected after form submission.")
  } else {
    lines.push(`**FAILED:** ${report.loginError}`)
  }
  lines.push("")

  // Admin Tabs
  lines.push("## Admin Tabs (20)")
  lines.push("")
  lines.push("| Tab Key | Heading | Loaded | Heading Found | Details |")
  lines.push("|---------|---------|--------|---------------|---------|")
  for (const tab of report.tabs) {
    const loadedIcon = tab.loaded ? "YES" : "NO"
    const headingIcon = tab.headingFound ? "YES" : "NO"
    const details = tab.error ?? tab.details ?? "-"
    lines.push(`| ${tab.key} | ${tab.heading} | ${loadedIcon} | ${headingIcon} | ${details} |`)
  }
  lines.push("")

  // CRUD
  lines.push("## Resources CRUD")
  lines.push("")
  lines.push(`| Step | Result |`)
  lines.push(`|------|--------|`)
  lines.push(`| Dialog Opened | ${report.crud.createDialogOpened ? "YES" : "NO"} |`)
  lines.push(`| Form Filled | ${report.crud.formFilled ? "YES" : "NO"} |`)
  lines.push(`| Submitted | ${report.crud.submitted ? "YES" : "NO"} |`)
  lines.push(`| Resource Visible | ${report.crud.resourceVisible ? "YES" : "NO"} |`)
  if (report.crud.error) {
    lines.push(`| Error | ${report.crud.error} |`)
  }
  lines.push("")

  // Export
  lines.push("## Export Test")
  lines.push("")
  lines.push(`| Step | Result |`)
  lines.push(`|------|--------|`)
  lines.push(`| Navigated | ${report.exportTest.navigated ? "YES" : "NO"} |`)
  lines.push(`| Format Selected | ${report.exportTest.formatSelected ? "YES" : "NO"} |`)
  lines.push(`| Export Triggered | ${report.exportTest.exportTriggered ? "YES" : "NO"} |`)
  if (report.exportTest.error) {
    lines.push(`| Error | ${report.exportTest.error} |`)
  }
  lines.push("")

  // Validation
  lines.push("## Validation Tab Test")
  lines.push("")
  lines.push(`| Step | Result |`)
  lines.push(`|------|--------|`)
  lines.push(`| Navigated | ${report.validationTest.navigated ? "YES" : "NO"} |`)
  lines.push(`| Button Clicked | ${report.validationTest.buttonClicked ? "YES" : "NO"} |`)
  lines.push(`| Results Appeared | ${report.validationTest.resultsAppeared ? "YES" : "NO"} |`)
  if (report.validationTest.error) {
    lines.push(`| Error | ${report.validationTest.error} |`)
  }
  lines.push("")

  // Public Pages
  lines.push("## Public Pages")
  lines.push("")
  lines.push(`### Home Page`)
  lines.push(`- Loaded: ${report.publicPages.home.loaded ? "YES" : "NO"}`)
  if (report.publicPages.home.error) {
    lines.push(`- Error: ${report.publicPages.home.error}`)
  }
  lines.push("")

  lines.push("### Category Pages")
  lines.push("")
  if (report.publicPages.categories.length === 0) {
    lines.push("No category pages tested (no links found).")
  } else {
    lines.push("| Slug | Loaded | Error |")
    lines.push("|------|--------|-------|")
    for (const cat of report.publicPages.categories) {
      lines.push(`| ${cat.slug} | ${cat.loaded ? "YES" : "NO"} | ${cat.error ?? "-"} |`)
    }
  }
  lines.push("")

  lines.push("### Resource Pages")
  lines.push("")
  if (report.publicPages.resources.length === 0) {
    lines.push("No resource pages tested (no links found).")
  } else {
    lines.push("| ID | Loaded | Error |")
    lines.push("|----|--------|-------|")
    for (const res of report.publicPages.resources) {
      lines.push(`| ${res.id} | ${res.loaded ? "YES" : "NO"} | ${res.error ?? "-"} |`)
    }
  }
  lines.push("")

  lines.push("### Sidebar")
  lines.push(`- Opened: ${report.publicPages.sidebar.opened ? "YES" : "NO"}`)
  lines.push("")

  lines.push("### Search")
  lines.push(`- Opened: ${report.publicPages.search.opened ? "YES" : "NO"}`)
  lines.push("")

  // Console Errors
  lines.push("## Console Errors")
  lines.push("")
  if (consoleErrors.length === 0) {
    lines.push("No console errors captured.")
  } else {
    lines.push(`Total: ${consoleErrors.length}`)
    lines.push("")

    // Deduplicate and show counts
    const errorCounts = new Map<string, number>()
    for (const err of consoleErrors) {
      const truncated = err.slice(0, 200)
      errorCounts.set(truncated, (errorCounts.get(truncated) ?? 0) + 1)
    }

    lines.push("| Count | Error (truncated) |")
    lines.push("|-------|-------------------|")
    for (const [err, count] of errorCounts) {
      lines.push(`| ${count} | \`${err.replace(/\|/g, "\\|").replace(/\n/g, " ")}\` |`)
    }
  }
  lines.push("")

  // Screenshot inventory
  lines.push("## Screenshots")
  lines.push("")
  lines.push("### Admin")
  for (const tab of report.tabs) {
    if (tab.screenshotPath) {
      lines.push(`- \`${path.basename(tab.screenshotPath)}\` - ${tab.key} tab`)
    }
  }
  lines.push("")
  lines.push("### Public")
  if (report.publicPages.home.screenshotPath) {
    lines.push(`- \`${path.basename(report.publicPages.home.screenshotPath)}\` - Home page`)
  }
  for (const cat of report.publicPages.categories) {
    if (cat.screenshotPath) {
      lines.push(`- \`${path.basename(cat.screenshotPath)}\` - Category: ${cat.slug}`)
    }
  }
  for (const res of report.publicPages.resources) {
    if (res.screenshotPath) {
      lines.push(`- \`${path.basename(res.screenshotPath)}\` - Resource: ${res.id}`)
    }
  }
  if (report.publicPages.sidebar.screenshotPath) {
    lines.push(`- \`${path.basename(report.publicPages.sidebar.screenshotPath)}\` - Sidebar`)
  }
  if (report.publicPages.search.screenshotPath) {
    lines.push(`- \`${path.basename(report.publicPages.search.screenshotPath)}\` - Search`)
  }
  lines.push("")

  return lines.join("\n")
}

async function main() {
  console.log("=== FRONTEND FUNCTIONAL VALIDATION ===")
  console.log(`Target: ${BASE_URL}`)
  console.log(`Evidence: ${EVIDENCE_DIR}`)
  console.log("")

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  setupConsoleCapture(page)

  try {
    // 1. Login
    const loggedIn = await loginAsAdmin(page)

    if (loggedIn) {
      // 2. All 20 Admin Tabs
      await testAllAdminTabs(page)

      // 3. Resources CRUD
      await testResourcesCrud(page)

      // 4. Export
      await testExport(page)

      // 5. Validation tab
      await testValidation(page)
    } else {
      console.log("\nSkipping admin tests - login failed")
    }

    // Close admin context
    await context.close()

    // 6. Public Pages (fresh context, no auth)
    await testPublicPages(browser)

  } finally {
    await browser.close()
  }

  // Compute summary
  computeSummary()

  // Generate and save report
  const markdownReport = generateMarkdownReport()
  const reportPath = path.join(EVIDENCE_DIR, "frontend-validation-report.md")
  await fs.writeFile(reportPath, markdownReport, "utf-8")
  console.log(`\nReport saved to: ${reportPath}`)

  // Also save raw JSON
  const jsonPath = path.join(EVIDENCE_DIR, "frontend-validation-report.json")
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf-8")
  console.log(`JSON saved to: ${jsonPath}`)

  // Print summary
  console.log("\n=== SUMMARY ===")
  console.log(`Login: ${report.loginSuccess ? "SUCCESS" : "FAILED"}`)
  console.log(`Admin Tabs: ${report.summary.tabsLoaded}/${report.summary.totalTabs} loaded`)
  console.log(`Public Pages: ${report.summary.publicPagesLoaded} loaded, ${report.summary.publicPagesFailed} failed`)
  console.log(`Console Errors: ${report.consoleErrors.length} total, ${report.summary.criticalErrors} critical`)
  console.log(`CRUD: dialog=${report.crud.createDialogOpened} filled=${report.crud.formFilled} submitted=${report.crud.submitted}`)
  console.log(`Export: ${report.exportTest.exportTriggered ? "triggered" : "not triggered"}`)
  console.log(`Validation: ${report.validationTest.resultsAppeared ? "results shown" : "no results"}`)
}

main().catch((err) => {
  console.error("FATAL ERROR:", err)
  process.exit(1)
})
