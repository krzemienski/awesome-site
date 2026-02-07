import { test, expect, type Page } from "@playwright/test"

/**
 * Database and Link Health tab E2E tests.
 *
 * Prerequisites:
 * - A running Next.js dev server (handled by playwright.config.ts webServer)
 * - A database with an admin user (email/password auth)
 *
 * Auth strategy:
 * Same as admin-tabs.spec.ts: log in via the login form, skip gracefully if unavailable.
 */

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

  const formVisible = await emailInput
    .isVisible({ timeout: 10_000 })
    .catch(() => false)
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

test.describe("Admin Database Tab", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      test.skip(
        true,
        "Could not log in as admin - database or admin user unavailable"
      )
    }
  })

  test("database tab shows expanded stats grid", async ({ page }) => {
    await page.goto("/admin?tab=database")
    await page.waitForLoadState("networkidle")

    // Verify the Database heading renders
    const heading = page.locator("h1", { hasText: "Database" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Verify Connection Status card
    const connectionCard = page.locator("text=Connection Status")
    await expect(connectionCard).toBeVisible({ timeout: 10_000 })

    // Verify the "Connected" badge is shown
    const connectedBadge = page.locator("text=Connected")
    await expect(connectedBadge).toBeVisible()

    // Verify Table Statistics card with expanded stats grid
    const tableStatsCard = page.locator("text=Table Statistics")
    await expect(tableStatsCard).toBeVisible()

    // Verify stat items from buildModelStats are rendered
    const expectedStats = [
      "Resources",
      "Categories",
      "Subcategories",
      "Tags",
      "Users",
    ]
    for (const statName of expectedStats) {
      const statElement = page
        .locator(".rounded-lg.border", { hasText: statName })
        .first()
      await expect(statElement).toBeVisible({ timeout: 5_000 })
    }
  })

  test("seed button opens confirm dialog", async ({ page }) => {
    await page.goto("/admin?tab=database")
    await page.waitForLoadState("networkidle")

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Database" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Verify the Seed Database card is visible
    const seedCard = page.locator("text=Seed Database")
    await expect(seedCard.first()).toBeVisible()

    // Verify "Clear existing data first" checkbox is visible
    const clearCheckbox = page.locator("text=Clear existing data first")
    await expect(clearCheckbox).toBeVisible()

    // Click the "Seed Database" button
    const seedButton = page.locator("button", { hasText: "Seed Database" })
    await expect(seedButton).toBeVisible()
    await seedButton.click()

    // Verify confirm dialog opens
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Verify the dialog mentions seeding
    const dialogText = page.locator("text=seed the database")
    await expect(dialogText).toBeVisible()
  })
})

test.describe("Admin Link Health Tab", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      test.skip(
        true,
        "Could not log in as admin - database or admin user unavailable"
      )
    }
  })

  test("link health tab shows stat cards", async ({ page }) => {
    await page.goto("/admin?tab=link-health")
    await page.waitForLoadState("networkidle")

    // Verify the Link Health heading renders
    const heading = page.locator("h1", { hasText: "Link Health" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Verify description text
    const description = page.locator(
      "text=Monitor and validate resource URLs across the site"
    )
    await expect(description).toBeVisible()

    // Verify stat cards render (Total Links, Healthy, Broken, Timeout)
    const expectedCards = ["Total Links", "Healthy", "Broken", "Timeout"]
    for (const cardLabel of expectedCards) {
      const card = page.locator("text=" + cardLabel).first()
      await expect(card).toBeVisible({ timeout: 10_000 })
    }
  })

  test("trend chart renders or shows empty state", async ({ page }) => {
    await page.goto("/admin?tab=link-health")
    await page.waitForLoadState("networkidle")

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Link Health" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Either the trend chart (recharts) renders, or the empty state card shows
    // The trend chart only appears when history.length >= 2
    // The empty state shows "No link check results yet" when totalChecked === 0
    const trendChart = page.locator(".recharts-wrapper").first()
    const emptyState = page.locator("text=No link check results yet")
    const resultsCard = page.locator("text=Link Check Results")

    const hasTrendChart = await trendChart
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasResults = await resultsCard.isVisible().catch(() => false)

    // One of these must be true: chart visible, results without chart, or empty state
    expect(hasTrendChart || hasEmptyState || hasResults).toBe(true)
  })

  test('"Check All Links" button is clickable', async ({ page }) => {
    await page.goto("/admin?tab=link-health")
    await page.waitForLoadState("networkidle")

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Link Health" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Find the "Check All Links" button
    const checkButton = page.locator("button", { hasText: "Check All Links" })
    await expect(checkButton).toBeVisible({ timeout: 10_000 })

    // Verify button is enabled (not disabled)
    await expect(checkButton).toBeEnabled()

    // Verify the button has the Activity icon (it has an svg child)
    const buttonSvg = checkButton.locator("svg")
    await expect(buttonSvg).toBeVisible()
  })
})
