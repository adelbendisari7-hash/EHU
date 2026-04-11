import { PrismaClient } from "@prisma/client"
import { SYMPTOMS } from "../../src/constants/symptoms"
import { GERMES } from "../../src/constants/germes"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding symptomes...")
  for (const s of SYMPTOMS) {
    await prisma.symptome.upsert({
      where: { code: s.code },
      update: { nom: s.nom, categorie: s.categorie },
      create: { code: s.code, nom: s.nom, categorie: s.categorie },
    })
  }
  console.log(`  ✓ ${SYMPTOMS.length} symptômes`)

  console.log("Seeding germes...")
  for (const g of GERMES) {
    await prisma.germe.upsert({
      where: { code: g.code },
      update: { nom: g.nom, type: g.type },
      create: { code: g.code, nom: g.nom, type: g.type },
    })
  }
  console.log(`  ✓ ${GERMES.length} germes`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
