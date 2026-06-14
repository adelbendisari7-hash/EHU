import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  if (session?.user.role === "uisti") redirect("/uisti/morbidite")
  if (session?.user.role === "uhh")   redirect("/uhh/dashboard")

  const [maladies, communes, wilayas] = await Promise.all([
    prisma.maladie.findMany({ where: { isActive: true, categorie: { not: "categorie_3_bmr" } }, orderBy: { nom: "asc" }, select: { id: true, nom: true, groupeEpidemiologique: true } }),
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
