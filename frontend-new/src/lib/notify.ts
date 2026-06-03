import { invoke } from '@tauri-apps/api/core'

export async function sendNotification(title: string, body: string) {
  try {
    await invoke('plugin:notification|notify', {
      title,
      body,
    })
  } catch (e) {
    console.warn('Notification failed:', e)
  }
}