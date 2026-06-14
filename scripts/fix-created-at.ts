/**
 * Aligne createdAt sur dateDiagnostic pour tous les cas seedés
 * afin que la courbe épidémique (basée sur createdAt) soit réaliste.
 *
 * Usage: npx tsx --env-file=.env.local scripts/fix-created-at.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Tous les cas seedés (codeCas au format CAS-2026-*)
  const cas = await prisma.casDeclare.findMany({
    where: {
      codeCas: { startsWith: "CAS-2026-" },
      dateDiagnostic: { not: null },
    },
    select: { id: true, codeCas: true, dateDiagnostic: true },
  })

  console.log(`→ ${cas.length} cas seedés avec dateDiagnostic à aligner\n`)

  let updated = 0
  for (const c of cas) {
    await prisma.$executeRaw`
      UPDATE cas_declares
      SET created_at = ${c.dateDiagnostic!}
      WHERE id = ${c.id}
    `
    updated++
  }

  console.log(`✓ ${updated} cas mis à jour`)

  // Vérification : distribution par date
  const dist = await prisma.$queryRaw<{ jour: string; nb: bigint }[]>`
    SELECT DATE(created_at) as jour, COUNT(*) as nb
    FROM cas_declares
    WHERE code_cas LIKE 'CAS-2026-%'
    GROUP BY DATE(created_at)
    ORDER BY jour
  `
  console.log("\nDistribution par date de déclaration :")
  for (const row of dist) {
    const bar = "█".repeat(Math.min(Number(row.nb), 40))
    console.log(`  ${row.jour}  ${String(row.nb).padStart(3)} cas  ${bar}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
