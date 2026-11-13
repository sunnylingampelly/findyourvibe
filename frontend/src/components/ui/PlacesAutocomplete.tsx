import { useEffect, useRef, useState } from 'react'
import { MapPin, LocateFixed, Loader2, Search } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string

let _loaded = false
let _loading = false
const _cbs: Array<() => void> = []

function loadMaps(cb: () => void) {
  if (_loaded) { cb(); return }
  _cbs.push(cb)
  if (_loading) return
  _loading = true
  const s = document.createElement('script')
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
  s.async = true; s.defer = true
  s.onload = () => { _loaded = true; _cbs.forEach(fn => fn()); _cbs.length = 0 }
  document.head.appendChild(s)
}

// Inject pac-container styles once
let _stylesInjected = false
function injectPacStyles() {
  if (_stylesInjected) return
  _stylesInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .pac-container {
      border-radius: 16px !important;
      border: 1.5px solid #2E2E3A !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      font-family: inherit !important;
      margin-top: 4px !important;
      overflow: hidden !important;
      z-index: 9999 !important;
      background: #141418 !important;
    }
    .pac-item {
      padding: 10px 14px !important;
      cursor: pointer !important;
      border-top: 1px solid #2E2E3A !important;
      font-size: 13px !important;
      color: #F2F0EB !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .pac-item:first-child { border-top: none !important; }
    .pac-item:hover, .pac-item-selected { background: #1C1C22 !important; }
    .pac-item-query { font-weight: 600 !important; color: #F2F0EB !important; font-size: 13px !important; }
    .pac-matched { color: #C8FF4D !important; }
    .pac-icon { display: none !important; }
    .pac-logo { display: none !important; }
    .hdpi .pac-icon { display: none !important; }
  `
  document.head.appendChild(style)
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showLocateButton?: boolean
  label?: string
  required?: boolean
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search city or area…',
  className,
  showLocateButton = true,
  label,
  required,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(_loaded)
  const [focused, setFocused] = useState(false)
  const { loading: geoLoading, getLocation } = useGeolocation()

  useEffect(() => {
    injectPacStyles()
    if (_loaded) return
    loadMaps(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !inputRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
      fields: ['formatted_address', 'name', 'geometry'],
    })
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      onChange(place.formatted_address || place.name || inputRef.current?.value || '')
    })
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).google?.maps.event.removeListener(listener)
    }
  }, [ready, onChange])

  const handleLocate = async () => {
    try {
      const result = await getLocation()
      onChange(result.label)
      if (inputRef.current) inputRef.current.value = result.label
    } catch { /* user denied */ }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#8B8B9A] uppercase tracking-wide block">
          {label}{required && <span className="text-[#FF5C7A] ml-0.5">*</span>}
        </label>
      )}
      <div className={`relative flex items-center transition-all ${focused ? 'ring-2 ring-[#C8FF4D]/20' : ''} rounded-xl`}>
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 shrink-0" style={{ color: '#C8FF4D' }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          className={className ?? 'w-full border-[1.5px] border-[#2E2E3A] rounded-xl py-3 text-sm text-[#F2F0EB] placeholder:text-[#52525E] focus:outline-none focus:border-[#C8FF4D] transition-colors'}
          style={{ background: '#1C1C22', paddingLeft: '2.25rem', paddingRight: showLocateButton ? '2.5rem' : undefined }}
        />
        {showLocateButton && (
          <button
            type="button"
            onClick={handleLocate}
            disabled={geoLoading}
            title="Use my location"
            className="absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-40 transition-colors"
            style={{ color: '#C8FF4D' }}
          >
            {geoLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <LocateFixed size={15} />}
          </button>
        )}
      </div>
      {showLocateButton && (
        <button
          type="button"
          onClick={handleLocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 text-[11px] font-semibold disabled:opacity-50 ml-0.5"
          style={{ color: '#C8FF4D' }}
        >
          {geoLoading ? <Loader2 size={11} className="animate-spin" /> : <MapPin size={11} />}
          {geoLoading ? 'Detecting location…' : 'Use my current location'}
        </button>
      )}
    </div>
  )
}

export function staticMapUrl(cityName: string, countryName?: string, zoom = 12) {
  const q = encodeURIComponent(cityName + (countryName ? `, ${countryName}` : ''))
  const marker = encodeURIComponent(`color:0x236B63|${cityName}`)
  return `https://maps.googleapis.com/maps/api/staticmap?center=${q}&zoom=${zoom}&size=600x240&scale=2&markers=${marker}&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${MAPS_KEY}`
}
