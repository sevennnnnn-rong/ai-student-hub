/**
 * Audio Engine - Central audio management for the Pomodoro sound mixer.
 *
 * Features:
 * - Single AudioContext instance (created lazily on first user interaction)
 * - Multi-track mixing with independent volume control
 * - Master volume control
 * - Supports both procedural noise generators and file-based audio
 * - Graceful error handling and degradation
 * - Clean resource disposal
 */

import { createNoise, type NoiseType, type NoiseNode } from './noise-generators'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudioTrack {
  id: string
  name: string
  icon: string
  type: 'generated' | 'file'
  /** URL for file-based tracks */
  url?: string
  /** Noise generator type for generated tracks */
  generator?: NoiseType
  /** Current volume 0-1 */
  volume: number
  /** Whether the track is currently playing */
  isPlaying: boolean
  /** Whether the track is muted */
  isMuted: boolean
}

export interface TrackPreset {
  id: string
  name: string
  icon: string
  tracks: { id: string; volume: number }[]
}

interface TrackState {
  config: AudioTrack
  /** Gain node for this track's volume control */
  gainNode: GainNode
  /** The noise node (for generated tracks) */
  noiseNode?: NoiseNode
  /** The audio element (for file-based tracks) */
  audioElement?: HTMLAudioElement
  /** Media element source (for file-based tracks) */
  mediaSource?: MediaElementAudioSourceNode
  /** Whether the node graph is connected */
  connected: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'pomodoro_audio_state'
const MASTER_VOLUME_KEY = 'pomodoro_master_volume'

// Default track definitions
const DEFAULT_TRACKS: AudioTrack[] = [
  {
    id: 'rain',
    name: '雨声',
    icon: '🌧️',
    type: 'generated',
    generator: 'rain',
    volume: 0.7,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'thunder',
    name: '雷声',
    icon: '⚡',
    type: 'file',
    url: '/sounds/thunder.mp3',
    volume: 0.5,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    type: 'generated',
    generator: 'pink',
    volume: 0.8,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'birds',
    name: '鸟鸣',
    icon: '🐦',
    type: 'file',
    url: '/sounds/birds.mp3',
    volume: 0.4,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'waves',
    name: '海浪',
    icon: '🌊',
    type: 'generated',
    generator: 'waves',
    volume: 0.7,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'wind',
    name: '风声',
    icon: '🌬️',
    type: 'generated',
    generator: 'wind',
    volume: 0.5,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'whitenoise',
    name: '白噪音',
    icon: '📻',
    type: 'generated',
    generator: 'white',
    volume: 0.3,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'brownnoise',
    name: '棕色噪音',
    icon: '🟤',
    type: 'generated',
    generator: 'brown',
    volume: 0.4,
    isPlaying: false,
    isMuted: false,
  },
  {
    id: 'pages',
    name: '翻书',
    icon: '📖',
    type: 'file',
    url: '/sounds/pages.mp3',
    volume: 0.3,
    isPlaying: false,
    isMuted: false,
  },
]

export const DEFAULT_PRESETS: TrackPreset[] = [
  {
    id: 'rainy',
    name: '雨天',
    icon: '🌧️',
    tracks: [
      { id: 'rain', volume: 0.7 },
      { id: 'thunder', volume: 0.3 },
    ],
  },
  {
    id: 'forest',
    name: '森林',
    icon: '🌲',
    tracks: [
      { id: 'forest', volume: 0.6 },
      { id: 'birds', volume: 0.4 },
    ],
  },
  {
    id: 'beach',
    name: '海边',
    icon: '🏖️',
    tracks: [
      { id: 'waves', volume: 0.8 },
      { id: 'wind', volume: 0.2 },
    ],
  },
  {
    id: 'night',
    name: '夜晚',
    icon: '🌙',
    tracks: [
      { id: 'brownnoise', volume: 0.5 },
      { id: 'wind', volume: 0.3 },
    ],
  },
  {
    id: 'focus',
    name: '专注',
    icon: '🎯',
    tracks: [
      { id: 'whitenoise', volume: 0.4 },
    ],
  },
]

// ---------------------------------------------------------------------------
// AudioEngine Class
// ---------------------------------------------------------------------------

class AudioEngine {
  private ctx: AudioContext | null = null
  private tracks: Map<string, TrackState> = new Map()
  private masterGain: GainNode | null = null
  private masterVolume = 0.8
  private initialized = false

  // Track change listeners
  private listeners: Set<() => void> = new Set()

  constructor() {
    // Load persisted state
    this.loadState()
  }

  // ---- Context management ----

