/**
 * Web Audio API Noise Generators
 *
 * Procedurally generated ambient sounds using AudioBuffer and AudioNode.
 * No external audio files needed - everything is synthesized in real-time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NoiseType = 'white' | 'pink' | 'brown' | 'rain' | 'wind' | 'waves'

export interface NoiseNode {
  /** The output node to connect to the audio graph */
  output: GainNode
  /** Clean up all internal nodes */
  dispose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a looping white-noise buffer source.
 */
function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBufferSourceNode {
  const bufferSize = seconds * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

/**
 * Pink noise via the Voss-McCartney algorithm (direct, no filter needed).
 */
function createPinkNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBufferSourceNode {
  const bufferSize = seconds * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

/**
 * Brown noise via random walk (integration of white noise).
 */
function createBrownNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBufferSourceNode {
  const bufferSize = seconds * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  let last = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02 // leaky integrator
    data[i] = last * 3.5 // compensate for amplitude loss
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

// ---------------------------------------------------------------------------
// Noise type implementations
// ---------------------------------------------------------------------------

/**
 * White noise - equal energy at all frequencies.
 * Pure random samples.
 */
export function createWhiteNoise(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  const source = createNoiseBuffer(ctx)
  source.connect(output)
  source.start()

  return {
    output,
    dispose() {
      try { source.stop() } catch { /* already stopped */ }
      try { source.disconnect() } catch { /* noop */ }
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

/**
 * Pink noise - 1/f spectrum, sounds warmer than white.
 * Used as base for wind and other natural sounds.
 */
export function createPinkNoise(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  const source = createPinkNoiseBuffer(ctx)
  source.connect(output)
  source.start()

  return {
    output,
    dispose() {
      try { source.stop() } catch { /* noop */ }
      try { source.disconnect() } catch { /* noop */ }
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

/**
 * Brown noise - 1/f^2 spectrum, deep rumbling.
 * Used as base for ocean waves.
 */
export function createBrownNoise(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  const source = createBrownNoiseBuffer(ctx)
  source.connect(output)
  source.start()

  return {
    output,
    dispose() {
      try { source.stop() } catch { /* noop */ }
      try { source.disconnect() } catch { /* noop */ }
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

/**
 * Rain - white noise through a bandpass filter with random amplitude drops.
 * Simulates the splattering sound of rain.
 */
export function createRain(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  // Base noise
  const source = createNoiseBuffer(ctx)

  // Bandpass filter for "water" character
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 3000
  bandpass.Q.value = 0.5

  // Highpass to remove mud
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 800
  highpass.Q.value = 0.3

  // Lowpass to soften harshness
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 8000
  lowpass.Q.value = 0.7

  // Random amplitude modulation for "drip" character
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.7

  // Slow random modulation
  const modData = (() => {
    const bufLen = 4 * ctx.sampleRate
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      // Smooth random walk
      d[i] = 0.5 + Math.random() * 0.5
    }
    return buf
  })()
  const modSource = ctx.createBufferSource()
  modSource.buffer = modData
  modSource.loop = true
  const modGain = ctx.createGain()
  modGain.gain.value = 0.3
  modSource.connect(modGain)
  modGain.connect(lfoGain.gain)
  modSource.start()

  // Chain: source -> bandpass -> highpass -> lowpass -> lfoGain -> output
  source.connect(bandpass)
  bandpass.connect(highpass)
  highpass.connect(lowpass)
  lowpass.connect(lfoGain)
  lfoGain.connect(output)
  source.start()

  const nodes = [source, bandpass, highpass, lowpass, lfoGain, modSource, modGain]

  return {
    output,
    dispose() {
      try { modSource.stop() } catch { /* noop */ }
      nodes.forEach((n) => {
        try { n.disconnect() } catch { /* noop */ }
      })
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

/**
 * Wind - pink noise through lowpass filter with LFO modulation.
 * Simulates gentle gusting wind.
 */
export function createWind(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  // Base: pink noise (warmer than white)
  const source = createPinkNoiseBuffer(ctx)

  // Lowpass filter - the cutoff frequency is modulated by LFO
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 600
  lowpass.Q.value = 1.2

  // LFO to modulate filter cutoff (gusts)
  const lfoOsc = ctx.createOscillator()
  lfoOsc.type = 'sine'
  lfoOsc.frequency.value = 0.15 // very slow modulation

  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 400 // modulation depth

  lfoOsc.connect(lfoGain)
  lfoGain.connect(lowpass.frequency)
  lfoOsc.start()

  // Second LFO for volume modulation (breathing effect)
  const volLfo = ctx.createOscillator()
  volLfo.type = 'sine'
  volLfo.frequency.value = 0.08
  const volLfoGain = ctx.createGain()
  volLfoGain.gain.value = 0.3
  volLfo.connect(volLfoGain)

  const mainGain = ctx.createGain()
  mainGain.gain.value = 0.8
  volLfoGain.connect(mainGain.gain)
  volLfo.start()

  // Chain: source -> lowpass -> mainGain -> output
  source.connect(lowpass)
  lowpass.connect(mainGain)
  mainGain.connect(output)
  source.start()

  const nodes = [source, lowpass, lfoOsc, lfoGain, volLfo, volLfoGain, mainGain]

  return {
    output,
    dispose() {
      nodes.forEach((n) => {
        try {
          if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
            (n as AudioScheduledSourceNode).stop()
          }
        } catch { /* noop */ }
        try { n.disconnect() } catch { /* noop */ }
      })
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

/**
 * Waves - brown noise with slow amplitude modulation.
 * Simulates ocean waves crashing and receding.
 */
export function createWaves(ctx: AudioContext): NoiseNode {
  const output = ctx.createGain()
  output.gain.value = 1

  // Base: brown noise
  const source = createBrownNoiseBuffer(ctx)

  // Lowpass for deep ocean sound
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 400
  lowpass.Q.value = 0.8

  // Slow LFO for wave rhythm (amplitude modulation)
  const waveLfo = ctx.createOscillator()
  waveLfo.type = 'sine'
  waveLfo.frequency.value = 0.12 // ~8 second wave cycle

  const waveLfoGain = ctx.createGain()
  waveLfoGain.gain.value = 0.5

  const mainGain = ctx.createGain()
  mainGain.gain.value = 0.6

  // Connect LFO to main gain for wave-like amplitude modulation
  waveLfo.connect(waveLfoGain)
  waveLfoGain.connect(mainGain.gain)
  waveLfo.start()

  // Second LFO for subtle pitch shift
  const pitchLfo = ctx.createOscillator()
  pitchLfo.type = 'sine'
  pitchLfo.frequency.value = 0.06 // very slow
  const pitchLfoGain = ctx.createGain()
  pitchLfoGain.gain.value = 50
  pitchLfo.connect(pitchLfoGain)
  pitchLfoGain.connect(lowpass.frequency)
  pitchLfo.start()

  // Chain: source -> lowpass -> mainGain -> output
  source.connect(lowpass)
  lowpass.connect(mainGain)
  mainGain.connect(output)
  source.start()

  const nodes = [source, lowpass, waveLfo, waveLfoGain, mainGain, pitchLfo, pitchLfoGain]

  return {
    output,
    dispose() {
      nodes.forEach((n) => {
        try {
          if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
            (n as AudioScheduledSourceNode).stop()
          }
        } catch { /* noop */ }
        try { n.disconnect() } catch { /* noop */ }
      })
      try { output.disconnect() } catch { /* noop */ }
    },
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const generators: Record<NoiseType, (ctx: AudioContext) => NoiseNode> = {
  white: createWhiteNoise,
  pink: createPinkNoise,
  brown: createBrownNoise,
  rain: createRain,
  wind: createWind,
  waves: createWaves,
}

/**
 * Create a noise generator by type.
 * Returns a NoiseNode with an `output` GainNode ready to connect to the audio graph.
 */
export function createNoise(ctx: AudioContext, type: NoiseType): NoiseNode {
  const factory = generators[type]
  if (!factory) {
    throw new Error(`Unknown noise type: ${type}`)
  }
  return factory(ctx)
}

/** Human-readable labels for each noise type */
export const NOISE_LABELS: Record<NoiseType, string> = {
  white: '白噪音',
  pink: '粉红噪音',
  brown: '棕色噪音',
  rain: '雨声',
  wind: '风声',
  waves: '海浪',
}

/** Icons for each noise type (emoji) */
export const NOISE_ICONS: Record<NoiseType, string> = {
  white: '📻',
  pink: '🩷',
  brown: '🟤',
  rain: '🌧️',
  wind: '🌬️',
  waves: '🌊',
}
