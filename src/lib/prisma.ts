import { PrismaClient } from "@/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaPg } from "@prisma/adapter-pg"
import { neonConfig } from "@neondatabase/serverless"
import pg from "pg"
import ws from "ws"

neonConfig.webSocketConstructor = ws

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Set it to your Neon pooled connection string " +
        "(e.g. postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require)"
    )
  }

  // Use pg adapter for local PostgreSQL (Neon WebSocket adapter doesn't work with localhost)
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
  if (isLocal) {
    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  }

  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
