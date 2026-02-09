import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import ws from "ws"
import { readFileSync } from "fs"
import { join } from "path"

neonConfig.webSocketConstructor = ws

interface SeedCategory {
  name: string
  slug: string
  description: string
  icon: string
  displayOrder: number
}

interface SeedResource {
  title: string
  url: string
  description: string
  categorySlug: string
  status: string
}

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Set it to your Neon connection string for seeding."
    )
  }

  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

async function main() {
  const prisma = createPrismaClient()

  try {
    const seedDataDir = join(__dirname, "seed-data")

    const categories: SeedCategory[] = JSON.parse(
      readFileSync(join(seedDataDir, "categories.json"), "utf-8")
    )
    const resources: SeedResource[] = JSON.parse(
      readFileSync(join(seedDataDir, "resources.json"), "utf-8")
    )

    console.log(`Seeding ${categories.length} categories...`)

    const categoryMap = new Map<string, number>()

    for (const cat of categories) {
      const upserted = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
        },
        create: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
        },
      })
      categoryMap.set(cat.slug, upserted.id)
    }

    console.log(`Seeded ${categoryMap.size} categories.`)
    console.log(`Seeding ${resources.length} resources...`)

    let seededCount = 0

    for (const res of resources) {
      const categoryId = categoryMap.get(res.categorySlug)
      if (!categoryId) {
        console.warn(
          `Skipping resource "${res.title}": category slug "${res.categorySlug}" not found.`
        )
        continue
      }

      await prisma.resource.upsert({
        where: { url: res.url },
        update: {
          title: res.title,
          description: res.description,
          categoryId,
          status: res.status as "pending" | "approved" | "rejected" | "archived",
        },
        create: {
          title: res.title,
          url: res.url,
          description: res.description,
          categoryId,
          status: res.status as "pending" | "approved" | "rejected" | "archived",
        },
      })
      seededCount++
    }

    console.log(`Seeded ${seededCount} resources.`)
    console.log("Seed complete.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("Seed failed:", error)
  process.exit(1)
})
