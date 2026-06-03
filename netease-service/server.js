/**
 * Local NeteaseCloudMusicApi Service
 * Runs on port 3002
 * Spawns the NeteaseCloudMusicApi Express app
 */
const { spawn } = require('child_process')
const path = require('path')

const PORT = process.env.NETEASE_PORT || 3002
const apiDir = path.join(__dirname, 'node_modules', 'NeteaseCloudMusicApi')

process.env.PORT = String(PORT)

const child = spawn('node', ['app.js'], {
  cwd: apiDir,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
})

child.on('error', (err) => {
  console.error('[netease-service] Failed to start:', err.message)
  process.exit(1)
})

child.on('exit', (code) => {
  console.log(`[netease-service] NeteaseCloudMusicApi exited (code ${code})`)
  process.exit(code || 0)
})
