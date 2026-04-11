import DeclarationForm from "@/components/declarations/declaration-form"

export default function NewDeclarationPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Nouvelle Déclaration</h1>
        <p className="text-sm text-gray-500 mt-1">Déclarer un nouveau cas de maladie à déclaration obligatoire</p>
      </div>
      <DeclarationForm />
    </div>
  )
}
