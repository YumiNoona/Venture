import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { Leva } from "leva"
import * as THREE from "three"
import Model from "./Model"
import CameraRig from "./CameraRig"
import useDebugControls from "./DebugControls"
import Tooltip from "./Tooltip"

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Mood Lo-Fi Audio Engine
// 5 procedural moods, each with distinct character.
// Randomly picks a new mood every 40-65 seconds and crossfades smoothly.
// No external files — everything synthesised via Web Audio API.
// ─────────────────────────────────────────────────────────────────────────────

// Each mood builder returns an array of AudioNode objects to be stopped/GC'd on swap
function buildMood(ctx, busGain, moodId) {
  const nodes = []
  const track = (n) => { nodes.push(n); return n }

  // Helper: create a filtered oscillator connected to busGain
  const osc = (type, freq, gainVal, detune = 0) => {
    const o = track(ctx.createOscillator())
    const g = track(ctx.createGain())
    o.type = type
    o.frequency.value = freq
    o.detune.value = detune
    g.gain.value = gainVal
    o.connect(g); g.connect(busGain)
    return o
  }

  // Helper: bandpass or lowpass filter node
  const filter = (type, freq, Q = 1) => {
    const f = track(ctx.createBiquadFilter())
    f.type = type; f.frequency.value = freq; f.Q.value = Q
    f.connect(busGain); return f
  }

  // Helper: filtered noise (white noise → filter → busGain)
  const noise = (gainVal, filterFreq, filterType = "bandpass", Q = 2) => {
    const bufSize = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src = track(ctx.createBufferSource())
    src.buffer = buf; src.loop = true
    const f = track(ctx.createBiquadFilter())
    f.type = filterType; f.frequency.value = filterFreq; f.Q.value = Q
    const g = track(ctx.createGain()); g.gain.value = gainVal
    src.connect(f); f.connect(g); g.connect(busGain)
    src.start(); return src
  }

  // Helper: slow LFO attached to a gain node (tremolo / filter sweep)
  const lfo = (targetParam, rate, depth, centerVal) => {
    const l = track(ctx.createOscillator())
    const lg = track(ctx.createGain())
    l.type = "sine"; l.frequency.value = rate
    lg.gain.value = depth
    // Set center manually
    targetParam.value = centerVal
    l.connect(lg); lg.connect(targetParam)
    l.start(); return l
  }

  // ── MOOD 0 · "Cozy Room" ───────────────────────────────────────────────────
  // Warm A-minor pentatonic pad, the classic lo-fi home base
  if (moodId === 0) {
    const FREQS = [110, 130.81, 146.83, 164.81, 196, 220]
    const lp = track(ctx.createBiquadFilter())
    lp.type = "lowpass"; lp.frequency.value = 800; lp.Q.value = 0.7
    lp.connect(busGain)
    FREQS.forEach((f, i) => {
      const o = track(ctx.createOscillator())
      const g = track(ctx.createGain())
      o.type = i % 2 === 0 ? "sine" : "triangle"
      o.frequency.value = f * (1 + (i % 2 === 0 ? 0.0007 : -0.0007))
      g.gain.value = 0.045 / FREQS.length
      o.connect(g); g.connect(lp)
      o.start(ctx.currentTime + i * 0.12)
    })
    // Slow tremolo LFO on the filter cutoff
    const lfoO = track(ctx.createOscillator())
    const lfoG = track(ctx.createGain())
    lfoO.frequency.value = 0.1; lfoG.gain.value = 120
    lp.frequency.value = 800
    lfoO.connect(lfoG); lfoG.connect(lp.frequency)
    lfoO.start()
  }

  // ── MOOD 1 · "Rainy Night" ─────────────────────────────────────────────────
  // Soft rain texture + sparse high plucks + deep bass drone
  else if (moodId === 1) {
    // Rain: bandpass-filtered white noise at several rain frequencies
    noise(0.018, 3000, "bandpass", 0.8)
    noise(0.012, 8000, "bandpass", 0.5)
    noise(0.008, 1200, "lowpass",  1.0)

    // Deep bass drone — E1
    const bassO = osc("sine", 41.2, 0.055, 0)
    bassO.start()

    // Sparse high plucks — G4, A4, C5 arpeggiated slowly
    const pluckFreqs = [392, 440, 523.25, 392, 523.25, 440]
    const pluckTimes = [0,    2.8, 5.5,  9.1,  12.4,  16.2]
    pluckFreqs.forEach((pf, i) => {
      const po = track(ctx.createOscillator())
      const pg = track(ctx.createGain())
      po.type = "sine"; po.frequency.value = pf
      const t0 = ctx.currentTime + pluckTimes[i % pluckTimes.length] + Math.random() * 0.3
      pg.gain.setValueAtTime(0, t0)
      pg.gain.linearRampToValueAtTime(0.045, t0 + 0.01)
      pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8)
      po.connect(pg); pg.connect(busGain)
      po.start(t0); po.stop(t0 + 1.9)
    })
  }

  // ── MOOD 2 · "Deep Focus" ──────────────────────────────────────────────────
  // Low sub drone, slow beating, meditative and minimal
  else if (moodId === 2) {
    // Twin detuned subs create slow beating (~0.5 Hz = 1 beat/2sec)
    const freqA = 55, freqB = 55.28
    const sA = osc("sine", freqA,  0.06);  sA.start()
    const sB = osc("sine", freqB,  0.05);  sB.start()
    // 5th harmonic overtone, very quiet
    const s5 = osc("triangle", 82.5, 0.018); s5.start()
    // Very slow filter sweep
    const lp = track(ctx.createBiquadFilter())
    lp.type = "lowpass"; lp.frequency.value = 400; lp.Q.value = 1.5
    // Detach sA from busGain and route through filter instead
    // (We already connected above, so just add a parallel path through filter)
    const reSrc = osc("sine", 110, 0.025); reSrc.start()
    // Slow LFO on filter cutoff: 300–700 Hz over 8s
    const lfoO2 = track(ctx.createOscillator())
    const lfoG2 = track(ctx.createGain())
    lfoO2.frequency.value = 0.07; lfoG2.gain.value = 180
    lp.frequency.value = 500
    lfoO2.connect(lfoG2); lfoG2.connect(lp.frequency)
    lfoO2.start()
    reSrc.connect(lp); lp.connect(busGain)
  }

  // ── MOOD 3 · "Dawn Light" ──────────────────────────────────────────────────
  // Brighter C-major pentatonic, slightly faster, optimistic
  else if (moodId === 3) {
    // C major pentatonic: C3, E3, G3, A3, C4, E4
    const FREQS = [130.81, 164.81, 196, 220, 261.63, 329.63]
    FREQS.forEach((f, i) => {
      const o = track(ctx.createOscillator())
      const g = track(ctx.createGain())
      o.type = i < 3 ? "sine" : "triangle"
      o.frequency.value = f * (1 + (i % 2 === 0 ? 0.0005 : -0.0009))
      g.gain.value = 0.048 / FREQS.length
      o.connect(g); g.connect(busGain)
      o.start(ctx.currentTime + i * 0.08)
    })
    // Faster tremolo than cozy room
    const lp = track(ctx.createBiquadFilter())
    lp.type = "lowpass"; lp.frequency.value = 1200; lp.Q.value = 0.5
    lp.connect(busGain)
    const highO = osc("sine", 523.25, 0.012); highO.start()
    // Gentle high LFO ping-pong 
    const lfoO = track(ctx.createOscillator())
    const lfoG = track(ctx.createGain())
    lfoO.frequency.value = 0.22; lfoG.gain.value = 0.008
    lfoO.connect(lfoG); lfoG.connect(busGain.gain)
    lfoO.start()
  }

  // ── MOOD 4 · "Vinyl Haze" ─────────────────────────────────────────────────
  // Detuned warm chords + vinyl crackle texture + tape warble LFO
  else if (moodId === 4) {
    // Vinyl crackle: sparse low-level noise bursts
    noise(0.014, 4500, "bandpass", 0.4)   // hiss
    noise(0.008, 12000, "highpass", 0.3)   // sibilance

    // Warm chord: Am7 — A, C, E, G
    const CHORD = [110, 130.81, 164.81, 196]
    CHORD.forEach((f, i) => {
      const o = track(ctx.createOscillator())
      const g = track(ctx.createGain())
      // Heavy detuning for that worn cassette feel
      o.type = "triangle"
      o.frequency.value = f
      g.gain.value = 0.055 / CHORD.length
      o.connect(g); g.connect(busGain)
      o.start(ctx.currentTime + i * 0.06)
    })
    // Tape warble: slow sinusoidal pitch drift on all oscillators via master detune
    // (applied via a shared detune LFO — simulated with a filter wobble)
    const lp = track(ctx.createBiquadFilter())
    lp.type = "lowpass"; lp.frequency.value = 700; lp.Q.value = 1.2
    lp.connect(busGain)
    const warbleO = track(ctx.createOscillator())
    const warbleG = track(ctx.createGain())
    warbleO.frequency.value = 0.18   // ~0.18 Hz = tape warble
    warbleG.gain.value = 80
    lp.frequency.value = 700
    warbleO.connect(warbleG); warbleG.connect(lp.frequency)
    warbleO.start()
  }

  return nodes
}

