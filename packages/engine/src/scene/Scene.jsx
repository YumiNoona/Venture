import { Canvas, useThree, useFrame } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { Leva } from "leva"
import * as THREE from "three"
import Model from "./Model"
import ErrorBoundary from "./ErrorBoundary"
import CameraRig from "./CameraRig"
import useDebugControls from "./DebugControls"
import Tooltip from "./Tooltip"
import DustMotes from "./DustMotes"
import CursorSparkle from "./CursorSparkle"
import WeatherSystem from "./WeatherSystem"
import VolumeSlider from "./VolumeSlider"
import WallClock from "./WallClock"
import KeyboardHelp, { useKeyboardShortcuts } from "./KeyboardHelp"
import { useSeasonalTheme, SeasonButton } from "./SeasonalTheme"
import InfoPanel from "./InfoPanel"
import {
  UIThemeProvider, useUITheme,
  ThemedButton, ThemeToggleButton,
} from "@venture/ui"

// ── Detect mobile ─────────────────────────────────────────────────────────────
const isMobile = () => {
  if (typeof window === "undefined") return false
  return window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
}

// ── Time-of-day auto night ────────────────────────────────────────────────────
function shouldAutoNight() {
  const h = new Date().getHours()
  return h >= 20 || h < 6
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio — pure sine pads + bell melodies + spatial panning
// Static-free: no Karplus-Strong, no raw noise, only filtered smoothed noise
// Spatial: PannerNode places music at the room's focal point
// ─────────────────────────────────────────────────────────────────────────────

function makeReverb(ctx, busGain, nodes, wet = 0.16) {
  const track  = (n) => { nodes.push(n); return n }
  const input  = track(ctx.createGain()); input.gain.value = 1.0
  const output = track(ctx.createGain()); output.gain.value = wet
  output.connect(busGain)
  ;[0.013, 0.021, 0.031].forEach((dt, i) => {
    const d = track(ctx.createDelay(0.5)); d.delayTime.value = dt
    const g = track(ctx.createGain());    g.gain.value = 0.18 - i * 0.04
    const f = track(ctx.createBiquadFilter())
    f.type = "lowpass"; f.frequency.value = 900 - i * 120; f.Q.value = 0.2
    input.connect(d); d.connect(f); f.connect(g); g.connect(output)
    g.connect(d)
  })
  return input
}

function bellNote(ctx, busGain, reverb, freq, vol, t0, decay, nodes) {
  const track = (n) => { nodes.push(n); return n }
  const osc  = track(ctx.createOscillator())
  const osc2 = track(ctx.createOscillator())
  const env  = track(ctx.createGain())
  osc.type  = "sine"; osc.frequency.value = freq
  osc2.type = "sine"; osc2.frequency.value = freq * 2.756
  osc.connect(env); osc2.connect(env)
  env.connect(busGain)
  if (reverb) env.connect(reverb)
  env.gain.setValueAtTime(0, t0)
  env.gain.linearRampToValueAtTime(vol,    t0 + 0.008)
  env.gain.setValueAtTime(vol,             t0 + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + decay)
  osc.start(t0);  osc.stop(t0 + decay + 0.05)
  osc2.start(t0); osc2.stop(t0 + decay * 0.6)
}

function scheduleBells(ctx, busGain, reverb, freqs, times, loopLen, vol, nodes) {
  const timers = []
  let loopStart = ctx.currentTime
  function loop() {
    freqs.forEach((f, i) => bellNote(ctx, busGain, reverb, f, vol, loopStart + times[i], 2.5, nodes))
    loopStart += loopLen
    timers.push(setTimeout(loop, (loopLen - 0.5) * 1000))
  }
  loop()
  nodes.push({ stop: () => timers.forEach(clearTimeout) })
}

function padChord(ctx, busGain, reverb, freqs, vol, nodes, lpHz = 900) {
  const track = (n) => { nodes.push(n); return n }
  const lp = track(ctx.createBiquadFilter())
  lp.type = "lowpass"; lp.frequency.value = lpHz; lp.Q.value = 0.25
  lp.connect(busGain)
  if (reverb) lp.connect(reverb)
  const perVoice = Math.min(vol / freqs.length * 0.28, 0.06)
  freqs.forEach((f, i) => {
    const o  = track(ctx.createOscillator())
    const o2 = track(ctx.createOscillator())
    const g  = track(ctx.createGain())
    o.type  = "sine"; o.frequency.value  = f * (1 + i * 0.0002)
    o2.type = "sine"; o2.frequency.value = f * (1 - i * 0.0003)
    g.gain.value = perVoice
    o.connect(g); o2.connect(g); g.connect(lp)
    o.start(ctx.currentTime + i * 0.06)
    o2.start(ctx.currentTime + i * 0.09)
  })
  const lfo = track(ctx.createOscillator())
  const lfoG = track(ctx.createGain())
  lfo.type = "sine"; lfo.frequency.value = 0.06; lfoG.gain.value = 70
  lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start()
}

// Minimal texture — heavily filtered, extremely quiet, no raw noise
function addTexture(ctx, busGain, nodes, vol, hpHz = 2000, lpHz = 7000) {
  if (vol <= 0) return
  const track = (n) => { nodes.push(n); return n }
  const sr = ctx.sampleRate
  const buf = ctx.createBuffer(1, sr * 6, sr)
  const d = buf.getChannelData(0)
  let prev = 0
  for (let i = 0; i < d.length; i++) {
    // Very heavy smoothing: 0.96 coefficient → barely any high freq
    prev = prev * 0.96 + (Math.random() * 2 - 1) * 0.04
    d[i] = prev
  }
  const src = track(ctx.createBufferSource()); src.buffer = buf; src.loop = true
  const hp  = track(ctx.createBiquadFilter()); hp.type = "highpass"; hp.frequency.value = hpHz; hp.Q.value = 0.2
  const lp2 = track(ctx.createBiquadFilter()); lp2.type = "lowpass"; lp2.frequency.value = lpHz; lp2.Q.value = 0.2
  const g   = track(ctx.createGain());         g.gain.value = vol
  src.connect(hp); hp.connect(lp2); lp2.connect(g); g.connect(busGain)
  src.start()
}

function buildMood(ctx, busGain, moodId, cfg = {}) {
  const nodes  = []
  const rv     = makeReverb(ctx, busGain, nodes, cfg.audioReverbWet ?? 0.14)
  const padMul = cfg.audioPadVol    ?? 1.0
  const melMul = cfg.audioMelodyVol ?? 1.0
  const lpHz   = cfg.audioLowpassHz ?? 900
  // Very low texture — barely audible, just adds room feel
  const hiss   = Math.min(cfg.audioHissVol ?? 0.002, 0.004)

  if (moodId === 0) {
    padChord(ctx, busGain, rv, [87.31, 110, 130.81, 164.81], 0.09 * padMul, nodes, lpHz)
    scheduleBells(ctx, busGain, rv,
      [349.23, 392, 440, 523.25, 587.33, 523.25, 440],
      [0, 1.4, 2.8, 4.2, 5.8, 7.4, 9.0],
      11.0, 0.028 * melMul, nodes)
    // Barely-there room texture
    addTexture(ctx, busGain, nodes, hiss * 0.5, 5000, 9000)
  }
  else if (moodId === 1) {
    // Rain: gentle lower-band filtered noise only — no harsh hiss
    addTexture(ctx, busGain, nodes, hiss * 1.8, 800, 3500)
    padChord(ctx, busGain, rv, [73.42, 87.31, 110, 130.81], 0.08 * padMul, nodes, Math.min(lpHz, 800))
    scheduleBells(ctx, busGain, rv,
      [587.33, 523.25, 440, 523.25],
      [0, 5.0, 11.0, 17.0],
      22.0, 0.018 * melMul, nodes)
  }
  else if (moodId === 2) {
    padChord(ctx, busGain, rv, [55, 82.41, 110, 130.81], 0.07 * padMul, nodes, Math.min(lpHz, 750))
    const b1 = nodes[nodes.push(ctx.createOscillator())-1]; const bg1 = nodes[nodes.push(ctx.createGain())-1]
    const b2 = nodes[nodes.push(ctx.createOscillator())-1]; const bg2 = nodes[nodes.push(ctx.createGain())-1]
    b1.type = "sine"; b1.frequency.value = 55;    bg1.gain.value = 0.016
    b2.type = "sine"; b2.frequency.value = 55.18; bg2.gain.value = 0.014
    b1.connect(bg1); bg1.connect(busGain)
    b2.connect(bg2); bg2.connect(busGain)
    b1.start(); b2.start()
    scheduleBells(ctx, busGain, rv, [880, 783.99], [0, 7.0], 15.0, 0.014 * melMul, nodes)
  }
  else if (moodId === 3) {
    padChord(ctx, busGain, rv, [65.41, 98, 164.81, 246.94], 0.09 * padMul, nodes, lpHz)
    scheduleBells(ctx, busGain, rv,
      [523.25, 659.25, 783.99, 880, 783.99, 659.25],
      [0, 1.0, 2.1, 3.3, 4.5, 5.8],
      8.0, 0.022 * melMul, nodes)
  }
  else if (moodId === 4) {
    padChord(ctx, busGain, rv, [55, 65.41, 82.41, 98], 0.10 * padMul, nodes, Math.min(lpHz, 700))
    const wlp = nodes[nodes.push(ctx.createBiquadFilter())-1]
    wlp.type = "lowpass"; wlp.frequency.value = 720; wlp.Q.value = 0.8
    wlp.connect(busGain)
    const warble = nodes[nodes.push(ctx.createOscillator())-1]
    const wg     = nodes[nodes.push(ctx.createGain())-1]
    warble.frequency.value = 0.11; wg.gain.value = 38
    warble.connect(wg); wg.connect(wlp.frequency); warble.start()
    scheduleBells(ctx, busGain, rv,
      [440, 523.25, 440, 392],
      [0, 6.0, 13.5, 21.0],
      28.0, 0.016 * melMul, nodes)
    // Vinyl warble: ultra-filtered, nearly inaudible
    addTexture(ctx, busGain, nodes, hiss * 1.2, 3000, 6000)
  }

  return nodes
}

const MOOD_NAMES  = ["Cozy Room", "Rainy Night", "Deep Focus", "Dawn Light", "Vinyl Haze"]
const MOOD_EMOJIS = ["🛋", "🌧", "🎯", "🌅", "📼"]
const MOOD_DUR_MIN = 40_000, MOOD_DUR_MAX = 65_000

// ─────────────────────────────────────────────────────────────────────────────
// useAmbientAudio — with spatial PannerNode for 3D positioning
// ─────────────────────────────────────────────────────────────────────────────
function useAmbientAudio(debug) {
  const ctxRef       = useRef(null)
  const masterRef    = useRef(null)
  const pannerRef    = useRef(null)  // ← spatial audio panner
  const busARef      = useRef(null)
  const busBRef      = useRef(null)
  const nodesARef    = useRef([])
  const nodesBRef    = useRef([])
  const startedRef   = useRef(false)
  const moodTimerRef = useRef(null)
  const currentMood  = useRef(0)

  const [muted,     setMuted]       = useState(false)
  const [volume,    setVolumeState] = useState(0.65)
  const [moodName,  setMoodName]    = useState(MOOD_NAMES[0])
  const [moodEmoji, setMoodEmoji]   = useState(MOOD_EMOJIS[0])

  const pickNext = (cur) => { let n; do { n = Math.floor(Math.random() * MOOD_NAMES.length) } while (n === cur); return n }

  const crossfade = useCallback((nextId) => {
    const ctx = ctxRef.current; if (!ctx || !masterRef.current) return
    const cf  = debug?.audioCrossfadeS ?? 4.0
    const now = ctx.currentTime
    const busB = ctx.createGain()
    busB.gain.setValueAtTime(0, now)
    busB.connect(masterRef.current)
    busBRef.current = busB
    nodesBRef.current = buildMood(ctx, busB, nextId, debug)
    busB.gain.linearRampToValueAtTime(1.0, now + cf)
    if (busARef.current) {
      busARef.current.gain.cancelScheduledValues(now)
      busARef.current.gain.setValueAtTime(busARef.current.gain.value, now)
      busARef.current.gain.linearRampToValueAtTime(0, now + cf)
    }
    setTimeout(() => {
      nodesARef.current.forEach(n => { try { n.stop?.() } catch(e){} })
      nodesARef.current = nodesBRef.current; nodesBRef.current = []
      if (busARef.current) busARef.current.disconnect()
      busARef.current = busBRef.current; busBRef.current = null
    }, cf * 1000 + 300)
    currentMood.current = nextId
    setMoodName(MOOD_NAMES[nextId]); setMoodEmoji(MOOD_EMOJIS[nextId])
    moodTimerRef.current = setTimeout(() => crossfade(pickNext(nextId)),
      MOOD_DUR_MIN + Math.random() * (MOOD_DUR_MAX - MOOD_DUR_MIN))
  }, [debug])

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx

      // ── Spatial audio setup ───────────────────────────────────────────────
      // Listener sits at camera's rough default position
      if (ctx.listener.positionX) {
        ctx.listener.positionX.value = 8
        ctx.listener.positionY.value = 5
        ctx.listener.positionZ.value = 8
        ctx.listener.forwardX.value  = -1
        ctx.listener.forwardY.value  = -0.3
        ctx.listener.forwardZ.value  = -1
        ctx.listener.upX.value = 0
        ctx.listener.upY.value = 1
        ctx.listener.upZ.value = 0
      }

      // Panner placed at the piano/record area (room center)
      const panner = ctx.createPanner()
      panner.panningModel  = "HRTF"
      panner.distanceModel = "inverse"
      panner.refDistance   = 2
      panner.maxDistance   = 25
      panner.rolloffFactor = 0.6   // gentle — doesn't go silent at orbit edges
      panner.setPosition(0, 1.5, 0)
      panner.connect(ctx.destination)
      pannerRef.current = panner

      const master = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(debug?.audioMasterVol ?? 0.65, ctx.currentTime + 6)
      master.connect(panner)   // ← chain: bus → master → panner → destination
      masterRef.current = master

      const first = Math.floor(Math.random() * MOOD_NAMES.length)
      currentMood.current = first
      setMoodName(MOOD_NAMES[first]); setMoodEmoji(MOOD_EMOJIS[first])
      const busA = ctx.createGain(); busA.gain.value = 1.0; busA.connect(master)
      busARef.current = busA
      nodesARef.current = buildMood(ctx, busA, first, debug)
      moodTimerRef.current = setTimeout(() => crossfade(pickNext(first)),
        MOOD_DUR_MIN + Math.random() * (MOOD_DUR_MAX - MOOD_DUR_MIN))
    } catch(e) { console.warn("Audio init failed:", e) }
  }, [crossfade, debug])

  // Update listener position as camera moves (called from useFrame in CameraListener)
  const updateListener = useCallback((camPos) => {
    const ctx = ctxRef.current
    if (!ctx) return
    if (ctx.listener.positionX) {
      ctx.listener.positionX.value = camPos.x
      ctx.listener.positionY.value = camPos.y
      ctx.listener.positionZ.value = camPos.z
    }
  }, [])

  const setVolume = useCallback((v) => {
    setVolumeState(v)
    if (masterRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime
      masterRef.current.gain.cancelScheduledValues(now)
      masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now)
      masterRef.current.gain.linearRampToValueAtTime(muted ? 0 : v, now + 0.12)
    }
  }, [muted])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      if (masterRef.current && ctxRef.current) {
        const now = ctxRef.current.currentTime
        masterRef.current.gain.cancelScheduledValues(now)
        masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now)
        masterRef.current.gain.linearRampToValueAtTime(next ? 0 : volume, now + 0.6)
      }
      return next
    })
  }, [volume])

  const skipMood = useCallback(() => {
    if (!startedRef.current) return
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current)
    crossfade(pickNext(currentMood.current))
  }, [crossfade])

  return { start, muted, toggleMute, volume, setVolume, skipMood, moodName, moodEmoji, updateListener }
}

