import DeclarationForm from "@/components/declarations/declaration-form"

export default async function NewDeclarationPage({ searchParams }: { searchParams: Promise<{ copy?: string }> }) {
  const { copy } = await searchParams
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {copy ? "Copier un cas" : "Nouvelle Déclaration"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {copy ? "Formulaire pré-rempli à partir d'un cas existant. Modifiez les champs nécessaires avant de soumettre." : "Déclarer un nouveau cas de maladie à déclaration obligatoire"}
        </p>
      </div>
      <DeclarationForm copyId={copy} />
    </div>
  )
}
