/**
 * Post-Migration Data Verification Script
 *
 * Verifies data integrity in the target Prisma DB after running migrate-data.ts.
 * Connects to both target (DATABASE_URL) and source (SOURCE_DATABASE_URL) databases
 * to perform cross-database spot-checks.
 *
 * Checks:
 * 1. Resource count >= 2000
 * 2. Category count matches source
 * 3. Zero resources with NULL categoryId
 * 4. Every subcategoryId references valid Subcategory
 * 5. Every subSubcategoryId references valid SubSubcategory
 * 6. Spot-check: 10 random resources match title+URL between source and target
 * 7. Table count summary
 *
 * Usage: npx tsx scripts/verify-migration.ts
 * Requires: DATABASE_URL (target) and SOURCE_DATABASE_URL (source) in .env
 */

import pg from "pg";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TARGET_URL = process.env.DATABASE_URL;
const SOURCE_URL = process.env.SOURCE_DATABASE_URL;

if (!TARGET_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}
if (!SOURCE_URL) {
  console.error("ERROR: SOURCE_DATABASE_URL is not set");
  process.exit(1);
}

const target = new Pool({ connectionString: TARGET_URL, max: 3 });
const source = new Pool({ connectionString: SOURCE_URL, max: 3 });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

async function checkResourceCount(): Promise<CheckResult> {
  const { rows } = await target.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM "Resource"'
  );
  const count = parseInt(rows[0]?.count ?? "0", 10);
  return {
    name: "resource_count >= 2000",
    status: count >= 2000 ? "PASS" : "FAIL",
    detail: `${count}`,
  };
}

async function checkCategoryCountMatchesSource(): Promise<CheckResult> {
  const targetResult = await target.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM "Category"'
  );
  const sourceResult = await source.query<{ count: string }>(
    "SELECT COUNT(*) as count FROM categories"
  );
  const targetCount = parseInt(targetResult.rows[0]?.count ?? "0", 10);
  const sourceCount = parseInt(sourceResult.rows[0]?.count ?? "0", 10);
  return {
    name: "category_count matches source",
    status: targetCount === sourceCount ? "PASS" : "FAIL",
    detail: `target=${targetCount}, source=${sourceCount}`,
  };
}

async function checkNoNullCategoryId(): Promise<CheckResult> {
  const { rows } = await target.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM "Resource" WHERE "categoryId" IS NULL'
  );
  const count = parseInt(rows[0]?.count ?? "0", 10);
  return {
    name: "zero resources with NULL categoryId",
    status: count === 0 ? "PASS" : "FAIL",
    detail: `${count} resources with NULL categoryId`,
  };
}

async function checkSubcategoryFKIntegrity(): Promise<CheckResult> {
  const { rows } = await target.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "Resource" r
     WHERE r."subcategoryId" IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM "Subcategory" s WHERE s.id = r."subcategoryId"
       )`
  );
  const count = parseInt(rows[0]?.count ?? "0", 10);
  return {
    name: "every subcategoryId references valid Subcategory",
    status: count === 0 ? "PASS" : "FAIL",
    detail: `${count} orphaned subcategoryId references`,
  };
}

async function checkSubSubcategoryFKIntegrity(): Promise<CheckResult> {
  const { rows } = await target.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "Resource" r
     WHERE r."subSubcategoryId" IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM "SubSubcategory" ss WHERE ss.id = r."subSubcategoryId"
       )`
  );
  const count = parseInt(rows[0]?.count ?? "0", 10);
  return {
    name: "every subSubcategoryId references valid SubSubcategory",
    status: count === 0 ? "PASS" : "FAIL",
    detail: `${count} orphaned subSubcategoryId references`,
  };
}

async function checkSpotCheckResources(): Promise<CheckResult> {
  // Pick 10 random resources from the target and verify they exist in source with matching title+URL
  const { rows: targetRows } = await target.query<{ title: string; url: string }>(
    'SELECT title, url FROM "Resource" ORDER BY RANDOM() LIMIT 10'
  );

  let matched = 0;
  let mismatched = 0;
  const mismatches: string[] = [];

  for (const row of targetRows) {
    const { rows: sourceRows } = await source.query<{ title: string; url: string }>(
      "SELECT title, url FROM resources WHERE url = $1 LIMIT 1",
      [row.url]
    );

    if (sourceRows.length === 0) {
      mismatched++;
      mismatches.push(`URL not in source: ${row.url}`);
      continue;
    }

    const sourceRow = sourceRows[0];
    if (sourceRow && sourceRow.title === row.title) {
      matched++;
    } else {
      mismatched++;
      mismatches.push(
        `Title mismatch for ${row.url}: target="${row.title}" vs source="${sourceRow?.title}"`
      );
    }
  }

  const detail =
    mismatched > 0
      ? `${matched}/10 matched; mismatches: ${mismatches.join("; ")}`
      : `${matched}/10 matched`;

  return {
    name: "spot-check 10 random resources match title+URL",
    status: mismatched === 0 ? "PASS" : "FAIL",
    detail,
  };
}

async function getTableCounts(): Promise<Record<string, number>> {
  const tables = [
    { label: "Category", query: 'SELECT COUNT(*) as count FROM "Category"' },
    { label: "Subcategory", query: 'SELECT COUNT(*) as count FROM "Subcategory"' },
    { label: "SubSubcategory", query: 'SELECT COUNT(*) as count FROM "SubSubcategory"' },
    { label: "Tag", query: 'SELECT COUNT(*) as count FROM "Tag"' },
    { label: "Resource", query: 'SELECT COUNT(*) as count FROM "Resource"' },
    { label: "ResourceTag", query: 'SELECT COUNT(*) as count FROM "ResourceTag"' },
  ];

  const counts: Record<string, number> = {};

  for (const t of tables) {
    const { rows } = await target.query<{ count: string }>(t.query);
    counts[t.label] = parseInt(rows[0]?.count ?? "0", 10);
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Post-Migration Data Verification ===\n");

  // Test connections
  try {
    await target.query("SELECT 1");
    console.log("[OK] Connected to target database");
  } catch (err) {
    console.error("[FAIL] Cannot connect to target database:", (err as Error).message);
    process.exit(1);
  }

  try {
    await source.query("SELECT 1");
    console.log("[OK] Connected to source database\n");
  } catch (err) {
    console.error("[FAIL] Cannot connect to source database:", (err as Error).message);
    process.exit(1);
  }

  // Run all checks
  const results: CheckResult[] = [];

  console.log("--- Running integrity checks ---\n");

  results.push(await checkResourceCount());
  results.push(await checkCategoryCountMatchesSource());
  results.push(await checkNoNullCategoryId());
  results.push(await checkSubcategoryFKIntegrity());
  results.push(await checkSubSubcategoryFKIntegrity());
  results.push(await checkSpotCheckResources());

  // Print structured results
  console.log("=== Verification Results ===\n");

  let allPassed = true;
  for (const r of results) {
    const icon = r.status === "PASS" ? "PASS" : "FAIL";
    console.log(`CHECK: ${r.name} ... ${icon} (${r.detail})`);
    if (r.status === "FAIL") {
      allPassed = false;
    }
  }

  // Print table counts
  console.log("\n--- Table Counts (target) ---\n");

  const counts = await getTableCounts();
  console.log("Table              | Count");
  console.log("-------------------|--------");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table.padEnd(19)}| ${count}`);
  }

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);

  // Cleanup
  await target.end();
  await source.end();

  if (!allPassed) {
    console.log("\nVerification FAILED. Review failures above.");
    process.exit(1);
  } else {
    console.log("\nAll checks PASSED.");
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
