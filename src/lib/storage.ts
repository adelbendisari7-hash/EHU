import { writeFile, unlink, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { join, extname } from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])
const MAX_SIZE_MB = 10

export async function saveUploadedFile(file: File): Promise<{ url: string; filename: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, WEBP.")
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Fichier trop volumineux. Taille maximale : ${MAX_SIZE_MB} Mo.`)
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  const ext = extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".jpg")
  const storedName = `${randomUUID()}${ext}`
  const bytes = await file.arrayBuffer()
  await writeFile(join(UPLOAD_DIR, storedName), Buffer.from(bytes))

  return { url: `/uploads/${storedName}`, filename: file.name }
}

export async function deleteUploadedFile(url: string): Promise<void> {
  const storedName = url.replace(/^\/uploads\//, "")
  // Prevent path traversal
  if (storedName.includes("..") || storedName.includes("/")) return
  const filePath = join(UPLOAD_DIR, storedName)
  if (existsSync(filePath)) {
    await unlink(filePath)
  }
}