// ── CameraListener — updates AudioContext listener position each frame ────────
function CameraListener({ updateListener }) {
  const { camera } = useThree()
  useFrame(() => {
    updateListener(camera.position)
  })
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Orbit Controls — mobile-optimised: reduced sensitivity, better pinch
// ─────────────────────────────────────────────────────────────────────────────
function CustomOrbitControls({ enabled, lockedRef }) {
  const { camera, gl } = useThree()
  const state = useRef({
    isOrbiting:false, isPanning:false,
    theta: Math.atan2(8,8), phi: 0.95,
    radius: Math.sqrt(64+25+64),
    target: new THREE.Vector3(0,1.5,0),
    panTarget: new THREE.Vector3(0,1.5,0),
    lastX:0, lastY:0, lastDist:0, wasLocked:false,
  })
  const mobile = useRef(isMobile())

  useEffect(() => {
    const el = gl.domElement, s = state.current
    const mob = mobile.current

    const onMouseDown = (e) => {
      if (!enabled||lockedRef.current) return
      if(e.button===0) s.isOrbiting=true
      if(e.button===2) s.isPanning=true
      s.lastX=e.clientX; s.lastY=e.clientY
    }
    const onMouseMove = (e) => {
      if(!s.isOrbiting&&!s.isPanning) return
      applyDelta(e.clientX-s.lastX, e.clientY-s.lastY, s)
      s.lastX=e.clientX; s.lastY=e.clientY
    }
    const onMouseUp   = ()  => { s.isOrbiting=false; s.isPanning=false }
    const onWheel     = (e) => {
      if(!enabled||lockedRef.current) return
      s.radius = Math.max(3, Math.min(22, s.radius + e.deltaY * 0.01))
    }
    const preventCtx  = (e) => e.preventDefault()

    const onTouchStart = (e) => {
      if (!enabled||lockedRef.current) return
      if (e.touches.length===1) {
        s.isOrbiting=true
        s.lastX=e.touches[0].clientX; s.lastY=e.touches[0].clientY
      } else if (e.touches.length===2) {
        s.isOrbiting=false; s.isPanning=false
        s.lastDist=Math.hypot(
          e.touches[0].clientX-e.touches[1].clientX,
          e.touches[0].clientY-e.touches[1].clientY
        )
        // Track midpoint for panning with two fingers
        s.lastX=(e.touches[0].clientX+e.touches[1].clientX)/2
        s.lastY=(e.touches[0].clientY+e.touches[1].clientY)/2
      }
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length===1 && s.isOrbiting) {
        applyDelta(e.touches[0].clientX-s.lastX, e.touches[0].clientY-s.lastY, s)
        s.lastX=e.touches[0].clientX; s.lastY=e.touches[0].clientY
      } else if (e.touches.length===2) {
        const d = Math.hypot(
          e.touches[0].clientX-e.touches[1].clientX,
          e.touches[0].clientY-e.touches[1].clientY
        )
        // Pinch zoom — slower on mobile to prevent jumps
        s.radius = Math.max(3, Math.min(22, s.radius - (d-s.lastDist) * (mob ? 0.025 : 0.04)))
        s.lastDist = d
      }
    }
    const onTouchEnd = () => { s.isOrbiting=false; s.isPanning=false }

    // Mobile orbit is slower to prevent nausea
    function applyDelta(dx, dy, s) {
      const orbitSens = mob ? 0.003 : 0.005
      const panSens   = mob ? 0.0006 : 0.001
      if (s.isOrbiting) {
        s.theta -= dx * orbitSens
        s.phi = Math.max(0.15, Math.min(Math.PI/2.1, s.phi - dy * orbitSens))
      }
      if (s.isPanning) {
        const r = new THREE.Vector3()
        r.crossVectors(
          camera.getWorldDirection(new THREE.Vector3()),
          new THREE.Vector3(0,1,0)
        ).normalize()
        const ps = s.radius * panSens
        s.panTarget.addScaledVector(r, -dx * ps)
        s.panTarget.addScaledVector(new THREE.Vector3(0,1,0), dy * ps)
      }
    }

    el.addEventListener("mousedown",onMouseDown)
    window.addEventListener("mousemove",onMouseMove)
    window.addEventListener("mouseup",onMouseUp)
    el.addEventListener("wheel",onWheel,{passive:false})
    el.addEventListener("contextmenu",preventCtx)
    el.addEventListener("touchstart",onTouchStart,{passive:false})
    el.addEventListener("touchmove",onTouchMove,{passive:false})
    el.addEventListener("touchend",onTouchEnd)
    return () => {
      el.removeEventListener("mousedown",onMouseDown)
      window.removeEventListener("mousemove",onMouseMove)
      window.removeEventListener("mouseup",onMouseUp)
      el.removeEventListener("wheel",onWheel)
      el.removeEventListener("contextmenu",preventCtx)
      el.removeEventListener("touchstart",onTouchStart)
      el.removeEventListener("touchmove",onTouchMove)
      el.removeEventListener("touchend",onTouchEnd)
    }
  }, [enabled, gl, camera, lockedRef])

  useFrame(() => {
    const s=state.current, locked=lockedRef.current
    if (s.wasLocked&&!locked) {
      const o=camera.position.clone().sub(s.target)
      s.radius=o.length()
      s.phi=Math.acos(Math.max(-1,Math.min(1,o.y/s.radius)))
      s.theta=Math.atan2(o.x,o.z)
      s.panTarget.copy(s.target)
    }
    s.wasLocked=locked
    if (locked) return
    s.target.lerp(s.panTarget,0.08)
    const x=s.target.x+s.radius*Math.sin(s.phi)*Math.sin(s.theta)
    const y=s.target.y+s.radius*Math.cos(s.phi)
    const z=s.target.z+s.radius*Math.sin(s.phi)*Math.cos(s.theta)
    camera.position.set(x,y,z); camera.lookAt(s.target)
  })
  return null
}

