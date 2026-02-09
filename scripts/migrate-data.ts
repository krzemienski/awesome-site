/**
 * Data Migration Script: Legacy Drizzle DB → New Prisma DB
 *
 * Migrates content data from the legacy awesome-list-site (Drizzle ORM, snake_case tables)
 * to the new awesome-site (Prisma, PascalCase tables).
 *
 * Key transformations:
 * - Legacy resources use TEXT category/subcategory/sub_subcategory fields
 * - Target uses INTEGER FK references (categoryId, subcategoryId, subSubcategoryId)
 * - Legacy resource_tags uses composite PK; target ResourceTag uses auto-increment ID
 * - Resource status maps from text to ResourceStatus enum
 *
 * Usage: npx tsx scripts/migrate-data.ts
 * Requires: SOURCE_DATABASE_URL (legacy DB) and DATABASE_URL (target DB) in .env
 */

import pg from "pg";

const { Pool } = pg;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SOURCE_URL = process.env.SOURCE_DATABASE_URL;
const TARGET_URL = process.env.DATABASE_URL;

if (!SOURCE_URL) {
  console.error("ERROR: SOURCE_DATABASE_URL is not set");
  process.exit(1);
}
if (!TARGET_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const source = new Pool({ connectionString: SOURCE_URL, max: 3 });
const target = new Pool({ connectionString: TARGET_URL, max: 3 });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MigrationSummary {
  table: string;
  exported: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface SourceCategory {
  id: number;
  name: string;
  slug: string;
}

interface SourceSubcategory {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
}

interface SourceSubSubcategory {
  id: number;
  name: string;
  slug: string;
  subcategory_id: number | null;
}

interface SourceTag {
  id: number;
  name: string;
  slug: string;
  created_at: string | null;
}

interface SourceResource {
  id: number;
  title: string;
  url: string;
  description: string;
  category: string;
  subcategory: string | null;
  sub_subcategory: string | null;
  status: string | null;
  github_synced: boolean | null;
  last_synced_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SourceResourceTag {
  resource_id: number;
  tag_id: number;
}

// ---------------------------------------------------------------------------
// Lookup maps (slug → target ID)
// ---------------------------------------------------------------------------

// categorySlug → target ID
const categoryLookup = new Map<string, number>();
// `${categoryId}:${subcategorySlug}` → target ID
const subcategoryLookup = new Map<string, number>();
// `${subcategoryId}:${subSubcategorySlug}` → target ID
const subSubcategoryLookup = new Map<string, number>();
// tagSlug → target ID
const tagLookup = new Map<string, number>();
// sourceResourceId → target resource ID
const resourceIdMap = new Map<number, number>();

// Legacy category name → slug (from source categories table)
const categoryNameToSlug = new Map<string, string>();
// Legacy subcategory name → { slug, categoryId } (from source subcategories table)
const subcategoryNameToInfo = new Map<string, { slug: string; categoryId: number }[]>();
// Legacy subSubcategory name → { slug, subcategoryId } (from source sub_subcategories table)
const subSubcategoryNameToInfo = new Map<string, { slug: string; subcategoryId: number }[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatus(status: string | null): string {
  const valid = ["pending", "approved", "rejected", "archived"];
  if (status && valid.includes(status)) return status;
  return "approved";
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Migration functions
// ---------------------------------------------------------------------------

async function migrateCategories(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "Category", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceCategory>("SELECT id, name, slug FROM categories ORDER BY id");
  summary.exported = rows.length;

  for (const row of rows) {
    try {
      // Build name→slug map for resource FK resolution
      categoryNameToSlug.set(row.name, row.slug);

      const result = await target.query(
        `INSERT INTO "Category" (name, slug, "displayOrder")
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [row.name, row.slug, 0]
      );
      const targetId = result.rows[0]?.id as number;
      categoryLookup.set(row.slug, targetId);
      summary.imported++;
    } catch (err) {
      console.error(`  [Category] Error upserting "${row.name}":`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

async function migrateSubcategories(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "Subcategory", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceSubcategory>(
    "SELECT id, name, slug, category_id FROM subcategories ORDER BY id"
  );
  summary.exported = rows.length;

  // Build source category ID → slug map
  const sourceCatIdToSlug = new Map<number, string>();
  const catRows = await source.query<{ id: number; slug: string }>("SELECT id, slug FROM categories");
  for (const c of catRows.rows) {
    sourceCatIdToSlug.set(c.id, c.slug);
  }

  for (const row of rows) {
    try {
      if (row.category_id == null) {
        console.warn(`  [Subcategory] "${row.name}" has null category_id, skipping`);
        summary.skipped++;
        continue;
      }

      const catSlug = sourceCatIdToSlug.get(row.category_id);
      if (!catSlug) {
        console.warn(`  [Subcategory] "${row.name}" references unknown source category_id ${row.category_id}, skipping`);
        summary.skipped++;
        continue;
      }

      const targetCatId = categoryLookup.get(catSlug);
      if (targetCatId == null) {
        console.warn(`  [Subcategory] "${row.name}" — target category not found for slug "${catSlug}", skipping`);
        summary.skipped++;
        continue;
      }

      // Build name→info map for resource FK resolution
      const existing = subcategoryNameToInfo.get(row.name) ?? [];
      existing.push({ slug: row.slug, categoryId: targetCatId });
      subcategoryNameToInfo.set(row.name, existing);

      const result = await target.query(
        `INSERT INTO "Subcategory" (name, slug, "categoryId", "displayOrder")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("categoryId", slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [row.name, row.slug, targetCatId, 0]
      );
      const targetId = result.rows[0]?.id as number;
      subcategoryLookup.set(`${targetCatId}:${row.slug}`, targetId);
      summary.imported++;
    } catch (err) {
      console.error(`  [Subcategory] Error upserting "${row.name}":`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

async function migrateSubSubcategories(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "SubSubcategory", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceSubSubcategory>(
    "SELECT id, name, slug, subcategory_id FROM sub_subcategories ORDER BY id"
  );
  summary.exported = rows.length;

  // Build source subcategory ID → { slug, category_id } map
  const sourceSubIdToInfo = new Map<number, { slug: string; categoryId: number | null }>();
  const subRows = await source.query<{ id: number; slug: string; category_id: number | null }>(
    "SELECT id, slug, category_id FROM subcategories"
  );
  for (const s of subRows.rows) {
    sourceSubIdToInfo.set(s.id, { slug: s.slug, categoryId: s.category_id });
  }

  for (const row of rows) {
    try {
      if (row.subcategory_id == null) {
        console.warn(`  [SubSubcategory] "${row.name}" has null subcategory_id, skipping`);
        summary.skipped++;
        continue;
      }

      const subInfo = sourceSubIdToInfo.get(row.subcategory_id);
      if (!subInfo || subInfo.categoryId == null) {
        console.warn(`  [SubSubcategory] "${row.name}" references unknown source subcategory_id ${row.subcategory_id}, skipping`);
        summary.skipped++;
        continue;
      }

      // Find target category for this subcategory's parent
      const sourceCatIdToSlug = new Map<number, string>();
      const catRes = await source.query<{ id: number; slug: string }>("SELECT id, slug FROM categories");
      for (const c of catRes.rows) {
        sourceCatIdToSlug.set(c.id, c.slug);
      }
      const catSlug = sourceCatIdToSlug.get(subInfo.categoryId);
      if (!catSlug) {
        console.warn(`  [SubSubcategory] "${row.name}" — parent category slug not found, skipping`);
        summary.skipped++;
        continue;
      }

      const targetCatId = categoryLookup.get(catSlug);
      if (targetCatId == null) {
        console.warn(`  [SubSubcategory] "${row.name}" — target category not found, skipping`);
        summary.skipped++;
        continue;
      }

      const targetSubId = subcategoryLookup.get(`${targetCatId}:${subInfo.slug}`);
      if (targetSubId == null) {
        console.warn(`  [SubSubcategory] "${row.name}" — target subcategory not found for key "${targetCatId}:${subInfo.slug}", skipping`);
        summary.skipped++;
        continue;
      }

      // Build name→info map for resource FK resolution
      const existing = subSubcategoryNameToInfo.get(row.name) ?? [];
      existing.push({ slug: row.slug, subcategoryId: targetSubId });
      subSubcategoryNameToInfo.set(row.name, existing);

      const result = await target.query(
        `INSERT INTO "SubSubcategory" (name, slug, "subcategoryId", "displayOrder")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT ("subcategoryId", slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [row.name, row.slug, targetSubId, 0]
      );
      const targetId = result.rows[0]?.id as number;
      subSubcategoryLookup.set(`${targetSubId}:${row.slug}`, targetId);
      summary.imported++;
    } catch (err) {
      console.error(`  [SubSubcategory] Error upserting "${row.name}":`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

async function migrateTags(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "Tag", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceTag>("SELECT id, name, slug FROM tags ORDER BY id");
  summary.exported = rows.length;

  for (const row of rows) {
    try {
      const result = await target.query(
        `INSERT INTO "Tag" (name, slug)
         VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [row.name, row.slug]
      );
      const targetId = result.rows[0]?.id as number;
      tagLookup.set(row.slug, targetId);
      summary.imported++;
    } catch (err) {
      console.error(`  [Tag] Error upserting "${row.name}":`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

async function migrateResources(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "Resource", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceResource>(
    `SELECT id, title, url, description, category, subcategory, sub_subcategory,
            status, github_synced, last_synced_at, metadata, created_at, updated_at
     FROM resources ORDER BY id`
  );
  summary.exported = rows.length;

  // Pre-build reverse lookups from source for category text → target FK
  // Source categories: name→slug already in categoryNameToSlug
  // We also need to resolve subcategory/subSubcategory text names to target IDs

  for (const row of rows) {
    try {
      // --- Resolve categoryId ---
      const catSlug = categoryNameToSlug.get(row.category);
      if (!catSlug) {
        // Try deriving slug from category name
        const derivedSlug = toSlug(row.category);
        const fallbackCatId = categoryLookup.get(derivedSlug);
        if (!fallbackCatId) {
          console.warn(`  [Resource] "${row.title}" — unknown category "${row.category}", skipping`);
          summary.skipped++;
          continue;
        }
        // Use fallback
        categoryNameToSlug.set(row.category, derivedSlug);
      }

      const resolvedCatSlug = categoryNameToSlug.get(row.category)!;
      const targetCatId = categoryLookup.get(resolvedCatSlug);
      if (targetCatId == null) {
        console.warn(`  [Resource] "${row.title}" — target category not found for slug "${resolvedCatSlug}", skipping`);
        summary.skipped++;
        continue;
      }

      // --- Resolve subcategoryId (optional) ---
      let targetSubId: number | null = null;
      if (row.subcategory) {
        const subInfos = subcategoryNameToInfo.get(row.subcategory);
        if (subInfos) {
          // Find the subcategory that belongs to this resource's category
          const match = subInfos.find((s) => s.categoryId === targetCatId);
          if (match) {
            targetSubId = subcategoryLookup.get(`${targetCatId}:${match.slug}`) ?? null;
          }
        }
        if (targetSubId == null) {
          // Try slug-based lookup
          const subSlug = toSlug(row.subcategory);
          targetSubId = subcategoryLookup.get(`${targetCatId}:${subSlug}`) ?? null;
        }
      }

      // --- Resolve subSubcategoryId (optional) ---
      let targetSubSubId: number | null = null;
      if (row.sub_subcategory && targetSubId != null) {
        const subSubInfos = subSubcategoryNameToInfo.get(row.sub_subcategory);
        if (subSubInfos) {
          const match = subSubInfos.find((s) => s.subcategoryId === targetSubId);
          if (match) {
            targetSubSubId = subSubcategoryLookup.get(`${targetSubId}:${match.slug}`) ?? null;
          }
        }
        if (targetSubSubId == null) {
          const subSubSlug = toSlug(row.sub_subcategory);
          targetSubSubId = subSubcategoryLookup.get(`${targetSubId}:${subSubSlug}`) ?? null;
        }
      }

      // --- Map status ---
      const status = mapStatus(row.status);

      // --- Upsert by URL ---
      const result = await target.query(
        `INSERT INTO "Resource" (
           title, url, description, "categoryId", "subcategoryId", "subSubcategoryId",
           status, "githubSynced", "lastSyncedAt", metadata, "createdAt", "updatedAt"
         ) VALUES ($1, $2, $3, $4, $5, $6, $7::\"ResourceStatus\", $8, $9, $10, $11, $12)
         ON CONFLICT (url) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           "categoryId" = EXCLUDED."categoryId",
           "subcategoryId" = EXCLUDED."subcategoryId",
           "subSubcategoryId" = EXCLUDED."subSubcategoryId",
           status = EXCLUDED.status,
           "githubSynced" = EXCLUDED."githubSynced",
           "lastSyncedAt" = EXCLUDED."lastSyncedAt",
           metadata = EXCLUDED.metadata,
           "updatedAt" = EXCLUDED."updatedAt"
         RETURNING id`,
        [
          row.title,
          row.url,
          row.description ?? "",
          targetCatId,
          targetSubId,
          targetSubSubId,
          status,
          row.github_synced ?? false,
          row.last_synced_at ?? null,
          JSON.stringify(row.metadata ?? {}),
          row.created_at ?? new Date().toISOString(),
          row.updated_at ?? new Date().toISOString(),
        ]
      );

      const targetId = result.rows[0]?.id as number;
      resourceIdMap.set(row.id, targetId);
      summary.imported++;
    } catch (err) {
      console.error(`  [Resource] Error upserting "${row.title}" (${row.url}):`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

async function migrateResourceTags(): Promise<MigrationSummary> {
  const summary: MigrationSummary = { table: "ResourceTag", exported: 0, imported: 0, skipped: 0, errors: 0 };

  const { rows } = await source.query<SourceResourceTag>(
    "SELECT resource_id, tag_id FROM resource_tags ORDER BY resource_id, tag_id"
  );
  summary.exported = rows.length;

  // Build source tag ID → slug map
  const sourceTagIdToSlug = new Map<number, string>();
  const tagRows = await source.query<{ id: number; slug: string }>("SELECT id, slug FROM tags");
  for (const t of tagRows.rows) {
    sourceTagIdToSlug.set(t.id, t.slug);
  }

  for (const row of rows) {
    try {
      const targetResourceId = resourceIdMap.get(row.resource_id);
      if (targetResourceId == null) {
        summary.skipped++;
        continue;
      }

      const tagSlug = sourceTagIdToSlug.get(row.tag_id);
      if (!tagSlug) {
        summary.skipped++;
        continue;
      }

      const targetTagId = tagLookup.get(tagSlug);
      if (targetTagId == null) {
        summary.skipped++;
        continue;
      }

      await target.query(
        `INSERT INTO "ResourceTag" ("resourceId", "tagId")
         VALUES ($1, $2)
         ON CONFLICT ("resourceId", "tagId") DO NOTHING`,
        [targetResourceId, targetTagId]
      );
      summary.imported++;
    } catch (err) {
      console.error(`  [ResourceTag] Error upserting resource=${row.resource_id} tag=${row.tag_id}:`, (err as Error).message);
      summary.errors++;
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== Data Migration: Legacy Drizzle → Prisma ===\n");

  // Test connections
  try {
    await source.query("SELECT 1");
    console.log("[OK] Connected to source database");
  } catch (err) {
    console.error("[FAIL] Cannot connect to source database:", (err as Error).message);
    process.exit(1);
  }

  try {
    await target.query("SELECT 1");
    console.log("[OK] Connected to target database\n");
  } catch (err) {
    console.error("[FAIL] Cannot connect to target database:", (err as Error).message);
    process.exit(1);
  }

  const summaries: MigrationSummary[] = [];

  // Order matters: categories → subcategories → sub-subcategories → tags → resources → resource_tags
  console.log("--- Migrating Categories ---");
  summaries.push(await migrateCategories());

  console.log("--- Migrating Subcategories ---");
  summaries.push(await migrateSubcategories());

  console.log("--- Migrating Sub-Subcategories ---");
  summaries.push(await migrateSubSubcategories());

  console.log("--- Migrating Tags ---");
  summaries.push(await migrateTags());

  console.log("--- Migrating Resources ---");
  summaries.push(await migrateResources());

  console.log("--- Migrating Resource Tags ---");
  summaries.push(await migrateResourceTags());

  // Print summary
  console.log("\n=== Migration Summary ===\n");
  console.log("Table              | Exported | Imported | Skipped | Errors");
  console.log("-------------------|----------|----------|---------|-------");
  for (const s of summaries) {
    console.log(
      `${s.table.padEnd(19)}| ${String(s.exported).padEnd(9)}| ${String(s.imported).padEnd(9)}| ${String(s.skipped).padEnd(8)}| ${s.errors}`
    );
  }

  const totalErrors = summaries.reduce((acc, s) => acc + s.errors, 0);
  const totalImported = summaries.reduce((acc, s) => acc + s.imported, 0);
  console.log(`\nTotal imported: ${totalImported}`);
  console.log(`Total errors: ${totalErrors}`);

  // Cleanup
  await source.end();
  await target.end();

  if (totalErrors > 0) {
    console.log("\nMigration completed with errors. Review warnings above.");
    process.exit(1);
  } else {
    console.log("\nMigration completed successfully.");
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
