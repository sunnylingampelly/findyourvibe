import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export function GenderPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = GENDERS.find(g => g.value === value)

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#24332F] font-manrope mb-1.5">Gender</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 border-[1.5px] rounded-2xl bg-white text-left transition-colors ${
          open ? 'border-[#236B63]' : 'border-[#E8EAE6]'
        }`}
      >
        <span className={`text-sm ${selected ? 'text-[#24332F]' : 'text-[#A1AAA5]'}`}>
          {selected?.label ?? 'Select your gender'}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-[#A1AAA5]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8EAE6] rounded-2xl shadow-elevated z-50 overflow-hidden"
          >
            {GENDERS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => { onChange(g.value); setOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-left hover:bg-[#FAF9F6] transition-colors border-b border-[#F4F1EA] last:border-0"
              >
                <span className={value === g.value ? 'font-semibold text-[#236B63]' : 'text-[#24332F]'}>{g.label}</span>
                {value === g.value && <Check size={15} className="text-[#236B63]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── DobPicker ───────────────────────────────────────────────────────────────

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toLocalDate(iso: string): Date | null {
  const parts = iso.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  const date = new Date(y, m - 1, d)
  return isNaN(date.getTime()) ? null : date
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDisplay(d: Date) {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export function DobPicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'cal' | 'year'>('cal')
  const yearListRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())

  const selected = value ? toLocalDate(value) : null

  // Default view: 25 years back
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear() - 25)
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()) }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll year list to selected year when switching to year mode
  useEffect(() => {
    if (mode === 'year' && yearListRef.current) {
      const btn = yearListRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
      btn?.scrollIntoView({ block: 'center' })
    }
  }, [mode])

  const years: number[] = []
  for (let y = today.getFullYear() - 18; y >= today.getFullYear() - 100; y--) years.push(y)

  // Build day grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    return d > maxDate || d < minDate
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1)
    if (next <= maxDate) {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    }
  }

  const selectDay = (day: number) => {
    if (isDisabled(day)) return
    const d = new Date(viewYear, viewMonth, day)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    onChange(iso)
    setOpen(false)
  }

  const selectYear = (y: number) => {
    setViewYear(y)
    setMode('cal')
  }

  const isValidAge = selected && selected <= maxDate && selected >= minDate

  return (
    <div>
      <label className="block text-sm font-semibold text-[#24332F] font-manrope mb-1.5">
        Date of Birth <span className="text-[#A1AAA5] font-normal text-xs">(18+ only)</span>
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(true); setMode('cal') }}
        className={`w-full flex items-center justify-between px-4 py-3 border-[1.5px] rounded-2xl bg-white text-left transition-colors ${
          open ? 'border-[#236B63]' : error ? 'border-[#D76D6D]' : 'border-[#E8EAE6]'
        }`}
      >
        <span className={`text-sm ${selected ? 'text-[#24332F]' : 'text-[#A1AAA5]'}`}>
          {selected ? formatDisplay(selected) : 'Select your date of birth'}
        </span>
        <Calendar size={16} className="text-[#A1AAA5] shrink-0" />
      </button>

      {/* Inline validation message */}
      {selected && !isValidAge && (
        <p className="text-xs text-[#D76D6D] mt-1.5">You must be between 18 and 100 years old.</p>
      )}
      {selected && isValidAge && (
        <p className="text-xs text-[#4D9274] mt-1.5 flex items-center gap-1">
          <Check size={11} /> Age: {today.getFullYear() - selected.getFullYear()} years
        </p>
      )}
      {error && <p className="text-xs text-[#D76D6D] mt-1.5">{error}</p>}

      {/* Calendar bottom sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 px-5 pt-4 pb-8"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-[#E8EAE6] rounded-full mx-auto mb-4" />

              {mode === 'cal' ? (
                <>
                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-[#F4F9F7] flex items-center justify-center active:bg-[#E8F0EA]">
                      <ChevronLeft size={18} className="text-[#236B63]" />
                    </button>
                    <button
                      onClick={() => setMode('year')}
                      className="font-manrope font-bold text-[#24332F] text-base px-3 py-1 rounded-xl hover:bg-[#F4F9F7] active:bg-[#E8F0EA] transition-colors"
                    >
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </button>
                    <button
                      onClick={nextMonth}
                      disabled={new Date(viewYear, viewMonth + 1, 1) > maxDate}
                      className="w-9 h-9 rounded-xl bg-[#F4F9F7] flex items-center justify-center active:bg-[#E8F0EA] disabled:opacity-30"
                    >
                      <ChevronRight size={18} className="text-[#236B63]" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAY_LABELS.map(d => (
                      <div key={d} className="text-center text-[11px] font-semibold text-[#A1AAA5] py-1">{d}</div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {cells.map((day, i) => {
                      if (!day) return <div key={i} />
                      const disabled = isDisabled(day)
                      const isSelected = selected && isSameDay(selected, new Date(viewYear, viewMonth, day))
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={disabled}
                          onClick={() => selectDay(day)}
                          className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all mx-0.5 ${
                            isSelected
                              ? 'bg-[#236B63] text-white font-bold shadow-sm'
                              : disabled
                              ? 'text-[#D0D5D2] cursor-not-allowed'
                              : 'text-[#24332F] hover:bg-[#E8F0EA] active:bg-[#A8C5B5]'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-center text-xs text-[#A1AAA5] mt-4">
                    Tap <span className="font-semibold text-[#236B63]">{MONTH_NAMES[viewMonth]} {viewYear}</span> to change year quickly
                  </p>
                </>
              ) : (
                <>
                  {/* Year picker */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-manrope font-bold text-[#24332F] text-base">Select Year</span>
                    <button onClick={() => setMode('cal')} className="text-sm text-[#236B63] font-semibold px-3 py-1 rounded-xl bg-[#E8F0EA]">
                      Back
                    </button>
                  </div>
                  <div ref={yearListRef} className="h-64 overflow-y-auto overscroll-contain">
                    <div className="grid grid-cols-3 gap-2 pb-2">
                      {years.map(y => (
                        <button
                          key={y}
                          data-selected={y === viewYear ? 'true' : undefined}
                          onClick={() => selectYear(y)}
                          className={`py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                            y === viewYear
                              ? 'bg-[#236B63] text-white shadow-sm'
                              : 'bg-[#F4F9F7] text-[#24332F] hover:bg-[#E8F0EA]'
                          }`}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
