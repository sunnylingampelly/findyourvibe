import { useEffect, useRef, useState } from 'react'
import { MapPin, LocateFixed, Loader2 } from 'lucide-react'
import { useGeolocation } from '../../hooks/useGeolocation'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string

// Singleton script loader — only injects the tag once
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
  s.async = true
  s.defer = true
  s.onload = () => { _loaded = true; _cbs.forEach(fn => fn()); _cbs.length = 0 }
  document.head.appendChild(s)
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  showLocateButton?: boolean
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search location…',
  className,
  showLocateButton = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [ready, setReady] = useState(_loaded)
  const { loading: geoLoading, getLocation } = useGeolocation()

  useEffect(() => {
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
    } catch { /* user denied — ignore */ }
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#236B63] pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={className}
          style={{ paddingLeft: '2rem' }}
        />
      </div>
      {showLocateButton && (
        <button
          type="button"
          onClick={handleLocate}
          disabled={geoLoading}
          className="flex items-center gap-1.5 text-[11px] text-[#236B63] font-semibold disabled:opacity-50"
        >
          {geoLoading
            ? <Loader2 size={12} className="animate-spin" />
            : <LocateFixed size={12} />}
          {geoLoading ? 'Getting your location…' : 'Use my current location'}
        </button>
      )}
    </div>
  )
}

/** Returns a Google Static Map image URL centered on a city string */
export function staticMapUrl(cityName: string, countryName?: string, zoom = 12) {
  const q = encodeURIComponent(cityName + (countryName ? `, ${countryName}` : ''))
  const marker = encodeURIComponent(`color:0x236B63|${cityName}`)
  return `https://maps.googleapis.com/maps/api/staticmap?center=${q}&zoom=${zoom}&size=600x240&scale=2&markers=${marker}&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${MAPS_KEY}`
}
