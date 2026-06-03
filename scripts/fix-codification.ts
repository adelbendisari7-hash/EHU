/**
 * Corrige tous les cas dont le codeCas ne respecte pas le format officiel :
 * AAAA (4) + SS (2) + CCCCC (5) + NNNN (4) = 15 caractères, sans séparateurs, tout en majuscules/chiffres
 * Exemple correct : 202601A06--0002
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function isValidCode(code: string): boolean {
  // 15 chars, no dashes at positions 0-3 (year), digits only for year and seq
  if (code.length !== 15) return false
  // year = positions 0-3 : 4 digits
  if (!/^\d{4}/.test(code)) return false
  // service = positions 4-5 : 2 alphanumeric
  if (!/^[A-Z0-9]{2}$/i.test(code.slice(4, 6))) return false
  // seq = positions 11-14 : 4 digits
  if (!/^\d{4}$/.test(code.slice(11, 15))) return false
  return true
}

async function generateCode(
  year: number,
  serviceCode: string | null,
  codeCim10: string | null,
  usedCodes: Set<string>
): Promise<string> {
  const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0").toUpperCase()
  const rawCim10 = (codeCim10 ?? "").slice(0, 5)
  const ccccc = rawCim10.padEnd(5, "-")
  const prefix = `${year}${ss}`

  // Find highest seq already in DB for this prefix
  const last = await prisma.casDeclare.findFirst({
    where: { codeCas: { startsWith: prefix } },
    orderBy: { codeCas: "desc" },
    select: { codeCas: true },
  })

  let seq = 1
  if (last?.codeCas && last.codeCas.length === 15) {
    const lastSeq = parseInt(last.codeCas.slice(11), 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  // Also avoid collisions with codes assigned earlier in this script run
  let code = `${prefix}${ccccc}${String(seq).padStart(4, "0")}`
  while (usedCodes.has(code)) {
    seq++
    code = `${prefix}${ccccc}${String(seq).padStart(4, "0")}`
  }
  usedCodes.add(code)
  return code
}

async function main() {
  console.log("Chargement de tous les cas…")
  const allCas = await prisma.casDeclare.findMany({
    select: {
      id: true,
      codeCas: true,
      anneeDeclaration: true,
      createdAt: true,
      etablissementId: true,
      maladieId: true,
      maladie: { select: { codeCim10: true } },
      etablissement: { select: { codeService: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const invalids = allCas.filter(c => !isValidCode(c.codeCas))
  console.log(`Total cas : ${allCas.length}`)
  console.log(`Cas à corriger : ${invalids.length}`)

  if (invalids.length === 0) {
    console.log("Aucune correction nécessaire.")
    return
  }

  // Pré-charger les codes valides existants pour éviter les doublons
  const existingValidCodes = new Set(allCas.filter(c => isValidCode(c.codeCas)).map(c => c.codeCas))

  console.log("\nCorrections :")
  let fixed = 0
  let errors = 0

  for (const cas of invalids) {
    const year = cas.anneeDeclaration ?? new Date(cas.createdAt).getFullYear()
    const serviceCode = cas.etablissement?.codeService ?? null
    const codeCim10 = cas.maladie?.codeCim10 ?? null

    try {
      const newCode = await generateCode(year, serviceCode, codeCim10, existingValidCodes)
      await prisma.casDeclare.update({
        where: { id: cas.id },
        data: { codeCas: newCode },
      })
      console.log(`  ✓ ${cas.codeCas.padEnd(25)} → ${newCode}`)
      fixed++
    } catch (e) {
      console.error(`  ✗ ${cas.codeCas} : ${(e as Error).message}`)
      errors++
    }
  }

  console.log(`\nTerminé : ${fixed} corrigés, ${errors} erreurs.`)
}

main().finally(() => prisma.$disconnect())
