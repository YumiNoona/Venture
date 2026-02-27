// WallClock.jsx — Real-time wall clock built with Three.js geometry
// No model needed! Built from cylinders and planes.
// Click to zoom in via the camera preset system.

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// Clock face with tick marks
function ClockFace({ radius }) {
  const ticks = useMemo(() => {
    const items = []
    for (let i = 0; i < 60; i++) {
      const isHour  = i % 5 === 0
      const angle   = (i / 60) * Math.PI * 2 - Math.PI / 2
      const inner   = radius * (isHour ? 0.80 : 0.87)
      const outer   = radius * 0.94
      const x1 = Math.cos(angle) * inner
      const y1 = Math.sin(angle) * inner
      const x2 = Math.cos(angle) * outer
      const y2 = Math.sin(angle) * outer
      items.push({ x1, y1, x2, y2, thick: isHour ? 0.006 : 0.003 })
    }
    return items
  }, [radius])

  return (
    <group>
      {/* Face disc */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color="#f5efe6" roughness={0.6} metalness={0.0} />
      </mesh>
      {/* Rim */}
      <mesh>
        <torusGeometry args={[radius, 0.025, 12, 64]} />
        <meshStandardMaterial color="#8b6a3a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Tick marks */}
      {ticks.map((tick, i) => {
        const mx = (tick.x1 + tick.x2) / 2
        const my = (tick.y1 + tick.y2) / 2
        const len = Math.hypot(tick.x2 - tick.x1, tick.y2 - tick.y1)
        const angle = Math.atan2(tick.y2 - tick.y1, tick.x2 - tick.x1)
        return (
          <mesh key={i} position={[mx, my, 0.005]} rotation={[0, 0, angle]}>
            <boxGeometry args={[len, tick.thick, 0.004]} />
            <meshStandardMaterial color="#4a3520" roughness={0.5} />
          </mesh>
        )
      })}
      {/* Center cap */}
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.02, 16]} />
        <meshStandardMaterial color="#c9973a" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  )
}

// A clock hand
function ClockHand({ length, width, color, rotation }) {
  return (
    <mesh
      rotation={[0, 0, rotation]}
      position={[length * 0.3, 0, 0.025]}
    >
      {/* Offset pivot so hand rotates from center */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[length, width, 0.012]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </mesh>
  )
}

export default function WallClock({ position = [0, 2, 0], radius = 0.28, nightMode }) {
  const hourRef   = useRef()
  const minuteRef = useRef()
  const secondRef = useRef()
  const groupRef  = useRef()

  useFrame(() => {
    const now    = new Date()
    const h      = now.getHours() % 12
    const m      = now.getMinutes()
    const s      = now.getSeconds()
    const ms     = now.getMilliseconds()

    // Smooth second hand (add ms fraction)
    const secAngle = -((s + ms / 1000) / 60) * Math.PI * 2
    // Smooth minute hand
    const minAngle = -((m + s / 60) / 60) * Math.PI * 2
    // Smooth hour hand
    const hrAngle  = -((h + m / 60) / 12) * Math.PI * 2

    if (hourRef.current)   hourRef.current.rotation.z   = hrAngle
    if (minuteRef.current) minuteRef.current.rotation.z = minAngle
    if (secondRef.current) secondRef.current.rotation.z = secAngle
  })

  const faceColor = nightMode ? "#c9973a" : "#e8c87a"

  return (
    <group ref={groupRef} position={position}>
      <ClockFace radius={radius} />

      {/* Hour hand */}
      <group ref={hourRef}>
        <mesh position={[radius * 0.22, 0, 0.02]}>
          <boxGeometry args={[radius * 0.44, 0.022, 0.012]} />
          <meshStandardMaterial color="#3d2a15" roughness={0.4} />
        </mesh>
      </group>

      {/* Minute hand */}
      <group ref={minuteRef}>
        <mesh position={[radius * 0.32, 0, 0.03]}>
          <boxGeometry args={[radius * 0.62, 0.015, 0.01]} />
          <meshStandardMaterial color="#3d2a15" roughness={0.4} />
        </mesh>
      </group>

      {/* Second hand */}
      <group ref={secondRef}>
        <mesh position={[radius * 0.3, 0, 0.04]}>
          <boxGeometry args={[radius * 0.70, 0.007, 0.008]} />
          <meshStandardMaterial color="#c9302a" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Counterbalance tail */}
        <mesh position={[-radius * 0.18, 0, 0.04]}>
          <boxGeometry args={[radius * 0.18, 0.009, 0.008]} />
          <meshStandardMaterial color="#c9302a" roughness={0.3} />
        </mesh>
      </group>

      {/* Center pin */}
      <mesh position={[0, 0, 0.045]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial color="#c9973a" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Subtle glow in night mode */}
      {nightMode && (
        <pointLight
          position={[0, 0, 0.3]}
          intensity={0.4}
          distance={1.5}
          color="#e8c87a"
          decay={2}
        />
      )}
    </group>
  )
}
