import { useThree, useFrame } from "@react-three/fiber"
import { useRef, useEffect } from "react"
import * as THREE from "three"

const DEFAULT_POS    = new THREE.Vector3(8, 5, 8)
const DEFAULT_TARGET = new THREE.Vector3(0, 1.5, 0)

export default function CameraRig({ selected, debug, presetTarget, cameraLockedRef, onModeChange }) {
  const { camera } = useThree()
  const lookTarget     = useRef(new THREE.Vector3(0, 1.5, 0))
  const mode           = useRef("orbit")       // "orbit" | "selected" | "preset" | "returning"
  const returnProgress = useRef(0)
  const returnFromPos  = useRef(new THREE.Vector3())
  const returnFromLook = useRef(new THREE.Vector3())
  const prevSelected   = useRef(null)
  const prevPreset     = useRef(null)

  const setMode = (m) => {
    if (mode.current !== m) {
      mode.current = m
      onModeChange?.(m)
    }
  }

  useFrame((_, delta) => {
    const lerp = debug?.cameraLerp ?? 0.05
    const ox   = debug?.cameraOffsetX ?? 1.5
    const oy   = debug?.cameraOffsetY ?? 1.2
    const oz   = debug?.cameraOffsetZ ?? 1.5

    const justDeselected  = prevSelected.current && !selected
    const justLeftPreset  = prevPreset.current !== null && presetTarget === null && !selected

    // Detect transitions → start return-home animation
    if ((justDeselected || justLeftPreset) && mode.current !== "returning") {
      setMode("returning")
      cameraLockedRef.current = true
      returnProgress.current  = 0
      returnFromPos.current.copy(camera.position)
      returnFromLook.current.copy(lookTarget.current)
    }

    prevSelected.current = selected
    prevPreset.current   = presetTarget

    // ── Object selected: zoom to it ──────────────────────────────────────────
    if (selected?.obj) {
      setMode("selected")
      cameraLockedRef.current = true
      const pos = new THREE.Vector3()
      selected.obj.getWorldPosition(pos)
      const desired = pos.clone().add(new THREE.Vector3(ox, oy, oz))
      camera.position.lerp(desired, lerp)
      lookTarget.current.lerp(pos, lerp * 2)
      camera.lookAt(lookTarget.current)
      return
    }

    // ── Preset view ──────────────────────────────────────────────────────────
    if (presetTarget) {
      setMode("preset")
      cameraLockedRef.current = true
      camera.position.lerp(presetTarget.pos, lerp * 1.8)
      lookTarget.current.lerp(presetTarget.target, lerp * 2.5)
      camera.lookAt(lookTarget.current)
      return
    }

    // ── Smooth return to hero position ───────────────────────────────────────
    if (mode.current === "returning") {
      returnProgress.current = Math.min(returnProgress.current + delta * 1.2, 1)
      // Ease-in-out cubic
      const t = returnProgress.current
      const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2

      camera.position.lerpVectors(returnFromPos.current, DEFAULT_POS, ease)
      lookTarget.current.lerpVectors(returnFromLook.current, DEFAULT_TARGET, ease)
      camera.lookAt(lookTarget.current)

      if (returnProgress.current >= 1) {
        camera.position.copy(DEFAULT_POS)
        lookTarget.current.copy(DEFAULT_TARGET)
        camera.lookAt(DEFAULT_TARGET)
        // Hand control back to OrbitControls
        cameraLockedRef.current = false
        setMode("orbit")
      }
      return
    }

    // Mode is "orbit" — OrbitControls owns camera
  })

  return null
}