const MOOD_NAMES  = ["Cozy Room", "Rainy Night", "Deep Focus", "Dawn Light", "Vinyl Haze"]
const MOOD_EMOJIS = ["🛋", "🌧", "🎯", "🌅", "📼"]
// How long each mood plays before crossfading to a new random one (ms)
const MOOD_DURATION_MIN = 40_000
const MOOD_DURATION_MAX = 65_000
const CROSSFADE_DURATION = 4.0  // seconds

function useAmbientAudio() {
  const ctxRef       = useRef(null)
  const masterRef    = useRef(null)   // master gain → destination
  const busARef      = useRef(null)   // current mood's bus gain
  const busBRef      = useRef(null)   // incoming mood's bus gain (crossfade target)
  const nodesARef    = useRef([])     // current mood's oscillator nodes
  const nodesBRef    = useRef([])
  const startedRef   = useRef(false)
  const moodTimerRef = useRef(null)
  const currentMood  = useRef(0)

  const [muted,     setMuted]     = useState(false)
  const [moodName,  setMoodName]  = useState(MOOD_NAMES[0])
  const [moodEmoji, setMoodEmoji] = useState(MOOD_EMOJIS[0])

  // Pick a random mood index different from current
  const pickNextMood = (cur) => {
    let next
    do { next = Math.floor(Math.random() * MOOD_NAMES.length) } while (next === cur)
    return next
  }

  const crossfadeToMood = useCallback((nextId) => {
    const ctx = ctxRef.current
    if (!ctx || !masterRef.current) return

    const now = ctx.currentTime
    const cf  = CROSSFADE_DURATION

    // Build incoming mood on busB, gain starts at 0
    const busB = ctx.createGain()
    busB.gain.setValueAtTime(0, now)
    busB.connect(masterRef.current)
    busBRef.current = busB

    const nodesB = buildMood(ctx, busB, nextId)
    nodesBRef.current = nodesB

    // Fade in new
    busB.gain.linearRampToValueAtTime(1.0, now + cf)

    // Fade out old bus
    if (busARef.current) {
      busARef.current.gain.cancelScheduledValues(now)
      busARef.current.gain.setValueAtTime(busARef.current.gain.value, now)
      busARef.current.gain.linearRampToValueAtTime(0, now + cf)
    }

    // After crossfade, stop old nodes and swap refs
    setTimeout(() => {
      nodesARef.current.forEach(n => { try { n.stop?.() } catch(e) {} })
      nodesARef.current = nodesBRef.current
      nodesBRef.current = []
      if (busARef.current) busARef.current.disconnect()
      busARef.current = busBRef.current
      busBRef.current = null
    }, cf * 1000 + 200)

    currentMood.current = nextId
    setMoodName(MOOD_NAMES[nextId])
    setMoodEmoji(MOOD_EMOJIS[nextId])

    // Schedule next crossfade
    const nextIn = MOOD_DURATION_MIN + Math.random() * (MOOD_DURATION_MAX - MOOD_DURATION_MIN)
    moodTimerRef.current = setTimeout(() => {
      crossfadeToMood(pickNextMood(nextId))
    }, nextIn)
  }, [])

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx

      // Master gain — fades in over 3s
      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 3)
      master.connect(ctx.destination)
      masterRef.current = master

      // Start initial mood (random pick on first load)
      const firstMood = Math.floor(Math.random() * MOOD_NAMES.length)
      currentMood.current = firstMood
      setMoodName(MOOD_NAMES[firstMood])
      setMoodEmoji(MOOD_EMOJIS[firstMood])

      const busA = ctx.createGain()
      busA.gain.value = 1.0
      busA.connect(master)
      busARef.current = busA

      const nodesA = buildMood(ctx, busA, firstMood)
      nodesARef.current = nodesA

      // Schedule first auto-crossfade
      const nextIn = MOOD_DURATION_MIN + Math.random() * (MOOD_DURATION_MAX - MOOD_DURATION_MIN)
      moodTimerRef.current = setTimeout(() => {
        crossfadeToMood(pickNextMood(firstMood))
      }, nextIn)

    } catch(e) { console.warn("Audio init failed:", e) }
  }, [crossfadeToMood])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      if (masterRef.current && ctxRef.current) {
        const now = ctxRef.current.currentTime
        masterRef.current.gain.cancelScheduledValues(now)
        masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now)
        masterRef.current.gain.linearRampToValueAtTime(next ? 0 : 0.75, now + 0.7)
      }
      return next
    })
  }, [])

  // Manual mood skip — jumps immediately to a random new mood
  const skipMood = useCallback(() => {
    if (!startedRef.current) return
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
    crossfadeToMood(pickNextMood(currentMood.current))
  }, [crossfadeToMood])

  return { start, muted, toggleMute, skipMood, moodName, moodEmoji }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Orbit Controls — mouse + touch, yields to CameraRig via lockedRef
