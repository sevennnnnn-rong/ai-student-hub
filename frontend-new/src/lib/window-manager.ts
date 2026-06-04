import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

interface PopupConfig {
  label: string
  url: string
  title: string
  width: number
  height: number
}

const popups: Record<string, PopupConfig> = {
  pomodoro: {
    label: 'popup-pomodoro',
    url: 'popup-pomodoro.html',
    title: '🍅 番茄钟',
    width: 320,
    height: 480,
  },
  notes: {
    label: 'popup-notes',
    url: 'popup-notes.html',
    title: '📝 快速笔记',
    width: 360,
    height: 480,
  },
  chat: {
    label: 'popup-chat',
    url: 'popup-chat.html',
    title: '🤖 AI 助手',
    width: 400,
    height: 520,
  },
}

export async function openPopup(name: string) {
  const config = popups[name]
  if (!config) {
    console.error('[window-manager] Unknown popup:', name)
    return
  }

  // Check if window already exists
  const existing = await WebviewWindow.getByLabel(config.label)
  if (existing) {
    await existing.setFocus()
    return existing
  }

  const win = new WebviewWindow(config.label, {
    url: config.url,
    title: config.title,
    width: config.width,
    height: config.height,
    resizable: true,
    alwaysOnTop: true,
    decorations: false,
    transparent: true,
    skipTaskbar: true,
  })

  // Listen for creation errors (do NOT await — listener must be registered immediately)
  win.once('tauri://error', (e) => {
    console.error('[window-manager] Window creation error:', e)
  })

  return win
}

export async function closePopup(name: string) {
  const config = popups[name]
  if (!config) return
  const win = await WebviewWindow.getByLabel(config.label)
  if (win) await win.close()
}