// ── Hoisted Color reused across frames — avoids allocation in useFrame ────────
const _bgColor   = new THREE.Color()
const _fogColor  = new THREE.Color()

// ─────────────────────────────────────────────────────────────────────────────
// DayNightSystem — fixed operator precedence + no Color allocation per frame
// ─────────────────────────────────────────────────────────────────────────────
function DayNightSystem({ debug, nightMode, season }) {
  const { scene, gl } = useThree()
  const progress = useRef(nightMode ? 1 : 0)
  const ambRef = useRef(), dirRef = useRef(), fillRef = useRef()

  useFrame(() => {
    const speed = debug?.nightTransitionSpeed ?? 0.03
    progress.current += ((nightMode ? 1 : 0) - progress.current) * speed * 3
    progress.current = Math.max(0, Math.min(1, progress.current))
    const p = progress.current, q = 1 - p

    const ambR = debug?.seasonAmbR ?? (season?.ambR ?? 1.0)
    const ambG = debug?.seasonAmbG ?? (season?.ambG ?? 0.88)
    const ambB = debug?.seasonAmbB ?? (season?.ambB ?? 0.82)

    if (ambRef.current) {
      const nightAmb = debug?.nightAmbient ?? 0.04
      ambRef.current.intensity = (debug?.ambientIntensity ?? 0.5) * q + nightAmb * p
      ambRef.current.color.setRGB(ambR*q + 0.08*p, ambG*q + 0.08*p, ambB*q + 0.15*p)
    }
    if (dirRef.current) {
      dirRef.current.intensity = (debug?.directionalIntensity ?? 2.0) * q * q
      dirRef.current.position.set(debug?.lightX??6, (debug?.lightY??10)*q - 10*p, debug?.lightZ??6)
      dirRef.current.color.setRGB(1.0, 0.88 - p*0.4, 0.7 - p*0.7)
    }
    if (fillRef.current) {
      fillRef.current.intensity = (debug?.fillLight??0.2)*q * 0.5
    }

    // ── FIX: reuse _bgColor — no allocation per frame
    scene.background = _bgColor.setRGB(
      Math.max(0.004, (season?.bgR??0.055)*q + 0.008*p),
      Math.max(0.004, (season?.bgG??0.055)*q + 0.010*p),
      Math.max(0.010, (season?.bgB??0.067)*q + 0.022*p),
    )

    if (gl) gl.toneMappingExposure = 1.1 * q + 0.55 * p
  })

  return (
    <>
      <ambientLight     ref={ambRef} intensity={debug?.ambientIntensity ?? 0.5} />
      <directionalLight ref={dirRef}
        position={[debug?.lightX??6, debug?.lightY??10, debug?.lightZ??6]}
        intensity={debug?.directionalIntensity ?? 2}
        castShadow shadow-mapSize={[1024,1024]}  // mobile: reduced from 2048
        shadow-camera-near={0.5} shadow-camera-far={50}
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12}  shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <pointLight ref={fillRef} position={[-5,3,-5]} intensity={debug?.fillLight??0.2} castShadow={false} />
    </>
  )
}

