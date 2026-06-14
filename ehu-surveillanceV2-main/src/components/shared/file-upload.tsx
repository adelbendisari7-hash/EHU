"use client"

import { useRef, useState } from "react"
import { FileText, Image, Loader2, Paperclip, Trash2, UploadCloud } from "lucide-react"
import { cn } from "@/utils/cn"

export interface UploadedFile {
  id?: string        // set after server upload (existing fichier)
  name: string
  url?: string       // set after server upload
  file?: File        // set when pending (not yet uploaded)
  size?: number
  uploading?: boolean
}

interface FileUploadProps {
  label?: string
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  maxFiles?: number
  compact?: boolean  // smaller variant for use inside cards
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp"
const MAX_MB = 10

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function FileIcon({ name }: { name: string }) {
  const isPdf = name.toLowerCase().endsWith(".pdf")
  return isPdf
    ? <FileText size={16} className="text-red-500 shrink-0" />
    : <Image size={16} className="text-blue-500 shrink-0" />
}

export function FileUpload({ label, files, onChange, maxFiles = 5, compact = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdd = files.length < maxFiles

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    setError(null)
    const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]
    const newEntries: UploadedFile[] = []

    for (const file of Array.from(fileList)) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase()
      if (!allowed.includes(ext)) {
        setError(`Format non supporté : ${file.name}. Formats acceptés : PDF, JPG, PNG, WEBP.`)
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`Fichier trop grand : ${file.name} (max ${MAX_MB} Mo)`)
        continue
      }
      if (files.length + newEntries.length >= maxFiles) {
        setError(`Maximum ${maxFiles} fichier(s) autorisé(s)`)
        break
      }
      newEntries.push({ name: file.name, file, size: file.size })
    }
    if (newEntries.length) onChange([...files, ...newEntries])
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      {/* Drop zone */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors select-none",
            compact ? "py-3 px-4" : "py-5 px-6",
            dragging
              ? "border-[#1B4F8A] bg-[#EBF1FA]"
              : "border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <UploadCloud size={compact ? 18 : 22} className={cn("transition-colors", dragging ? "text-[#1B4F8A]" : "text-gray-400")} />
          <p className="text-xs text-gray-500 text-center">
            <span className="font-medium text-[#1B4F8A]">Cliquez</span> ou glissez un fichier ici
          </p>
          <p className="text-[10px] text-gray-400">PDF, JPG, PNG, WEBP — max {MAX_MB} Mo</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple={maxFiles > 1}
            className="hidden"
            onChange={e => addFiles(e.target.files)}
            onClick={e => (e.currentTarget.value = "")}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              {f.uploading
                ? <Loader2 size={15} className="animate-spin text-[#1B4F8A] shrink-0" />
                : f.url
                  ? <a href={f.url} target="_blank" rel="noreferrer" className="shrink-0"><FileIcon name={f.name} /></a>
                  : <FileIcon name={f.name} />
              }
              <span className="flex-1 truncate text-gray-700 text-xs">
                {f.url
                  ? <a href={f.url} target="_blank" rel="noreferrer" className="hover:underline text-[#1B4F8A]">{f.name}</a>
                  : f.name
                }
              </span>
              {f.size && <span className="text-[10px] text-gray-400 shrink-0">{formatSize(f.size)}</span>}
              {!f.uploading && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Standalone attach button (ultra-compact, single file)
export function AttachButton({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B4F8A] transition-colors"
      >
        <Paperclip size={13} />
        Joindre un document
      </button>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = "" }}
      />
    </>
  )
}
