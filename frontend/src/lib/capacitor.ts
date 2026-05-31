import { Capacitor, registerPlugin } from '@capacitor/core'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): string {
  return Capacitor.getPlatform()
}

// Minimal plugin type interfaces (avoids separate @capacitor/app / @capacitor/preferences packages)
interface CapacitorAppPlugin {
  addListener(eventName: string, callback: (state: { isActive: boolean }) => void): Promise<{ remove(): void }>
}

interface CapacitorPreferencesPlugin {
  get(options: { key: string }): Promise<{ value: string | null }>
  set(options: { key: string; value: string }): Promise<void>
}

const App = registerPlugin<CapacitorAppPlugin>('App')
const Preferences = registerPlugin<CapacitorPreferencesPlugin>('Preferences')

/**
 * Initialize Capacitor App lifecycle listeners.
 * Dispatches custom events 'app:pause' and 'app:resume'
 * so stores can save/reload state accordingly.
 */
export function initAppLifecycle(): void {
  if (!isNative()) return

  App.addListener('appStateChange', (state) => {
    if (state.isActive) {
      window.dispatchEvent(new CustomEvent('app:resume'))
    } else {
      window.dispatchEvent(new CustomEvent('app:pause'))
    }
  })
}

/**
 * Initialize Capacitor Preferences for storing the API base URL.
 */
export async function initCapacitorConfig(): Promise<void> {
  if (!isNative()) return

  try {
    const result = await Preferences.get({ key: 'apiBaseUrl' })
    if (!result.value) {
      await Preferences.set({
        key: 'apiBaseUrl',
        value: 'https://api.example.com',
      })
    }
  } catch (err) {
    console.error('[Capacitor] Failed to init config:', err)
  }
}
