import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import DashboardClient from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const session = await auth()

  const [maladies, communes, wilayas] = await Promise.all([
    prisma.maladie.findMany({ where: { isActive: true }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    prisma.commune.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true, wilayadId: true } }),
    prisma.wilaya.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true, code: true } }),
  ])

  return (
    <DashboardClient
      maladies={maladies}
      communes={communes}
      wilayas={wilayas}
      userName={session?.user.name ?? ""}
    />
  )
}