// ─────────────────────────────────────────────────────────────────────────────
function CustomOrbitControls({ enabled, selected, lockedRef }) {
  const { camera, gl } = useThree()
  const state = useRef({
    isOrbiting: false, isPanning: false,
    lastX: 0, lastY: 0,
    lastDist: 0,
    theta: Math.atan2(8, 8),
    phi:   Math.atan2(Math.sqrt(64 + 64), 5),
    radius: Math.sqrt(8*8 + 5*5 + 8*8),
    target:    new THREE.Vector3(0, 1.5, 0),
    panTarget: new THREE.Vector3(0, 1.5, 0),
    wasLocked: false,
  })

  useEffect(() => {
    const el = gl.domElement, s = state.current

    const onMouseDown = (e) => {
      if (!enabled || lockedRef.current) return
      if (e.button === 0) s.isOrbiting = true
      if (e.button === 2) s.isPanning  = true
      s.lastX = e.clientX; s.lastY = e.clientY
    }
    const onMouseMove = (e) => {
      if (!s.isOrbiting && !s.isPanning) return
      applyDelta(e.clientX - s.lastX, e.clientY - s.lastY, s)
      s.lastX = e.clientX; s.lastY = e.clientY
    }
    const onMouseUp  = () => { s.isOrbiting = false; s.isPanning = false }
    const onWheel    = (e) => {
      if (!enabled || lockedRef.current) return
      s.radius = Math.max(3, Math.min(22, s.radius + e.deltaY * 0.01))
    }
    const preventCtx = (e) => e.preventDefault()

    const onTouchStart = (e) => {
      if (!enabled || lockedRef.current) return
      if (e.touches.length === 1) {
        s.isOrbiting = true
        s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        s.isOrbiting = false; s.isPanning = false
        s.lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
      }
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && s.isOrbiting) {
        applyDelta(e.touches[0].clientX - s.lastX, e.touches[0].clientY - s.lastY, s)
        s.lastX = e.touches[0].clientX; s.lastY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        s.radius = Math.max(3, Math.min(22, s.radius - (dist - s.lastDist) * 0.04))
        s.lastDist = dist
      }
    }
    const onTouchEnd = () => { s.isOrbiting = false; s.isPanning = false }

    function applyDelta(dx, dy, s) {
      if (s.isOrbiting) {
        s.theta -= dx * 0.005
        s.phi = Math.max(0.1, Math.min(Math.PI / 2.1, s.phi - dy * 0.005))
      }
      if (s.isPanning) {
        const right = new THREE.Vector3()
        right.crossVectors(camera.getWorldDirection(new THREE.Vector3()), new THREE.Vector3(0,1,0)).normalize()
        const ps = s.radius * 0.001
        s.panTarget.addScaledVector(right, -dx * ps)
        s.panTarget.addScaledVector(new THREE.Vector3(0,1,0), dy * ps)
      }
    }

    el.addEventListener("mousedown",   onMouseDown)
    window.addEventListener("mousemove",  onMouseMove)
    window.addEventListener("mouseup",    onMouseUp)
    el.addEventListener("wheel",       onWheel,      { passive: false })
    el.addEventListener("contextmenu", preventCtx)
    el.addEventListener("touchstart",  onTouchStart, { passive: false })
    el.addEventListener("touchmove",   onTouchMove,  { passive: false })
    el.addEventListener("touchend",    onTouchEnd)
    return () => {
      el.removeEventListener("mousedown",   onMouseDown)
      window.removeEventListener("mousemove",  onMouseMove)
      window.removeEventListener("mouseup",    onMouseUp)
      el.removeEventListener("wheel",       onWheel)
      el.removeEventListener("contextmenu", preventCtx)
      el.removeEventListener("touchstart",  onTouchStart)
      el.removeEventListener("touchmove",   onTouchMove)
      el.removeEventListener("touchend",    onTouchEnd)
    }
  }, [enabled, gl, camera, lockedRef])

  useFrame(() => {
    const s = state.current, locked = lockedRef.current
    if (s.wasLocked && !locked) {
      const offset = camera.position.clone().sub(s.target)
      s.radius = offset.length()
      s.phi    = Math.acos(Math.max(-1, Math.min(1, offset.y / s.radius)))
      s.theta  = Math.atan2(offset.x, offset.z)
      s.panTarget.copy(s.target)
    }
    s.wasLocked = locked
    if (locked) return
    s.target.lerp(s.panTarget, 0.08)
    const x = s.target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta)
    const y = s.target.y + s.radius * Math.cos(s.phi)
    const z = s.target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta)
    camera.position.set(x, y, z)
    camera.lookAt(s.target)
  })

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Day / Night lighting
// ─────────────────────────────────────────────────────────────────────────────
function DayNightSystem({ debug, nightMode }) {
  const { scene } = useThree()
  const progress  = useRef(nightMode ? 1 : 0)
  const ambRef = useRef(), dirRef = useRef(), fillRef = useRef()

  useFrame(() => {
    const speed  = debug?.nightTransitionSpeed ?? 0.03
    const target = nightMode ? 1 : 0
    progress.current += (target - progress.current) * speed * 3
    const p = progress.current, invP = 1 - p

    if (ambRef.current) {
      ambRef.current.intensity = (debug?.ambientIntensity ?? 0.5) * invP + (debug?.nightAmbient ?? 0.015) * p
      ambRef.current.color.setRGB(0.9*invP+0.05*p, 0.88*invP+0.05*p, 0.82*invP+0.08*p)
    }
    if (dirRef.current) {
      dirRef.current.intensity = (debug?.directionalIntensity ?? 2.0) * invP * invP
      dirRef.current.position.set(debug?.lightX??6, (debug?.lightY??10)*invP - 5*p, debug?.lightZ??6)
      dirRef.current.color.setRGB(1.0, 0.88 - p*0.4, 0.7 - p*0.7)
    }
    if (fillRef.current) {
      fillRef.current.intensity = (debug?.fillLight??0.2)*invP + (debug?.nightFillLight??0.02)*p
      fillRef.current.color.setRGB(0.4+invP*0.2, 0.45+invP*0.15, 1.0)
    }
    scene.background = new THREE.Color().setRGB(
      0.055*invP + 0.008*p, 0.055*invP + 0.006*p, 0.067*invP + 0.010*p,
    )
  })

  return (
    <>
      <ambientLight     ref={ambRef} intensity={debug?.ambientIntensity ?? 0.5} />
      <directionalLight ref={dirRef}
        position={[debug?.lightX??6, debug?.lightY??10, debug?.lightZ??6]}
        intensity={debug?.directionalIntensity ?? 2}
        castShadow shadow-mapSize={[2048,2048]}
        shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12}  shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <pointLight ref={fillRef} position={[-5,3,-5]} intensity={debug?.fillLight??0.2} castShadow={false} />
    </>
  )
}

