import { useState, useCallback } from 'react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string

interface GeoResult {
  lat: number
  lng: number
  label: string   // human-readable address
  city?: string
  country?: string
}

interface State {
  loading: boolean
  error: string | null
  result: GeoResult | null
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (!data.results?.length) return { lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }

  const components: Array<{ long_name: string; short_name: string; types: string[] }> =
    data.results[0].components ?? data.results[0].address_components ?? []

  const get = (type: string) => components.find(c => c.types.includes(type))?.long_name

  const city = get('locality') ?? get('sublocality_level_1') ?? get('administrative_area_level_2')
  const country = get('country')

  // Use the first "establishment" or "neighborhood" result for a human-friendly label
  const label =
    data.results.find((r: { types: string[] }) => r.types.includes('establishment'))?.formatted_address ??
    data.results[0].formatted_address

  return { lat, lng, label, city, country }
}

export function useGeolocation() {
  const [state, setState] = useState<State>({ loading: false, error: null, result: null })

  const getLocation = useCallback((): Promise<GeoResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by your browser'
        setState(s => ({ ...s, error: err }))
        reject(new Error(err))
        return
      }

      setState({ loading: true, error: null, result: null })

      navigator.geolocation.getCurrentPosition(
        async pos => {
          try {
            const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
            setState({ loading: false, error: null, result })
            resolve(result)
          } catch {
            const result: GeoResult = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              label: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            }
            setState({ loading: false, error: null, result })
            resolve(result)
          }
        },
        err => {
          const msg =
            err.code === 1 ? 'Location access denied — please allow in browser settings'
            : err.code === 2 ? 'Location unavailable'
            : 'Location request timed out'
          setState({ loading: false, error: msg, result: null })
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }, [])

  return { ...state, getLocation }
}
