import { useGLTF } from "@react-three/drei"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { INTERACTIVE_NAMES, OBJECT_META } from "../constants/objectMeta"

// ── FIX: WeakMap cache so traverse only happens once per object, not per frame
const _nameCache = new WeakMap()
function findInteractiveName(obj) {
  if (_nameCache.has(obj)) return _nameCache.get(obj)
  let cur = obj
  while (cur) {
    if (INTERACTIVE_NAMES.includes(cur.name)) {
      _nameCache.set(obj, cur.name)
      return cur.name
    }
    cur = cur.parent
  }
  _nameCache.set(obj, null)
  return null
}

// ── Reusable decompose vectors — no allocation per frame
const _decompP = new THREE.Vector3()
const _decompQ = new THREE.Quaternion()
const _decompS = new THREE.Vector3()

// ─────────────────────────────────────────────────────────────────────────────
// Sound Engine
// ─────────────────────────────────────────────────────────────────────────────
class SoundEngine {
  constructor() { this.ctx = null; this.enabled = true }
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    return this.ctx
  }
  _play(fn) { if (!this.enabled) return; try { fn(this._ctx()) } catch(e) {} }

  hover(type = "default") {
    this._play((ctx) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      const fm = { rotate:520, wobble:440, shrink:380, press:300, float:660, darkmode:200, tilt:480, glint:880, peck:560 }
      const f = fm[type] ?? 440
      osc.type = "sine"
      osc.frequency.setValueAtTime(f, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.13)
    })
  }

  click(type = "default") {
    this._play((ctx) => {
      const mk = (waveType, freq, dur, decay) => {
        const osc = ctx.createOscillator(), g = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = waveType; osc.frequency.setValueAtTime(freq, ctx.currentTime)
        if (decay) osc.frequency.exponentialRampToValueAtTime(decay, ctx.currentTime + dur)
        g.gain.setValueAtTime(0.09, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur + 0.01)
      }
      if (type === "wobble")   { mk("triangle", 320, 0.3, 180); return }
      if (type === "darkmode") { mk("triangle", 180, 0.35, 60);  return }
      if (type === "peck")     { mk("square", 900, 0.06, 200);  return }
      if (type === "glint") {
        [880,1320,1760].forEach((f,i) => {
          const osc = ctx.createOscillator(), g = ctx.createGain()
          osc.connect(g); g.connect(ctx.destination)
          osc.type = "sine"; osc.frequency.value = f
          const t0 = ctx.currentTime + i * 0.04
          g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.03, t0 + 0.01)
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25)
          osc.start(t0); osc.stop(t0 + 0.26)
        })
        return
      }
      if (type === "tilt") { mk("sine", 440, 0.15, 550); return }
      mk("sine", 600, 0.12, 300)
    })
  }

  playPianoMelody() {
    this._play((ctx) => {
      const notes = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 880]
      const times =  [0,  0.18,   0.36,   0.52,   0.70,   0.86,   1.02,  1.18]
      notes.forEach((freq, i) => {
        const t0 = ctx.currentTime + times[i]
        const osc  = ctx.createOscillator(), gain = ctx.createGain()
        const osc2 = ctx.createOscillator(), gain2 = ctx.createGain()
        osc.type  = "triangle"; osc.frequency.value  = freq
        osc2.type = "sine";     osc2.frequency.value = freq * 2.01
        osc.connect(gain);  gain.connect(ctx.destination)
        osc2.connect(gain2); gain2.connect(ctx.destination)
        gain.gain.setValueAtTime(0, t0)
        gain.gain.linearRampToValueAtTime(0.12, t0 + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
        gain2.gain.setValueAtTime(0, t0)
        gain2.gain.linearRampToValueAtTime(0.03, t0 + 0.01)
        gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3)
        osc.start(t0); osc.stop(t0 + 0.56)
        osc2.start(t0); osc2.stop(t0 + 0.31)
      })
    })
  }

  playMagic() {
    this._play((ctx) => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator(), g = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = "sine"; osc.frequency.value = f
        const t0 = ctx.currentTime + i * 0.06
        g.gain.setValueAtTime(0, t0)
        g.gain.linearRampToValueAtTime(0.06, t0 + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35)
        osc.start(t0); osc.stop(t0 + 0.36)
      })
    })
  }
}
const soundEngine = new SoundEngine()

