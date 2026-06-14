"use client"

import { useState, useEffect, useRef } from "react"
import { CalendarDays } from "lucide-react"
import type { UseFormWatch, UseFormSetValue } from "react-hook-form"

function isoToDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return ""
  return `${d}/${m}/${y}`
}

function displayToISO(digits: string): string {
  if (digits.length !== 8) return ""
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)
  const date = new Date(`${y}-${m}-${d}`)
  return isNaN(date.getTime()) ? "" : `${y}-${m}-${d}`
}

function applyFormat(digits: string): string {
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

// ── Mode RHF (watch + setValue) ──────────────────────────────────────────────
interface RHFProps {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: UseFormWatch<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>
  value?: never
  onChange?: never
  className?: string
  required?: boolean
  onAfterChange?: (iso: string) => void
}

// ── Mode simple (value + onChange) ───────────────────────────────────────────
interface SimpleProps {
  name?: never
  watch?: never
  setValue?: never
  value: string
  onChange: (iso: string) => void
  className?: string
  required?: boolean
  onAfterChange?: never
}

type Props = RHFProps | SimpleProps

export default function DateInput(props: Props) {
  const isRHF = props.watch !== undefined
  const hiddenRef = useRef<HTMLInputElement>(null)

  const rawValue = isRHF
    ? ((props as RHFProps).watch((props as RHFProps).name) ?? "")
    : ((props as SimpleProps).value ?? "")

  const [display, setDisplay] = useState(() => isoToDisplay(rawValue))

  useEffect(() => {
    const next = isoToDisplay(rawValue)
    setDisplay(prev => {
      const currentISO = displayToISO(prev.replace(/\//g, ""))
      return currentISO !== rawValue ? next : prev
    })
  }, [rawValue])

  const commit = (iso: string) => {
    if (isRHF) {
      const p = props as RHFProps
      p.setValue(p.name, iso, { shouldValidate: !!p.required })
      if (iso) p.onAfterChange?.(iso)
    } else {
      ;(props as SimpleProps).onChange(iso)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
    setDisplay(applyFormat(digits))
    commit(digits.length === 8 ? (displayToISO(digits) || "") : "")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Backspace", "Delete", "Tab", "Escape", "ArrowLeft", "ArrowRight"].includes(e.key)) return
    if (!/^\d$/.test(e.key)) e.preventDefault()
  }

  // Hidden native date picker — syncs back on change
  const handleHiddenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value // yyyy-mm-dd
    if (!iso) return
    setDisplay(isoToDisplay(iso))
    commit(iso)
  }

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="jj/mm/aaaa"
        maxLength={10}
        className={`${props.className ?? ""} pr-9`}
        autoComplete="off"
      />

      {/* Bouton calendrier — ouvre le sélecteur natif */}
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          const el = hiddenRef.current
          if (!el) return
          try { el.showPicker() } catch { el.click() }
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Ouvrir le calendrier"
      >
        <CalendarDays size={15} />
      </button>

      {/* Input natif caché — uniquement pour déclencher le calendrier */}
      <input
        ref={hiddenRef}
        type="date"
        value={rawValue}
        onChange={handleHiddenChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0 bottom-0 left-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  )
}
