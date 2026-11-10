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

function isIOSDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !('MSStream' in window)
}

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandaloneMode)
  const [showIOSSheet, setShowIOSSheet] = useState(false)

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

  const install = async () => {
    if (installed) return
    if (isIOSDevice()) {
      // iOS can't be prompted programmatically — show instructions
      setShowIOSSheet(true)
      return
    }
    if (promptEvent) {
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      if (outcome === 'accepted') { setInstalled(true); setPromptEvent(null) }
    } else {
      // Android but beforeinstallprompt hasn't fired — show generic instructions
      setShowIOSSheet(true)
    }
  }

  // Show button whenever: not installed, not already in standalone
  const canInstall = !installed

  return { canInstall, install, showIOSSheet, setShowIOSSheet, isIOS: isIOSDevice() }
}