  /**
   * Lazily initialize AudioContext on user interaction.
   * Browsers require AudioContext to be created/resumed after a user gesture.
   */
  private ensureContext(): AudioContext {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
      return this.ctx
    }

    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.masterVolume
      this.masterGain.connect(this.ctx.destination)
    } catch (err) {
      console.error('[AudioEngine] Failed to create AudioContext:', err)
      throw new Error('Web Audio API is not supported in this browser')
    }

    return this.ctx
  }

  /**
   * Initialize the engine. Call this once on first user interaction.
   */
  init(): void {
    if (this.initialized) return
    this.ensureContext()
    this.initialized = true
    this.notify()
  }

  // ---- Track operations ----

  /**
   * Play a track by ID. Creates the audio nodes if not already created.
   */
  play(trackId: string): void {
    const state = this.tracks.get(trackId)
    if (!state) return

    const ctx = this.ensureContext()

    if (state.config.type === 'generated' && state.config.generator) {
      this.playGeneratedTrack(state, ctx)
    } else if (state.config.type === 'file' && state.config.url) {
      this.playFileTrack(state, ctx)
    }

    state.config.isPlaying = true
    this.saveState()
    this.notify()
  }

  private playGeneratedTrack(state: TrackState, ctx: AudioContext): void {
    // If already has a noise node, just resume
    if (state.noiseNode && state.connected) {
      return
    }

    try {
      const noiseNode = createNoise(ctx, state.config.generator!)
      state.noiseNode = noiseNode

      // Connect: noiseNode -> gainNode -> masterGain
      noiseNode.output.connect(state.gainNode)
      if (this.masterGain) {
        state.gainNode.connect(this.masterGain)
      }
      state.connected = true
    } catch (err) {
      console.error(`[AudioEngine] Failed to create noise for ${state.config.id}:`, err)
    }
  }

  private playFileTrack(state: TrackState, ctx: AudioContext): void {
    // If already has an audio element, just play
    if (state.audioElement && state.connected) {
      state.audioElement.play().catch(() => {})
      return
    }

    try {
      const audio = new Audio(state.config.url)
      audio.crossOrigin = 'anonymous'
      audio.loop = true
      audio.preload = 'auto'

      const mediaSource = ctx.createMediaElementSource(audio)
      mediaSource.connect(state.gainNode)
      if (this.masterGain) {
        state.gainNode.connect(this.masterGain)
      }

      state.audioElement = audio
      state.mediaSource = mediaSource
      state.connected = true

      audio.play().catch((err) => {
        console.warn(`[AudioEngine] Failed to play file ${state.config.url}:`, err)
        // File might not exist - silently degrade
        state.config.isPlaying = false
        this.notify()
      })
    } catch (err) {
      console.error(`[AudioEngine] Failed to create audio element for ${state.config.id}:`, err)
    }
  }

  /**
   * Pause a track by ID. Keeps nodes around for quick resume.
   */
  pause(trackId: string): void {
    const state = this.tracks.get(trackId)
    if (!state || !state.config.isPlaying) return

    if (state.config.type === 'file' && state.audioElement) {
      state.audioElement.pause()
    }
    // For generated tracks, we disconnect to stop audio
    if (state.config.type === 'generated' && state.noiseNode && state.connected) {
      try { state.noiseNode.output.disconnect() } catch { /* noop */ }
      try { state.gainNode.disconnect() } catch { /* noop */ }
      state.connected = false
      // Dispose and recreate on next play for clean state
      state.noiseNode.dispose()
      state.noiseNode = undefined
    }

    state.config.isPlaying = false
    this.saveState()
    this.notify()
  }

  /**
   * Stop and fully clean up a track.
   */
  stop(trackId: string): void {
    const state = this.tracks.get(trackId)
    if (!state) return

    // Stop generated
    if (state.noiseNode) {
      state.noiseNode.dispose()
      state.noiseNode = undefined
    }

    // Stop file
    if (state.audioElement) {
      state.audioElement.pause()
      state.audioElement.src = ''
      state.audioElement = undefined
    }
    if (state.mediaSource) {
      try { state.mediaSource.disconnect() } catch { /* noop */ }
      state.mediaSource = undefined
    }

    // Disconnect gain
    try { state.gainNode.disconnect() } catch { /* noop */ }

    state.connected = false
    state.config.isPlaying = false
    this.saveState()
    this.notify()
  }

  /**
   * Set volume for a specific track (0-1).
   */
  setVolume(trackId: string, volume: number): void {
    const state = this.tracks.get(trackId)
    if (!state) return

    const clamped = Math.max(0, Math.min(1, volume))
    state.config.volume = clamped
    state.gainNode.gain.setTargetAtTime(
      state.config.isMuted ? 0 : clamped,
      this.ctx?.currentTime ?? 0,
      0.05,
    )
    this.saveState()
    this.notify()
  }

  /**
   * Toggle mute for a specific track.
   */
  toggleMute(trackId: string): void {
    const state = this.tracks.get(trackId)
    if (!state) return

    state.config.isMuted = !state.config.isMuted
    state.gainNode.gain.setTargetAtTime(
      state.config.isMuted ? 0 : state.config.volume,
      this.ctx?.currentTime ?? 0,
      0.05,
    )
    this.saveState()
    this.notify()
  }

  /**
   * Set master volume (0-1).
   */
  setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume))
    this.masterVolume = clamped
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx?.currentTime ?? 0, 0.05)
    }
    localStorage.setItem(MASTER_VOLUME_KEY, String(clamped))
    this.notify()
  }

  /**
   * Get master volume.
   */
  getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * Get all track configurations.
   */
  getTracks(): AudioTrack[] {
    return Array.from(this.tracks.values()).map((s) => ({ ...s.config }))
  }

  /**
   * Get a single track by ID.
   */
  getTrack(trackId: string): AudioTrack | undefined {
    const state = this.tracks.get(trackId)
    return state ? { ...state.config } : undefined
  }

  /**
   * Apply a preset: stop all tracks, then play the preset's tracks at specified volumes.
   */
  applyPreset(preset: TrackPreset): void {
    // Stop everything first
    this.tracks.forEach((_, id) => this.stop(id))

    // Apply preset
    for (const t of preset.tracks) {
      const state = this.tracks.get(t.id)
      if (!state) continue

      state.config.volume = t.volume
      state.config.isMuted = false
      state.gainNode.gain.value = t.volume
      this.play(t.id)
    }

    this.saveState()
    this.notify()
  }

  /**
   * Stop all tracks.
   */
  stopAll(): void {
    this.tracks.forEach((_, id) => this.stop(id))
  }

  /**
   * Reset all tracks to default volumes, all stopped.
   */
  reset(): void {
    this.tracks.forEach((state, id) => {
      this.stop(id)
      // Find default config
      const defaultTrack = DEFAULT_TRACKS.find((t) => t.id === id)
      if (defaultTrack) {
        state.config.volume = defaultTrack.volume
        state.config.isMuted = false
        state.gainNode.gain.value = defaultTrack.volume
      }
    })
    this.saveState()
    this.notify()
  }

  // ---- Subscription ----

  /**
   * Subscribe to track state changes. Returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.tracks.forEach((state) => {
      void state // ensure tracks are initialized
    })
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn())
  }

  // ---- Persistence ----

  private saveState(): void {
    try {
      const data: Record<string, { volume: number; isMuted: boolean; isPlaying: boolean }> = {}
      this.tracks.forEach((state, id) => {
        data[id] = {
          volume: state.config.volume,
          isMuted: state.config.isMuted,
          isPlaying: state.config.isPlaying,
        }
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { /* quota exceeded or private browsing */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(MASTER_VOLUME_KEY)
      if (raw !== null) {
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(raw) || 0.8))
      }
    } catch { /* noop */ }

    // Initialize track states
    for (const track of DEFAULT_TRACKS) {
      const ctx = this.ensureContext()
      const gainNode = ctx.createGain()
      gainNode.gain.value = track.volume

      const state: TrackState = {
        config: { ...track },
        gainNode,
        connected: false,
      }

      // Restore persisted volume/mute
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const data = JSON.parse(raw)
          if (data[track.id]) {
            state.config.volume = data[track.id].volume ?? track.volume
            state.config.isMuted = data[track.id].isMuted ?? false
            state.config.isPlaying = false // Don't auto-play on reload
            gainNode.gain.value = state.config.isMuted ? 0 : state.config.volume
          }
        }
      } catch { /* noop */ }

      this.tracks.set(track.id, state)
    }
  }

  // ---- Cleanup ----

  /**
   * Dispose all resources. Call when the component unmounts.
   */
  dispose(): void {
    this.tracks.forEach((_, id) => this.stop(id))
    this.tracks.clear()
    this.listeners.clear()

    if (this.masterGain) {
      try { this.masterGain.disconnect() } catch { /* noop */ }
      this.masterGain = null
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }

    this.initialized = false
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let instance: AudioEngine | null = null

/**
 * Get or create the singleton AudioEngine instance.
 */
export function getAudioEngine(): AudioEngine {
  if (!instance) {
    instance = new AudioEngine()
  }
  return instance
}

/**
 * Dispose the singleton. Useful for testing or full page reload.
 */
export function disposeAudioEngine(): void {
  if (instance) {
    instance.dispose()
    instance = null
  }
}
