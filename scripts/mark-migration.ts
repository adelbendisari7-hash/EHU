import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const exists = await prisma.$queryRawUnsafe<{count: bigint}[]>(
    `SELECT COUNT(*) as count FROM "_prisma_migrations" WHERE migration_name = '20260518000001_add_service_model'`
  )
  if (Number(exists[0].count) === 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, 'manual', NOW(), '20260518000001_add_service_model', NULL, NULL, NOW(), 1)
    `)
    console.log("Migration enregistrée dans _prisma_migrations")
  } else {
    console.log("Migration déjà enregistrée")
  }
  console.log("Migration enregistrée dans _prisma_migrations")
}
main().finally(() => prisma.$disconnect())
