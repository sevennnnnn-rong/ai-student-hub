import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'popup-pomodoro': resolve(__dirname, 'popup-pomodoro.html'),
        'popup-notes': resolve(__dirname, 'popup-notes.html'),
        'popup-chat': resolve(__dirname, 'popup-chat.html'),
      },
    },
  },
})