// ─────────────────────────────────────────────────────────────────────────────
// Outline — cached traverse + reused decompose vectors
// ─────────────────────────────────────────────────────────────────────────────
function LiveOutline({ targetRef, debug, objectName }) {
  const meshRef    = useRef()
  const srcCache   = useRef(null)  // ← FIX: cache first-found mesh, not traverse every frame
  const prevTarget = useRef(null)

  const objColor = objectName ? OBJECT_META[objectName]?.outlineColor : null
  const color = objColor ?? debug?.outlineColor ?? "#ffffff"
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color), side: THREE.BackSide,
    transparent: true, opacity: debug?.outlineOpacity ?? 0.9, depthWrite: false,
  }), [color, debug?.outlineOpacity])
  useEffect(() => { mat.color.set(color) }, [color, mat])

  useFrame(({ clock }) => {
    const m = meshRef.current, node = targetRef.current
    if (!m || !node) return

    // ── FIX: only traverse when target changes; cache result
    if (prevTarget.current !== node) {
      srcCache.current = null
      if (node.isMesh && node.geometry) {
        srcCache.current = node
      } else {
        node.traverse(c => { if (!srcCache.current && c.isMesh && c.geometry) srcCache.current = c })
      }
      prevTarget.current = node
    }
    const src = srcCache.current
    if (!src) return

    m.geometry = src.geometry
    src.updateWorldMatrix(true, false)

    // ── FIX: reuse _decompP/Q/S — no allocation per frame
    src.matrixWorld.decompose(_decompP, _decompQ, _decompS)

    const t = clock.getElapsedTime()
    const style = debug?.outlineStyle ?? "pulse"
    let extra = 1.05
    if (style === "pulse")   extra = 1.05 + Math.sin(t*(debug?.outlinePulseSpeed??3))*(debug?.outlinePulseStrength??0.025)
    else if (style === "wobble")  extra = 1.05 + Math.sin(t*7)*0.03*Math.cos(t*3.7)
    else if (style === "breathe") extra = 1.05 + (Math.sin(t*1.4)*0.5+0.5)*0.055
    else if (style === "jitter")  extra = 1.05 + (Math.random()-0.5)*0.02
    else extra = 1.06

    _decompS.multiplyScalar(extra * (debug?.outlineWidth ?? 1.0))
    m.matrix.compose(_decompP, _decompQ, _decompS)
    m.matrixWorldNeedsUpdate = true
  })
  return <mesh ref={meshRef} matrixAutoUpdate={false} material={mat} renderOrder={999} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Mirror glint — also cached traverse
// ─────────────────────────────────────────────────────────────────────────────
function GlintEffect({ targetRef, activeRef, debug }) {
  const meshRef    = useRef(), progress = useRef(0)
  const srcCache   = useRef(null)
  const prevTarget = useRef(null)
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ffffff"), transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])

  useFrame((_, dt) => {
    const m = meshRef.current, node = targetRef.current
    if (!m || !node) return

    if (prevTarget.current !== node) {
      srcCache.current = null
      if (node.isMesh && node.geometry) srcCache.current = node
      else node.traverse(c => { if (!srcCache.current && c.isMesh && c.geometry) srcCache.current = c })
      prevTarget.current = node
    }
    const src = srcCache.current
    if (!src) return

    m.geometry = src.geometry
    src.updateWorldMatrix(true, false)
    m.matrix.copy(src.matrixWorld)
    m.matrixWorldNeedsUpdate = true

    const active = activeRef.current
    if (active) progress.current = Math.min(progress.current + dt / (debug?.glintDuration ?? 0.6) * 2, 1)
    else         progress.current = Math.max(progress.current - dt * 3, 0)
    const bell = Math.sin(progress.current * Math.PI)
    mat.opacity = bell * (debug?.glintIntensity ?? 1.0) * 0.6
    mat.color.setRGB(1, 1 - bell*0.1, 1 - bell*0.2)
  })
  return <mesh ref={meshRef} matrixAutoUpdate={false} material={mat} renderOrder={998} />
}

// Bird paths
const PATHS = [
  (t,b,r,h) => ({ x:b.x+Math.sin(t*.4)*r*1.8, y:b.y+h+Math.sin(t*.9)*.15, z:b.z+Math.cos(t*.4)*r*1.4, ry:Math.atan2(Math.cos(t*.4),Math.sin(t*.4)) }),
  (t,b,r,h) => ({ x:b.x+Math.sin(t*.35)*r*1.2, y:b.y+h*.7+Math.abs(Math.sin(t*.7))*.25, z:b.z+Math.sin(t*.7)*r, ry:t*.35 }),
  (t,b,r,h) => ({ x:b.x+Math.cos(t*.28)*r*2.0, y:b.y+h*1.3+Math.sin(t*1.1)*.12, z:b.z+Math.sin(t*.28)*r*1.6, ry:-t*.28 }),
]