function SeamlessBackground({ nightMode, season, debug }) {
  const { scene } = useThree()
  const progress  = useRef(nightMode ? 1 : 0)

  useFrame(() => {
    progress.current += ((nightMode ? 1 : 0) - progress.current) * 0.04
    progress.current = Math.max(0, Math.min(1, progress.current))
    const p = progress.current
    const fogR = debug?.seasonFogR || (season?.fogR ?? 0.04)
    const fogG = debug?.seasonFogG || (season?.fogG ?? 0.04)
    const fogB = debug?.seasonFogB || (season?.fogB ?? 0.05)
    const nfR = season?.fogNightR ?? 0.006
    const nfG = season?.fogNightG ?? 0.007
    const nfB = season?.fogNightB ?? 0.018
    const dens = debug?.seasonFogDensity || (season?.fogDensity ?? 0.038)

    // ── FIX: reuse _fogColor — no allocation per frame
    if (!scene.fog) scene.fog = new THREE.FogExp2(0x000000, dens)
    const fog = scene.fog
    fog.color = _fogColor.setRGB(
      fogR*(1-p) + nfR*p,
      fogG*(1-p) + nfG*p,
      fogB*(1-p) + nfB*p,
    )
    fog.density = dens + p * 0.012
  })
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SceneInner — main UI layer + 3D canvas
// ─────────────────────────────────────────────────────────────────────────────
function SceneInner({ selected, setSelected, hovered, setHovered, nightMode, onDarkModeToggle, sparkleEnabled, plan = "free", config = {}, modelUrl, onLoaded }) {
  const debug = useDebugControls()
  const { theme } = useUITheme()

  const [tooltipPos, setTooltipPos]     = useState(null)
  const [activePreset, setActivePreset] = useState(null)
  const [cameraMode, setCameraMode]     = useState("orbit")
  const cameraLockedRef = useRef(false)
  const mobile = useRef(isMobile())

  const { seasonKey, season, cycleSeason } = useSeasonalTheme()
  const { start: startAudio, muted, toggleMute, volume, setVolume, skipMood, moodName, moodEmoji, updateListener } = useAmbientAudio(debug)

  // ── FIX: stale closure — keep nightMode ref for anything read in RAF loops
  const nightModeRef = useRef(nightMode)
  useEffect(() => { nightModeRef.current = nightMode }, [nightMode])

  useEffect(() => {
    if (selected || activePreset !== null) cameraLockedRef.current = true
  }, [selected, activePreset])

  const onCameraMode = useCallback((m) => {
    setCameraMode(m); cameraLockedRef.current = m !== "orbit"
  }, [])

  const handlePreset = (idx) => {
    const next = activePreset === idx ? null : idx
    setActivePreset(next); setSelected(null)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onNight:  onDarkModeToggle,
    onSeason: cycleSeason,
    onMute:   () => { startAudio(); toggleMute() },
    onSkip:   () => { startAudio(); skipMood() },
  })

  const bloomInt   = nightMode ? (debug?.nightBloomIntensity ?? 0.8)  : (debug?.bloomIntensity ?? 0.3)
  const bloomThres = nightMode ? (debug?.nightBloomThreshold ?? 0.55) : (debug?.bloomThreshold ?? 0.8)
  const vignette   = nightMode ? (debug?.nightVignette ?? 0.55)       : (debug?.vignetteStrength ?? 0.28)

  // Mobile: reduce post-processing to recover perf
  const enableBloom = !mobile.current

  // Mobile touch: show brief hint overlay
  const [touchHint, setTouchHint] = useState(mobile.current)
  useEffect(() => {
    if (!mobile.current) return
    const t = setTimeout(() => setTouchHint(false), 3500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
      <Leva collapsed={true} titleBar={{ title:"⚙ Debug" }} hidden={mobile.current} />

      <CursorSparkle enabled={sparkleEnabled && !mobile.current} debug={debug} />
      <WeatherSystem seasonKey={seasonKey} nightMode={nightMode} debug={debug} />
      <Tooltip hovered={hovered} position={tooltipPos} />

      {/* ── Top-right controls ── */}
      <div style={{
        position:"fixed", top:14, right: selected ? 358 : 14, zIndex:30,
        display:"flex", flexDirection:"row", gap:6, alignItems:"center",
        transition:"right 0.45s cubic-bezier(0.4,0,0.2,1)",
        flexWrap: mobile.current ? "wrap" : "nowrap",
        maxWidth: mobile.current ? "calc(100vw - 28px)" : "none",
        justifyContent: mobile.current ? "flex-end" : "flex-start",
      }}>
        <ThemeToggleButton />
        <SeasonButton season={season} onClick={cycleSeason} />
        <VolumeSlider
          volume={volume}
          onVolumeChange={(v) => { startAudio(); setVolume(v) }}
          muted={muted}
          onMuteToggle={() => { startAudio(); toggleMute() }}
          moodEmoji={moodEmoji}
          moodName={moodName}
          onSkip={() => { startAudio(); skipMood() }}
          theme={theme}
        />
        {/* Camera presets — hidden on mobile to save space */}
        {!mobile.current && [
          { label:"Side View", icon:"◢", pos:new THREE.Vector3(12,5,0),   target:new THREE.Vector3(0,1.5,0) },
          { label:"Top View",  icon:"↓", pos:new THREE.Vector3(0,18,0.5), target:new THREE.Vector3(0,0,0) },
        ].map((p, i) => (
          <ThemedButton key={i} label={p.label} icon={p.icon}
            active={activePreset===i}
            onClick={() => handlePreset(i)}
            title={`Switch to ${p.label}`}
          />
        ))}
        {/* Keyboard help — hide on mobile (no keyboard) */}
        {!mobile.current && <KeyboardHelp theme={theme} />}
      </div>

      {/* ── Night mode pill ── */}
      {nightMode && (
        <div style={{
          position:"fixed", bottom: mobile.current ? 80 : 22, left:"50%",
          transform:"translateX(-50%)",
          zIndex:30,
          background: theme.bg,
          border: `2px solid ${theme.borderAct}`,
          borderRadius:24, padding:"7px 16px",
          fontFamily: theme.font, fontSize: mobile.current ? 12 : 14, fontWeight:600,
          color: theme.accent, letterSpacing:"0.05em",
          display:"flex", alignItems:"center", gap:8,
          boxShadow: `0 0 20px ${theme.glow}`,
          animation:"cozyFadeIn 0.4s ease",
          whiteSpace:"nowrap",
        }}>
          <span>🕯</span>
          <span>{mobile.current ? "Night mode — tap candle to exit" : "Night mode — click the candle to return to day"}</span>
        </div>
      )}

      {/* ── Mobile touch hint ── */}
      {touchHint && (
        <div style={{
          position:"fixed", bottom:14, left:"50%",
          transform:"translateX(-50%)",
          zIndex:30,
          background: theme.bg,
          border: `1.5px solid ${theme.border}`,
          borderRadius:20, padding:"8px 18px",
          fontFamily: theme.font, fontSize:12,
          color: theme.text,
          display:"flex", gap:14, alignItems:"center",
          opacity: touchHint ? 1 : 0,
          transition:"opacity 0.5s ease",
          whiteSpace:"nowrap",
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
        }}>
          <span>👆 Drag to orbit</span>
          <span>🤏 Pinch to zoom</span>
          <span>👇 Tap objects</span>
        </div>
      )}

      {/* ── Desktop controls hint ── */}
      {!mobile.current && (
        <div style={{
          position:"fixed", bottom:18, left:18, zIndex:30,
          display:"flex", gap:8, alignItems:"center", opacity:0.6,
        }}>
          {[{icon:"🖱",label:"Drag to orbit"},{icon:"✋",label:"Pan"},{icon:"🔍",label:"Zoom"}].map((h,i) => (
            <div key={i} style={{
              fontFamily: theme.font, fontSize:12, color: theme.text,
              background: theme.bg, border:`1.5px solid ${theme.border}`,
              borderRadius:8, padding:"3px 10px",
              display:"flex", alignItems:"center", gap:4,
            }}>
              <span>{h.icon}</span><span>{h.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Camera mode badge */}
      {!mobile.current && (
        <div style={{
          position:"fixed", bottom:56, left:18, zIndex:30,
          fontFamily: theme.font, fontSize:12,
          background: theme.bg, border:`1.5px solid ${theme.border}`,
          borderRadius:8, padding:"3px 10px",
          color: theme.text,
          display:"flex", alignItems:"center", gap:6, opacity:0.85,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:theme.accent, display:"inline-block" }}/>
          cam: {cameraMode}
        </div>
      )}

      {/* Feature Gating Watermark */}
      {plan === "free" && (
        <div style={{
          position:"fixed", bottom:24, right:24, zIndex:30,
          fontFamily: theme.font, fontSize:12, fontWeight:600,
          color: theme.text, opacity:0.5, letterSpacing:"0.1em",
          pointerEvents:"none", userSelect:"none",
          textTransform:"uppercase"
        }}>
          Powered by Venture
        </div>
      )}

      {/* ── Info Panel ── */}
      <InfoPanel selected={selected} onClose={() => setSelected(null)} />

      {/* ── Canvas ── */}
      <Canvas
        shadows={!mobile.current}   // ← mobile: disable shadows for perf
        dpr={mobile.current ? [1, 1.5] : [1, 2]}  // ← mobile: cap DPR
        camera={{ position:[8,5,8], fov:debug?.fov??45, near:0.1, far:100 }}
        gl={{
          antialias: !mobile.current,  // ← mobile: skip MSAA for perf
          powerPreference:"high-performance",
          toneMapping:THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace:THREE.SRGBColorSpace,
        }}
        style={{ width: "100%", height: "100%" }}
        onPointerMove={(e) => !mobile.current && setTooltipPos({ x:e.clientX, y:e.clientY })}
        onClick={() => startAudio()}
      >
        {/* ── Spatial audio camera tracker ── */}
        <CameraListener updateListener={updateListener} />

        <DayNightSystem debug={debug} nightMode={nightMode} season={season} />
        <SeamlessBackground nightMode={nightMode} season={season} debug={debug} />

        <Suspense fallback={null}>
          <ErrorBoundary>
            <Model
              modelUrl={modelUrl} config={config} onLoaded={onLoaded}
              hovered={hovered} setHovered={setHovered}
              selected={selected} setSelected={setSelected}
              debug={debug} onDarkModeToggle={onDarkModeToggle} nightMode={nightMode}
            />
          </ErrorBoundary>
          <DustMotes nightMode={nightMode} debug={debug} />

          {/* Wall clock — positioned on back wall, no external model needed */}
          <WallClock position={[-1.5, 2.8, -3.8]} nightMode={nightMode} radius={0.24} />

          {/* ── FIX: Both environments always mounted, only intensity changes.
               This prevents re-fetching HDRI on every night-mode toggle. ── */}
          <Environment preset="warehouse" background={false} intensity={nightMode ? 0 : 0.9} />
          <Environment preset="night"    background={false}
            intensity={nightMode ? (debug?.nightEnvIntensity??0.02) : 0} />
        </Suspense>

        <CameraRig
          selected={selected} debug={debug}
          presetTarget={activePreset!==null
            ? [
                { pos:new THREE.Vector3(12,5,0),   target:new THREE.Vector3(0,1.5,0) },
                { pos:new THREE.Vector3(0,18,0.5), target:new THREE.Vector3(0,0,0) },
              ][activePreset]
            : null}
          cameraLockedRef={cameraLockedRef}
          onModeChange={onCameraMode}
        />
        <CustomOrbitControls enabled={true} lockedRef={cameraLockedRef} />

        {enableBloom ? (
          <EffectComposer>
            <Bloom
              intensity={bloomInt}
              luminanceThreshold={bloomThres}
              luminanceSmoothing={0.4}
              mipmapBlur={false}
            />
            <Vignette offset={0.3} darkness={vignette} />
          </EffectComposer>
        ) : (
          // Mobile: vignette only, no expensive bloom pass
          <EffectComposer>
            <Vignette offset={0.3} darkness={vignette * 0.7} />
          </EffectComposer>
        )}
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

// ─────────────────────────────────────────────────────────────────────────────
// App.jsx needs to pass initialNightMode based on time-of-day.
// Scene receives nightMode from App; the auto-night logic lives in App.
// ─────────────────────────────────────────────────────────────────────────────
export default function Scene(props) {
  return (
    <UIThemeProvider>
      <SceneInner {...props} />
    </UIThemeProvider>
  )
}
