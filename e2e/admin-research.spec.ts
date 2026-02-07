import { test, expect, type Page } from "@playwright/test"

/**
 * Research tab E2E tests.
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

/**
 * Navigate to the research admin tab via URL.
 */
async function navigateToResearchTab(page: Page): Promise<void> {
  await page.goto("/admin?tab=research")
  await page.waitForLoadState("networkidle")
}

test.describe("Admin Research Tab", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginAsAdmin(page)
    if (!loggedIn) {
      test.skip(
        true,
        "Could not log in as admin - database or admin user unavailable"
      )
    }
  })

  test("research tab loads with heading and cost dashboard section", async ({
    page,
  }) => {
    await navigateToResearchTab(page)

    // Verify the Research heading renders
    const heading = page.locator("h1", { hasText: "Research" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Verify the description text is present
    const description = page.locator("text=Manage AI-powered research jobs")
    await expect(description).toBeVisible()

    // Verify stat cards render (Jobs Completed, Total Findings)
    const jobsCompletedCard = page.locator("text=Jobs Completed")
    await expect(jobsCompletedCard).toBeVisible({ timeout: 10_000 })

    const totalFindingsCard = page.locator("text=Total Findings")
    await expect(totalFindingsCard).toBeVisible()
  })

  test('"Start Research" button opens job creation dialog', async ({
    page,
  }) => {
    await navigateToResearchTab(page)

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Research" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Find and click the "Start Research" button
    const startButton = page.locator("button", { hasText: "Start Research" })
    await expect(startButton).toBeVisible()
    await startButton.click()

    // Verify dialog opens - look for dialog content
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test("job list panel renders with header", async ({ page }) => {
    await navigateToResearchTab(page)

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Research" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Verify the Jobs panel header renders inside the resizable panel
    const jobsHeader = page.locator("h3", { hasText: "Jobs" })
    await expect(jobsHeader).toBeVisible({ timeout: 10_000 })

    // Verify either job list items exist or the empty state shows
    const emptyState = page.locator("text=No research jobs yet")
    const jobListItem = page.locator("text=total").first()

    // One of these must be visible: the "X total" count or "No research jobs yet"
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasJobCount = await jobListItem.isVisible().catch(() => false)

    expect(hasEmptyState || hasJobCount).toBe(true)
  })

  test("selecting a job in the list shows detail panel", async ({ page }) => {
    await navigateToResearchTab(page)

    // Wait for heading to confirm tab loaded
    const heading = page.locator("h1", { hasText: "Research" })
    await expect(heading).toBeVisible({ timeout: 15_000 })

    // Check if there are any jobs to select
    const emptyState = page.locator("text=No research jobs yet")
    const hasEmptyState = await emptyState
      .isVisible({ timeout: 5_000 })
      .catch(() => false)

    if (hasEmptyState) {
      // No jobs available - verify empty state is displayed and skip
      await expect(emptyState).toBeVisible()
      test.skip(true, "No research jobs exist to select")
      return
    }

    // Click the first job in the list (JobListItem is a clickable div)
    const firstJob = page
      .locator(".flex-1.overflow-y-auto")
      .locator("> div")
      .first()
    await firstJob.click()

    // Verify detail panel shows job information
    // The JobDetailPanel shows status, findings count, timeline cards
    const detailContent = page.locator("text=Status").first()
    await expect(detailContent).toBeVisible({ timeout: 10_000 })
  })
})
