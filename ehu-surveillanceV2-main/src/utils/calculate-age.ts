export function calculateAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function calculateAgeDetailed(dateOfBirth: Date | string): { ans: number; mois: number; jours: number; label: string } {
  const dob = new Date(dateOfBirth)
  const today = new Date()

  let ans = today.getFullYear() - dob.getFullYear()
  let mois = today.getMonth() - dob.getMonth()
  let jours = today.getDate() - dob.getDate()

  if (jours < 0) {
    mois--
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    jours += prevMonth.getDate()
  }
  if (mois < 0) {
    ans--
    mois += 12
  }

  ans = Math.max(0, ans)
  mois = Math.max(0, mois)
  jours = Math.max(0, jours)

  const parts: string[] = []
  if (ans > 0) parts.push(`${ans} an${ans > 1 ? "s" : ""}`)
  if (mois > 0) parts.push(`${mois} mois`)
  if (jours > 0 || parts.length === 0) parts.push(`${jours} jour${jours > 1 ? "s" : ""}`)

  return { ans, mois, jours, label: parts.join(" ") }
}
