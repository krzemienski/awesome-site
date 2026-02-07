import puppeteer from "puppeteer"
import { mkdir } from "fs/promises"
import { join } from "path"

const BASE_URL = "http://localhost:3000"
const OUTPUT_DIR = "specs/web-v3-audit-followup/evidence/screenshots"

const VARIATIONS = ["a", "b", "c"]
const BREAKPOINTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
]

const PAGES = [
  { name: "home", path: "/" },
  { name: "categories", path: "/categories" },
  { name: "resources", path: "/resources" },
  { name: "about", path: "/about" },
]

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  let count = 0

  // Public pages across all variations and breakpoints
  for (const variation of VARIATIONS) {
    for (const pg of PAGES) {
      for (const bp of BREAKPOINTS) {
        await page.setViewport({ width: bp.width, height: bp.height })
        const url = `${BASE_URL}${pg.path}?variation=${variation}`
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
        await page.waitForSelector("body", { timeout: 5000 })
        // Wait for client hydration and API calls
        await new Promise((r) => setTimeout(r, 3000))

        const filename = `${pg.name}-${variation}-${bp.name}.png`
        await page.screenshot({
          path: join(OUTPUT_DIR, filename),
          fullPage: false,
        })
        count++
        console.log(`[${count}] ${filename}`)
      }
    }
  }

  // Resource detail at 1440px for all 3 variations
  for (const variation of VARIATIONS) {
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE_URL}/resources/1?variation=${variation}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })
    await new Promise((r) => setTimeout(r, 3000))
    const filename = `resource-detail-${variation}-1440.png`
    await page.screenshot({ path: join(OUTPUT_DIR, filename), fullPage: false })
    count++
    console.log(`[${count}] ${filename}`)
  }

  // Admin login at 1440px and 375px
  for (const bp of [
    { name: "1440", width: 1440, height: 900 },
    { name: "375", width: 375, height: 812 },
  ]) {
    await page.setViewport({ width: bp.width, height: bp.height })
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })
    await new Promise((r) => setTimeout(r, 3000))
    const filename = `admin-login-${bp.name}.png`
    await page.screenshot({ path: join(OUTPUT_DIR, filename), fullPage: false })
    count++
    console.log(`[${count}] ${filename}`)
  }

  console.log(`\nDone! ${count} screenshots captured.`)
  await browser.close()
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err)
  process.exit(1)
})
