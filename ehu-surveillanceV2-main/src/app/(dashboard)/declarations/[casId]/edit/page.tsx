"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import DeclarationForm from "@/components/declarations/declaration-form"

export default function EditCasPage() {
  const params = useParams()
  const casId = params.casId as string

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/declarations/${casId}`} className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Modifier la Déclaration</h1>
      </div>
      <DeclarationForm casId={casId} />
    </div>
  )
}
