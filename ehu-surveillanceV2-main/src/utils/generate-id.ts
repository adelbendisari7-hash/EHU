export function generatePatientId(): string {
  const date = new Date()
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0")
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${dateStr}-${random}`
}

export function generateCaseCode(): string {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `CAS-${year}-${random}`
}
