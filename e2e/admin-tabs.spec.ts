import { test, expect, type Page } from "@playwright/test"

/**
 * Admin tab navigation E2E tests.
 *
 * Prerequisites:
 * - A running Next.js dev server (handled by playwright.config.ts webServer)
 * - A database with an admin user (email/password auth)
 *
 * Auth strategy:
 * The middleware checks for a "better-auth.session_token" cookie.
 * We log in via the login form before tests, then reuse the auth state.
 * If no database/admin user is available, tests are skipped gracefully.
 */

/** All 20 admin tabs with their sidebar keys and expected heading text */
const ADMIN_TABS = [
  // Overview (1 item)
  { key: "overview", label: "Dashboard", heading: "Overview" },
  // Content Management (6 items)
  { key: "resources", label: "Resources", heading: "Resources" },
  { key: "categories", label: "Categories", heading: "Categories" },
  { key: "subcategories", label: "Subcategories", heading: "Subcategories" },
  { key: "sub-subcategories", label: "Sub-subcategories", heading: "Sub-subcategories" },
  { key: "tags", label: "Tags", heading: "Tags" },
  { key: "edit-suggestions", label: "Edit Suggestions", heading: "Edit Suggestions" },
  // AI & Intelligence (2 items)
  { key: "enrichment", label: "Enrichment", heading: "AI Enrichment" },
  { key: "research", label: "Research", heading: "Research" },
  // Operations (6 items)
  { key: "github-sync", label: "GitHub Sync", heading: "GitHub Sync" },
  { key: "export", label: "Export", heading: "Export" },
  { key: "validation", label: "Validation", heading: "Validation" },
  { key: "link-health", label: "Link Health", heading: "Link Health" },
  { key: "database", label: "Database", heading: "Database" },
  { key: "audit", label: "Audit", heading: "Audit Log" },
  // System (5 items)
  { key: "users", label: "Users", heading: "Users" },
  { key: "api-keys", label: "API Keys", heading: "API Keys" },
  { key: "analytics", label: "Analytics", heading: "Analytics" },
  { key: "learning-journeys", label: "Learning Journeys", heading: "Learning Journeys" },
  { key: "settings", label: "Settings", heading: "Settings" },
] as const

/** The 5 sidebar groups and their expected labels */
const SIDEBAR_GROUPS = [
  "Overview",
  "Content Management",
  "AI & Intelligence",
  "Operations",
  "System",
] as const

/**
 * Attempt to log in as admin via the login form.
 * Uses E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars.
 * Returns true if login succeeded, false otherwise.
 */
