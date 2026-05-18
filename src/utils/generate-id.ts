import type { PrismaClient } from "@prisma/client"

export function generatePatientId(): string {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0")
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${dateStr}-${random}`
}

/**
 * Génère un code de déclaration de 15 caractères :
 * AAAA (4) + SS (2) + CCCCC (5) + NNNN (4)
 * Ex: 202603A00.90001
 * Le compteur NNNN repart à 0001 pour chaque nouvelle combinaison (année + service).
 */
export async function generateCodeCas(
  year: number,
  serviceCode: string | null | undefined,
  codeCim10: string | null | undefined,
  prismaClient: PrismaClient
): Promise<string> {
  const ss = (serviceCode ?? "00").slice(0, 2).padStart(2, "0")
  const rawCim10 = (codeCim10 ?? "").slice(0, 5)
  const ccccc = rawCim10.padEnd(5, "-") || "-----"
  const prefix = `${year}${ss}`

  // Find the highest existing sequential number for this (year + service) pair
  const last = await prismaClient.casDeclare.findFirst({
    where: { codeCas: { startsWith: prefix } },
    orderBy: { codeCas: "desc" },
    select: { codeCas: true },
  })

  let seq = 1
  if (last?.codeCas && last.codeCas.length === 15) {
    const lastSeq = parseInt(last.codeCas.slice(11), 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  const nnnn = String(seq).padStart(4, "0")
  return `${prefix}${ccccc}${nnnn}`
}
