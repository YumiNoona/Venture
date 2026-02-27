import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// ── FIX: Hoist Color objects outside useFrame — no more per-frame allocations
const COLOR_NIGHT = new THREE.Color("#e8a050")
const COLOR_DAY   = new THREE.Color("#d4b896")

export default function DustMotes({ nightMode, debug = {} }) {
  const meshRef = useRef()

  const count = debug?.dustCount ?? 160

  const { positions, velocities, phases } = useMemo(() => {
    const positions  = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases     = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i*3]     = (Math.random() - 0.5) * 14
      positions[i*3+1]   = Math.random() * 6
      positions[i*3+2]   = (Math.random() - 0.5) * 14
      velocities[i*3]    = (Math.random() - 0.5) * 0.006
      velocities[i*3+1]  = 0.0008 + Math.random() * 0.003
      velocities[i*3+2]  = (Math.random() - 0.5) * 0.006
      phases[i]          = Math.random() * Math.PI * 2
    }
    return { positions, velocities, phases }
  }, [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3))
    return geo
  }, [positions])

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.025,
    color: new THREE.Color("#d4b896"),
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const geo = meshRef.current?.geometry
    if (!geo) return
    const pos = geo.attributes.position.array

    const speed = debug?.dustSpeed ?? 1.0

    for (let i = 0; i < count; i++) {
      const ph = phases[i]
      pos[i*3]   += (velocities[i*3]   + Math.sin(t*0.33 + ph)      * 0.0006) * speed
      pos[i*3+1] += (velocities[i*3+1] + Math.cos(t*0.27 + ph*1.3)  * 0.0004) * speed
      pos[i*3+2] += (velocities[i*3+2] + Math.sin(t*0.30 + ph*0.8)  * 0.0006) * speed

      if (pos[i*3+1] > 7) {
        pos[i*3+1] = 0
        pos[i*3]   = (Math.random() - 0.5) * 14
        pos[i*3+2] = (Math.random() - 0.5) * 14
      }
      if (Math.abs(pos[i*3])   > 7.5) pos[i*3]   *= -0.9
      if (Math.abs(pos[i*3+2]) > 7.5) pos[i*3+2] *= -0.9
    }

    geo.attributes.position.needsUpdate = true

    if (material) {
      const baseSize    = debug?.dustSize    ?? 0.025
      const baseOpacity = nightMode
        ? (debug?.dustNightOpacity ?? 0.70)
        : (debug?.dustDayOpacity   ?? 0.40)

      // ── FIX: reuse hoisted Color objects — no allocation
      material.size    += (baseSize    - material.size)    * 0.05
      material.opacity += (baseOpacity - material.opacity) * 0.04
      material.color.lerp(nightMode ? COLOR_NIGHT : COLOR_DAY, 0.03)
      material.needsUpdate = true
    }
  })

  return <points ref={meshRef} geometry={geometry} material={material} />
}
