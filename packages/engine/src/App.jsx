import { useState } from "react"
import Scene from "./scene/Scene"
import InfoPanel from "./scene/InfoPanel"
import IntroScreen from "./scene/IntroScreen"

// ── Auto night: if it's evening/night when user arrives, start in night mode
function shouldAutoNight() {
  const h = new Date().getHours()
  return h >= 20 || h < 6
}

export default function App() {
  const [entered,   setEntered]   = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [hovered,   setHovered]   = useState(null)
  // ── FIX: initialise nightMode from time-of-day
  const [nightMode, setNightMode] = useState(shouldAutoNight)
  const toggleNightMode = () => setNightMode(n => !n)

  return (
    <>
      <div style={{
        opacity: entered ? 1 : 0,
        transition: "opacity 0.9s ease",
        pointerEvents: entered ? "all" : "none",
        position: "fixed", inset: 0,
      }}>
        <Scene
          selected={selected}
          setSelected={setSelected}
          hovered={hovered}
          setHovered={setHovered}
          nightMode={nightMode}
          onDarkModeToggle={toggleNightMode}
          sparkleEnabled={entered}
        />
        <InfoPanel
          selected={selected}
          onClose={() => setSelected(null)}
        />
      </div>
      {!entered && <IntroScreen onEnter={() => setEntered(true)} />}
    </>
  )
}
