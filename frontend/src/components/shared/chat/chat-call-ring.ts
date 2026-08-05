const RING_ON_MS = 1000
const RING_OFF_MS = 3000

let audioContext: AudioContext | null = null
let ringTimer: number | null = null
let activeOscillators: OscillatorNode[] = []

function getAudioContext() {
  if (typeof window === "undefined") return null
  const Ctx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  return audioContext
}

function playRingBurst() {
  const ctx = getAudioContext()
  if (!ctx) return

  void ctx.resume()

  const gain = ctx.createGain()
  gain.gain.value = 0.14
  gain.connect(ctx.destination)

  const freqs = [440, 480]
  const oscillators: OscillatorNode[] = []

  for (const freq of freqs) {
    const osc = ctx.createOscillator()
    osc.type = "sine"
    osc.frequency.value = freq
    osc.connect(gain)
    osc.start()
    oscillators.push(osc)
  }

  activeOscillators = oscillators

  window.setTimeout(() => {
    for (const osc of oscillators) {
      try {
        osc.stop()
      } catch {
        // already stopped
      }
    }
    activeOscillators = activeOscillators.filter((osc) => !oscillators.includes(osc))
  }, RING_ON_MS)
}

export function startCallRing() {
  stopCallRing()
  playRingBurst()
  ringTimer = window.setInterval(playRingBurst, RING_ON_MS + RING_OFF_MS)
}

export function stopCallRing() {
  if (ringTimer) {
    clearInterval(ringTimer)
    ringTimer = null
  }
  for (const osc of activeOscillators) {
    try {
      osc.stop()
    } catch {
      // ignore
    }
  }
  activeOscillators = []
}