export default function Model({ hovered, setHovered, selected, setSelected, debug, onDarkModeToggle, nightMode }) {
  const { scene } = useGLTF("/models/Professor.glb")
  const nodeMap   = useRef({})
  const states    = useRef({})
  const activeRef      = useRef(null)
  const activeNameRef  = useRef(null)
  const [activeNameState, setActiveNameState] = useState(null)
  const birdBases            = useRef({})
  const mirrorGlintActiveRef = useRef(false)
  const mirrorNodeRef   = useRef(null)
  const candleLightRef  = useRef()
  const candlePos       = useRef([0, 1.5, 0])

  const lastHoverName     = useRef(null)
  const hoverStableTimer  = useRef(null)
  const HOVER_DEBOUNCE_MS = 80

  useEffect(() => {
    scene.traverse(child => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true }
      if (INTERACTIVE_NAMES.includes(child.name)) {
        nodeMap.current[child.name] = child
        states.current[child.name] = {
          hovered: false,
          rotSpeed: 0, scaleVal: 1, scaleVel: 0,
          wobble: 0, wobblePhase: Math.random() * Math.PI * 2,
          pressY: 0, tiltAngle: 0, tiltVel: 0,
          peckAngle: 0, peckVel: 0,
          bobOffset: Math.random() * Math.PI * 2,
          flightOffset: Math.random() * Math.PI * 2,
          baseY: child.position.y, baseX: child.position.x, baseZ: child.position.z,
          glintActive: false,
          pianoNoteTimer: 0, pianoPlaying: false,
          hatMagicTimer: 0, hatMagicActive: false,
          candleFlameScale: 1,
        }
        if (child.name.startsWith("Bird"))
          birdBases.current[child.name] = { x: child.position.x, y: child.position.y, z: child.position.z }
        if (child.name === "Mirror") mirrorNodeRef.current = child
        if (child.name === "Candle") {
          const p = new THREE.Vector3()
          child.getWorldPosition(p)
          candlePos.current = [p.x, p.y + 0.35, p.z]
        }
      }
    })
  }, [scene])

  const K = 22, D = 0.72

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()

    if (candleLightRef.current) {
      const n = Math.sin(t*7.3)*0.4 + Math.sin(t*13.1)*0.3 + Math.sin(t*3.7)*0.3
      const base = debug?.candleLightIntensity ?? 4.5
      candleLightRef.current.intensity = nightMode
        ? (base + n * (debug?.candleFlicker ?? 0.6)) * 1.0
        : 0
      candleLightRef.current.color.setRGB(1.0, Math.max(0.3, 0.45+n*0.09), Math.max(0, 0.05+n*0.02))
    }

    INTERACTIVE_NAMES.forEach(name => {
      const node = nodeMap.current[name], s = states.current[name]
      if (!node || !s) return
      const meta = OBJECT_META[name]
      if (!meta) return

      switch (meta.interaction) {
        case "rotate": {
          const axis = debug?.globeAxis ?? "Y"
          const tgt  = s.hovered ? (debug?.globeSpeed ?? 1.5) : 0
          s.rotSpeed += (tgt - s.rotSpeed) * dt * 4
          if (axis==="Y") node.rotation.y += s.rotSpeed * dt
          else if (axis==="X") node.rotation.x += s.rotSpeed * dt
          else node.rotation.z += s.rotSpeed * dt
          const st = s.hovered ? 1.07 : 1
          s.scaleVel += (st-s.scaleVal)*dt*K; s.scaleVel*=D; s.scaleVal+=s.scaleVel
          node.scale.setScalar(s.scaleVal)
          break
        }
        case "wobble": {
          if (s.hovered && s.wobble < 0.12) s.wobble = 0.18
          if (s.wobble > 0.001) {
            s.wobble *= (debug?.bottleWobbleDecay ?? 0.94)
            node.rotation.z = Math.sin(t*(debug?.bottleWobbleFreq??14)+s.wobblePhase)*s.wobble
          } else {
            node.rotation.z = Math.sin(t*0.55+s.wobblePhase)*(debug?.bottleIdleSway??0.012)
            s.wobble = 0
          }
          const st = s.hovered ? 1.05 : 1
          s.scaleVel += (st-s.scaleVal)*dt*K; s.scaleVel*=D; s.scaleVal+=s.scaleVel
          node.scale.setScalar(s.scaleVal)
          break
        }
        case "shrink": {
          const scaleTarget = s.hovered ? 0.88 : 1.0
          s.scaleVel += (scaleTarget-s.scaleVal)*dt*10; s.scaleVel*=0.75; s.scaleVal+=s.scaleVel
          node.scale.setScalar(s.scaleVal)
          break
        }
        case "press": {
          s.pressY += ((s.hovered ? -0.045 : 0) - s.pressY) * dt * 22
          node.position.y = s.baseY + s.pressY
          if (s.pianoPlaying) {
            s.pianoNoteTimer += dt
            const bounce = Math.sin(s.pianoNoteTimer * 18) * Math.exp(-s.pianoNoteTimer * 3) * 0.035
            node.scale.setScalar(1 + bounce)
            if (s.pianoNoteTimer > 1.5) { s.pianoPlaying = false; s.pianoNoteTimer = 0 }
          } else {
            const st = s.hovered ? 1.04 : 1
            s.scaleVel += (st-s.scaleVal)*dt*K; s.scaleVel*=D; s.scaleVal+=s.scaleVel
            node.scale.setScalar(s.scaleVal)
          }
          break
        }
        case "float": {
          const idx  = parseInt(name.replace("Bird","")) - 1
          const base = birdBases.current[name] ?? {x:0,y:2,z:0}
          const spd = debug?.birdSpeed??1.0, r = debug?.birdRadius??1.0, h = debug?.birdHeight??0.3
          const fn  = PATHS[Math.min(idx, PATHS.length-1)]
          const p   = fn(t*spd+s.flightOffset, base, r, h)
          node.position.x += (p.x-node.position.x)*dt*2.5
          node.position.y += (p.y-node.position.y)*dt*2.5
          node.position.z += (p.z-node.position.z)*dt*2.5
          node.rotation.y  = p.ry
          node.rotation.z  = Math.sin(t*(debug?.birdFlapSpeed??8)*spd+s.flightOffset)*0.2
          node.rotation.x  = Math.sin(t*0.4*spd+s.flightOffset)*0.1
          break
        }
        case "darkmode": {
          const noise = Math.sin(t*7)*0.4 + Math.sin(t*13)*0.3 + Math.sin(t*3.7)*0.3
          const intensity = nightMode ? 1.0 : (s.hovered ? 0.5 : 0.15)
          s.scaleVal += ((1 + noise*0.03*intensity) - s.scaleVal)*dt*15
          node.scale.setScalar(s.scaleVal)
          node.rotation.z = noise*0.015*intensity
          break
        }
        case "tilt": {
          s.tiltVel += ((s.hovered ? -0.38 : 0) - s.tiltAngle)*dt*18
          s.tiltVel *= 0.72; s.tiltAngle += s.tiltVel
          node.rotation.z = s.tiltAngle
          if (s.hatMagicActive) {
            s.hatMagicTimer += dt
            const pop   = Math.sin(s.hatMagicTimer * 10) * Math.exp(-s.hatMagicTimer * 4) * 0.12
            const spin  = Math.sin(s.hatMagicTimer * 20) * Math.exp(-s.hatMagicTimer * 3) * 0.3
            node.scale.setScalar(1 + pop)
            node.rotation.y += spin * dt
            if (s.hatMagicTimer > 1.0) { s.hatMagicActive = false; s.hatMagicTimer = 0 }
          } else {
            const st = s.hovered ? 1.06 : 1
            s.scaleVel += (st-s.scaleVal)*dt*K; s.scaleVel*=D; s.scaleVal+=s.scaleVel
            node.scale.setScalar(s.scaleVal)
          }
          break
        }
        case "glint": {
          mirrorGlintActiveRef.current = s.hovered
          const shim = s.hovered ? Math.sin(t*9)*0.02 : Math.sin(t*2)*0.005
          const st = s.hovered ? 1.04 : 1
          s.scaleVel += (st-s.scaleVal)*dt*8; s.scaleVel*=0.75; s.scaleVal+=s.scaleVel
          node.scale.set(s.scaleVal+shim, s.scaleVal-shim*0.5, s.scaleVal+shim*0.3)
          break
        }
        case "peck": {
          const peckSpd = debug?.pigeonPeckSpeed ?? 6
          const peckAng = debug?.pigeonPeckAngle ?? 0.12
          if (s.hovered) {
            const peckTarget = Math.sin(t*peckSpd) > 0 ? peckAng : 0
            s.peckVel += (peckTarget-s.peckAngle)*dt*30; s.peckVel*=0.65; s.peckAngle+=s.peckVel
          } else {
            s.peckAngle *= 0.92; s.peckVel *= 0.8
          }
          node.rotation.z = s.peckAngle
          const st = s.hovered ? 1.05 : 1
          s.scaleVel += (st-s.scaleVal)*dt*K; s.scaleVel*=D; s.scaleVal+=s.scaleVel
          node.scale.setScalar(s.scaleVal)
          break
        }
      }
    })
  })

  const handlePointerMove = (e) => {
    const name = findInteractiveName(e.object)
    if (name) {
      e.stopPropagation()
      if (activeNameRef.current === name) return
      if (hoverStableTimer.current) clearTimeout(hoverStableTimer.current)
      lastHoverName.current = name
      hoverStableTimer.current = setTimeout(() => {
        const stableName = lastHoverName.current
        if (!stableName) return
        if (activeNameRef.current && activeNameRef.current !== stableName)
          states.current[activeNameRef.current].hovered = false
        activeNameRef.current  = stableName
        activeRef.current      = nodeMap.current[stableName] ?? null
        states.current[stableName].hovered = true
        setActiveNameState(stableName)
        setHovered({ name: stableName, obj: nodeMap.current[stableName] })
        document.body.style.cursor = "pointer"
        const meta = OBJECT_META[stableName]
        if (meta) soundEngine.hover(meta.interaction)
      }, HOVER_DEBOUNCE_MS)
    } else {
      if (hoverStableTimer.current) clearTimeout(hoverStableTimer.current)
      lastHoverName.current = null
      if (activeNameRef.current) {
        states.current[activeNameRef.current].hovered = false
        activeNameRef.current = null; activeRef.current = null
        setActiveNameState(null); setHovered(null)
        document.body.style.cursor = "default"
      }
    }
  }

  const handlePointerOut = () => {
    if (hoverStableTimer.current) clearTimeout(hoverStableTimer.current)
    lastHoverName.current = null
    if (activeNameRef.current) states.current[activeNameRef.current].hovered = false
    activeNameRef.current = null; activeRef.current = null
    setActiveNameState(null); setHovered(null); document.body.style.cursor = "default"
  }

  const handleClick = (e) => {
    const name = findInteractiveName(e.object)
    if (!name) return
    e.stopPropagation()
    const s    = states.current[name]
    const meta = OBJECT_META[name]
    if (meta?.interaction === "wobble") {
      soundEngine.click("wobble")
      s.wobble = debug?.bottleClickWobble ?? 0.38
      s.wobblePhase = Math.random() * Math.PI * 2
    } else if (meta?.interaction === "darkmode") {
      soundEngine.click("darkmode")
      onDarkModeToggle?.()
    } else if (meta?.interaction === "press") {
      soundEngine.playPianoMelody()
      s.pianoPlaying  = true
      s.pianoNoteTimer = 0
    } else if (meta?.interaction === "tilt") {
      soundEngine.playMagic()
      s.hatMagicActive = true
      s.hatMagicTimer  = 0
    } else {
      soundEngine.click(meta?.interaction ?? "default")
    }
    setSelected({ name, obj: nodeMap.current[name] })
  }

  const showOutline = activeRef.current && activeNameState
    && !OBJECT_META[activeNameState]?.noOutline

  return (
    <>
      <primitive
        object={scene}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />
      <pointLight
        ref={candleLightRef}
        position={candlePos.current}
        intensity={0}
        distance={debug?.candleLightDistance ?? 10}
        decay={debug?.candleLightDecay ?? 2}
        castShadow={false}
        color="#ff6010"
      />
      {showOutline && (
        <LiveOutline targetRef={activeRef} debug={debug} objectName={activeNameState} />
      )}
      {mirrorNodeRef.current && (
        <GlintEffect targetRef={mirrorNodeRef} activeRef={mirrorGlintActiveRef} debug={debug} />
      )}
    </>
  )
}
