import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Calendar } from 'lucide-react'

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

export function DobPicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      setYear(parts[0] ?? '')
      setMonth(parts[1] ?? '')
      setDay(parts[2] ?? '')
    }
  }, [value])

  const commit = (d: string, m: string, y: string) => {
    if (d && m && y && y.length === 4) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear - 18
  const minYear = currentYear - 100

  const age = year && year.length === 4 && day && month
    ? currentYear - parseInt(year)
    : null

  return (
    <div>
      <label className="block text-sm font-semibold text-[#24332F] font-manrope mb-1.5">
        Date of Birth{' '}
        <span className="text-[#A1AAA5] font-normal text-xs">(18+ only)</span>
      </label>
      <div className="flex gap-2">
        {/* Day */}
        <div className="w-16">
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={e => { setDay(e.target.value); commit(e.target.value, month, year) }}
            placeholder="DD"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-3 text-sm text-[#24332F] text-center placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* Month */}
        <div className="flex-1 relative">
          <select
            value={month}
            onChange={e => { setMonth(e.target.value); commit(day, e.target.value, year) }}
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-3 text-sm text-[#24332F] bg-white focus:outline-none focus:border-[#236B63] appearance-none"
          >
            <option value="">Month</option>
            {months.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1AAA5] pointer-events-none" />
        </div>

        {/* Year */}
        <div className="w-20">
          <input
            type="number"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={e => { setYear(e.target.value); commit(day, month, e.target.value) }}
            placeholder="YYYY"
            className="w-full border-[1.5px] border-[#E8EAE6] rounded-2xl px-3 py-3 text-sm text-[#24332F] text-center placeholder:text-[#A1AAA5] focus:outline-none focus:border-[#236B63] bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      </div>

      {age !== null && (
        age >= 18 && age <= 100 ? (
          <p className="text-xs text-[#4D9274] mt-1.5 flex items-center gap-1">
            <Check size={11} /> Age: {age} years
          </p>
        ) : (
          <p className="text-xs text-[#D76D6D] mt-1.5 flex items-center gap-1">
            <Calendar size={11} /> You must be at least 18 years old
          </p>
        )
      )}
      {error && <p className="text-xs text-[#D76D6D] mt-1.5">{error}</p>}
    </div>
  )
}
