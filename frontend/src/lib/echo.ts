import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

const driver = import.meta.env.VITE_BROADCAST_DRIVER ?? 'reverb'

const echo = driver === 'pusher'
  ? new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
      forceTLS: true,
      authEndpoint: (import.meta.env.VITE_API_URL ?? '/api/v1') + '/broadcasting/auth',
      auth: {
        headers: {
          get Authorization() {
            return `Bearer ${localStorage.getItem('token') ?? ''}`
          },
        },
      },
    })
  : new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
      wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: (import.meta.env.VITE_API_URL ?? '/api/v1') + '/broadcasting/auth',
      auth: {
        headers: {
          get Authorization() {
            return `Bearer ${localStorage.getItem('token') ?? ''}`
          },
        },
      },
    })

export default echo
