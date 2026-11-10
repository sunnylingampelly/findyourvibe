import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !('MSStream' in window)
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandaloneMode)

  useEffect(() => {
    if (isStandaloneMode()) { setInstalled(true); return }

    const handler = (e: Event) => {
      e.preventDefault()
      setPromptEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setPromptEvent(null) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Trigger the native browser install prompt (Chrome/Android only)
  const triggerNativePrompt = async (): Promise<boolean> => {
    if (!promptEvent) return false
    await promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') { setInstalled(true); setPromptEvent(null) }
    return outcome === 'accepted'
  }

  const canInstall = !installed
  const hasNativePrompt = !!promptEvent
  const isIOS = isIOSDevice()

  return { canInstall, hasNativePrompt, isIOS, triggerNativePrompt }
}