async function loginAsAdmin(page: Page): Promise<boolean> {
  const email = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com"
  const password = process.env.E2E_ADMIN_PASSWORD ?? "password123"

  await page.goto("/login")

  // Wait for login form to load
  const emailInput = page.locator('input[id="email"]')
  const passwordInput = page.locator('input[id="password"]')

  const formVisible = await emailInput.isVisible({ timeout: 10_000 }).catch(() => false)
  if (!formVisible) {
    return false
  }

  await emailInput.fill(email)
  await passwordInput.fill(password)
  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from login page
  try {
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10_000,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Navigate to an admin tab by directly going to the URL.
 * This is more reliable than clicking sidebar items for lazy-loaded tabs.
 */
async function navigateToTab(page: Page, tabKey: string): Promise<void> {
  await page.goto(`/admin?tab=${tabKey}`)
}

/**
 * Expand all collapsed sidebar groups so all menu items are visible.
 */
async function expandAllSidebarGroups(page: Page): Promise<void> {
  // Collapsible groups have data-state attribute
  const collapsedGroups = page.locator('[data-state="closed"].group\\/collapsible')
  const count = await collapsedGroups.count()

  for (let i = 0; i < count; i++) {
    const trigger = collapsedGroups.nth(i).locator("button").first()
    await trigger.click()
    // Brief wait for animation
    await page.waitForTimeout(200)
  }
}

test.describe("Admin Tab Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Attempt login - if it fails, we'll skip gracefully in individual tests
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      // Set a flag via page context; individual tests check this
      test.skip(true, "Could not log in as admin - database or admin user unavailable")
    }
  })

  test("sidebar renders with 5 groups", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")

    // Verify "Admin Panel" header in sidebar
    const sidebarHeader = page.locator("text=Admin Panel")
    await expect(sidebarHeader).toBeVisible({ timeout: 10_000 })

    // Verify all 5 group labels exist in the sidebar
    for (const groupLabel of SIDEBAR_GROUPS) {
      if (groupLabel === "Overview") {
        // Overview is a non-collapsible group; its item "Dashboard" is directly visible
        const dashboardItem = page.locator('[data-sidebar="menu-button"]', { hasText: "Dashboard" })
        await expect(dashboardItem).toBeVisible()
      } else {
        const groupElement = page.locator("text=" + groupLabel).first()
        await expect(groupElement).toBeVisible()
      }
    }
  })

  test("sidebar shows all 20 tab items when groups are expanded", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")

    // Expand all collapsed groups
    await expandAllSidebarGroups(page)

    // Verify each of the 20 sidebar items is visible
    for (const tab of ADMIN_TABS) {
      const menuItem = page.locator('[data-sidebar="menu-button"]', { hasText: tab.label })
      await expect(menuItem).toBeVisible({ timeout: 5_000 })
    }
  })

  // Test each of the 20 tabs individually
  for (const tab of ADMIN_TABS) {
    test(`tab "${tab.label}" loads content with heading`, async ({ page }) => {
      // Navigate directly via URL for reliability
      await navigateToTab(page, tab.key)
      await page.waitForLoadState("networkidle")

      // Wait for lazy-loaded content; look for the heading
      const heading = page.locator("h1", { hasText: tab.heading })
      await expect(heading).toBeVisible({ timeout: 15_000 })
    })
  }

  test("clicking sidebar items switches tabs", async ({ page }) => {
    await page.goto("/admin")
    await page.waitForLoadState("networkidle")

    // Start at overview, verify heading
    const overviewHeading = page.locator("h1", { hasText: "Overview" })
    await expect(overviewHeading).toBeVisible({ timeout: 10_000 })

    // Expand Content Management group if collapsed
    await expandAllSidebarGroups(page)

    // Click "Resources" in sidebar
    const resourcesButton = page.locator('[data-sidebar="menu-button"]', { hasText: "Resources" })
    await resourcesButton.click()

    // Verify URL changed
    await page.waitForURL(/tab=resources/)

    // Verify Resources heading appears
    const resourcesHeading = page.locator("h1", { hasText: "Resources" })
    await expect(resourcesHeading).toBeVisible({ timeout: 15_000 })
  })

  test("lazy loading renders tabs without errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text())
      }
    })

    // Visit 5 different tabs to exercise lazy loading
    const tabsToTest = ["overview", "resources", "enrichment", "database", "settings"]
    for (const tabKey of tabsToTest) {
      await navigateToTab(page, tabKey)
      await page.waitForLoadState("networkidle")

      // Wait for heading to confirm tab loaded
      const tab = ADMIN_TABS.find((t) => t.key === tabKey)
      if (tab) {
        const heading = page.locator("h1", { hasText: tab.heading })
        await expect(heading).toBeVisible({ timeout: 15_000 })
      }
    }

    // Filter out noise: network errors from missing API data are expected
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("Failed to fetch") &&
        !e.includes("NetworkError") &&
        !e.includes("net::ERR") &&
        !e.includes("404") &&
        !e.includes("401") &&
        !e.includes("500")
    )

    // No React/JS errors should occur during tab loading
    const reactErrors = criticalErrors.filter(
      (e) =>
        e.includes("React") ||
        e.includes("Uncaught") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError")
    )

    expect(reactErrors).toHaveLength(0)
  })
})