function SeamlessBackground({ nightMode }) {
  const { scene } = useThree()
  const progress  = useRef(nightMode ? 1 : 0)
  useFrame(() => {
    const target = nightMode ? 1 : 0
    progress.current += (target - progress.current) * 0.04
    const p = progress.current
    scene.fog = new THREE.FogExp2(
      new THREE.Color().setRGB(0.04*(1-p)+0.005*p, 0.04*(1-p)+0.004*p, 0.05*(1-p)+0.006*p),
      0.038 + p * 0.018,
    )
  })
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Buttons
// ─────────────────────────────────────────────────────────────────────────────
function CozyButton({ label, active, onClick, icon, title }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      style={{
        background: active ? "#2a1f0e" : hov ? "#1a1208" : "#0f0905",
        border: `2px solid ${active ? "#c9973a" : hov ? "#6b4c2a" : "#2e1f0e"}`,
        borderRadius: 10, color: active ? "#e8c87a" : hov ? "#b8925a" : "#6b4c2a",
        padding: "7px 16px", fontSize: 13, cursor: "pointer",
        fontFamily: "'Caveat', cursive", fontWeight: 600, letterSpacing: "0.04em",
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active ? "0 0 16px rgba(201,151,58,0.25)" : hov ? "0 2px 8px rgba(0,0,0,0.4)" : "none",
        transform: hov && !active ? "translateY(-1px)" : "none",
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
      }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {label}
    </button>
  )
}

// Camera presets
const ANGLE_PRESETS = [
  { label: "Side View", icon: "◢", pos: new THREE.Vector3(12, 5, 0),   target: new THREE.Vector3(0, 1.5, 0) },
  { label: "Top View",  icon: "↓", pos: new THREE.Vector3(0, 18, 0.5), target: new THREE.Vector3(0, 0, 0)   },
]

// ─────────────────────────────────────────────────────────────────────────────
// Camera mode debug overlay
// ─────────────────────────────────────────────────────────────────────────────
function CameraModeOverlay({ mode }) {
  const colors = { orbit:"#22d3ee", preset:"#c9973a", selected:"#a3e635", returning:"#e879f9" }
  return (
    <div style={{
      position:"fixed", bottom:56, left:18, zIndex:30,
      fontFamily:"'Caveat', cursive", fontSize:12,
      background:"#0f0905", border:`1.5px solid ${colors[mode]??'#3d2a15'}`,
      borderRadius:8, padding:"3px 10px",
      color: colors[mode]??'#6b4c2a',
      display:"flex", alignItems:"center", gap:6, opacity:0.85,
      transition:"border-color 0.3s, color 0.3s",
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:colors[mode]??'#3d2a15', display:"inline-block", flexShrink:0 }}/>
      cam: {mode}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scene
// ─────────────────────────────────────────────────────────────────────────────
export default function Scene({ selected, setSelected, hovered, setHovered, nightMode, onDarkModeToggle }) {
  const debug = useDebugControls()
  const [tooltipPos, setTooltipPos]     = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [cameraMode, setCameraMode]     = useState("orbit")

  const cameraLockedRef = useRef(false)

  const { start: startAudio, muted, toggleMute, skipMood, moodName, moodEmoji } = useAmbientAudio()

  useEffect(() => {
    if (selected || activePreset !== null) cameraLockedRef.current = true
  }, [selected, activePreset])

  const onCameraMode = useCallback((mode) => {
    setCameraMode(mode)
    cameraLockedRef.current = mode !== "orbit"
  }, [])

  const handlePreset = (idx) => {
    const next = activePreset === idx ? null : idx
    setActivePreset(next)
    setSelected(null)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap" rel="stylesheet" />
      <Leva collapsed={true} titleBar={{ title: "⚙ Debug" }} />
      <Tooltip hovered={hovered} position={tooltipPos} />

      {/* ── Top-right controls ── */}
      <div style={{
        position:"fixed", top:18, right: selected ? 358 : 18, zIndex:30,
        display:"flex", gap:8, alignItems:"center",
        transition:"right 0.45s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Music: mute toggle + skip button + mood name */}
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <CozyButton
            icon={muted ? "🔇" : moodEmoji}
            label={muted ? "Muted" : moodName}
            active={!muted}
            onClick={() => { startAudio(); toggleMute() }}
            title={`Current mood: ${moodName}. Click to ${muted ? "unmute" : "mute"}`}
          />
          {/* Skip button — cycles to a random new mood instantly */}
          <button
            onClick={() => { startAudio(); skipMood() }}
            title="Skip to next mood"
            style={{
              background:"#0f0905", border:"2px solid #2e1f0e",
              borderRadius:10, color:"#6b4c2a", width:34, height:34,
              cursor:"pointer", fontFamily:"'Caveat', cursive", fontSize:14,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.18s", flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#6b4c2a"; e.currentTarget.style.color="#b8925a" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="#2e1f0e"; e.currentTarget.style.color="#6b4c2a" }}
          >⏭</button>
        </div>

        {ANGLE_PRESETS.map((p, i) => (
          <CozyButton
            key={i} label={p.label} icon={p.icon}
            active={activePreset === i}
            onClick={() => handlePreset(i)}
            title={`Switch to ${p.label}`}
          />
        ))}
      </div>

      {/* ── Night mode pill ── */}
      {nightMode && (
        <div style={{
          position:"fixed", bottom:22, left:"50%", transform:"translateX(-50%)",
          zIndex:30, background:"#0f0905", border:"2px solid #3d2a15",
          borderRadius:24, padding:"7px 18px",
          fontFamily:"'Caveat', cursive", fontSize:14, fontWeight:600,
          color:"#c9973a", letterSpacing:"0.05em",
          display:"flex", alignItems:"center", gap:8,
          boxShadow:"0 0 20px rgba(201,151,58,0.15)",
          animation:"cozyFadeIn 0.4s ease",
        }}>
          <span>🕯</span>
          <span>Night mode — click the candle to return to day</span>
        </div>
      )}

      {/* ── Controls hint ── */}
      <div style={{
        position:"fixed", bottom:18, left:18, zIndex:30,
        display:"flex", gap:10, alignItems:"center", opacity:0.55,
      }}>
        {[
          { icon:"🖱", label:"Drag to orbit" },
          { icon:"✋", label:"Right-drag pan" },
          { icon:"🔍", label:"Scroll / pinch zoom" },
        ].map((h,i) => (
          <div key={i} style={{
            fontFamily:"'Caveat', cursive", fontSize:12, color:"#6b4c2a",
            background:"#0f0905", border:"1.5px solid #2e1f0e",
            borderRadius:8, padding:"3px 10px",
            display:"flex", alignItems:"center", gap:4,
          }}>
            <span>{h.icon}</span><span>{h.label}</span>
          </div>
        ))}
      </div>

      <CameraModeOverlay mode={cameraMode} />

      {/* ── Canvas ── */}
      <Canvas
        shadows dpr={[1, 2]}
        camera={{ position: [8, 5, 8], fov: debug?.fov ?? 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true, powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ width:"100vw", height:"100vh" }}
        onPointerMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
        onClick={() => startAudio()}
      >
        <DayNightSystem debug={debug} nightMode={nightMode} />
        <SeamlessBackground nightMode={nightMode} />

        <Suspense fallback={null}>
          <Model
            hovered={hovered} setHovered={setHovered}
            selected={selected} setSelected={setSelected}
            debug={debug} onDarkModeToggle={onDarkModeToggle} nightMode={nightMode}
          />
          <Environment
            preset={nightMode ? "night" : "warehouse"} background={false}
            intensity={nightMode ? (debug?.nightEnvIntensity ?? 0.04) : 1.0}
          />
        </Suspense>

        <CameraRig
          selected={selected} debug={debug}
          presetTarget={activePreset !== null ? ANGLE_PRESETS[activePreset] : null}
          cameraLockedRef={cameraLockedRef}
          onModeChange={onCameraMode}
        />
        <CustomOrbitControls enabled={true} selected={selected} lockedRef={cameraLockedRef} />

        <EffectComposer>
          <Bloom
            intensity={nightMode ? (debug?.nightBloomIntensity ?? 1.2) : (debug?.bloomIntensity ?? 0.3)}
            luminanceThreshold={nightMode ? (debug?.nightBloomThreshold ?? 0.3) : (debug?.bloomThreshold ?? 0.8)}
            luminanceSmoothing={0.4} mipmapBlur={false}
          />
          <Vignette
            offset={0.3}
            darkness={nightMode ? (debug?.nightVignette ?? 0.6) : (debug?.vignetteStrength ?? 0.28)}
          />
        </EffectComposer>
      </Canvas>

      <style>{`
        @keyframes cozyFadeIn {
          from { opacity:0; transform:translateX(-50%) translateY(6px) }
          to   { opacity:1; transform:translateX(-50%) translateY(0) }
        }
      `}</style>
    </>
  )
}
