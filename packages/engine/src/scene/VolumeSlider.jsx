import { useState, useRef, useEffect, useCallback } from "react"

const W  = 80
const H  = 28
const CY = H / 2

function buildWavePath(volume, time) {
  const amp = volume * 5.5
  const pts = []
  for (let x = 0; x <= W; x += 3) {
    const y = CY - amp * Math.sin((x / W) * Math.PI * 4 + time)
    pts.push(`${x === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(2)}`)
  }
  return pts.join(" ")
}

function waveY(volume, kx, time) {
  return CY - volume * 5.5 * Math.sin((kx / W) * Math.PI * 4 + time)
}

// Default theme fallback — amber
const DEFAULT_THEME = {
  bg: "#0f0905", bgHov: "#1a1208",
  border: "#2e1f0e", borderHov: "#6b4c2a", borderAct: "#c9973a",
  text: "#6b4c2a", textHov: "#b8925a", textAct: "#e8c87a",
  accent: "#c9973a", font: "'Caveat', cursive",
}

export default function VolumeSlider({
  volume, onVolumeChange,
  muted, onMuteToggle,
  moodEmoji, moodName, onSkip,
  theme = DEFAULT_THEME,
}) {
  const [hov,      setHov]      = useState(false)
  const [dragging, setDragging] = useState(false)
  const [waveT,    setWaveT]    = useState(0)
  const sliderRef  = useRef(null)
  const rafRef     = useRef(null)

  useEffect(() => {
    let prev = performance.now()
    const loop = (now) => {
      const dt = (now - prev) / 1000
      prev = now
      setWaveT(t => t + dt * (muted ? 0.22 : 0.85 + volume * 0.7))
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [muted, volume])

  const getV = useCallback((e) => {
    const rect = sliderRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }, [])

  const handleMouseDown = (e) => {
    e.preventDefault()
    setDragging(true)
    const v = getV(e)
    onVolumeChange(v)
    if (muted && v > 0) onMuteToggle()
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => onVolumeChange(getV(e))
    const onUp   = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging, getV, onVolumeChange])

  const kx       = volume * W
  const ky       = waveY(volume, kx, waveT)
  const wavePath = buildWavePath(volume, waveT)
  const accent   = muted ? theme.border : theme.accent
  const expanded = hov || dragging

  return (
    <div
      style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { if (!dragging) setHov(false) }}
    >
      {/* Mood label — floats above pill on hover */}
      <div style={{
        fontFamily: theme.font, fontSize:11, color: theme.text,
        opacity: expanded ? 0.9 : 0,
        transform: expanded ? "translateY(0)" : "translateY(4px)",
        transition:"opacity 0.2s, transform 0.2s",
        display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
        height: expanded ? 16 : 0, overflow:"hidden",
        marginBottom: expanded ? 2 : 0,
      }}>
        <span>{moodEmoji}</span>
        <span>{moodName}</span>
        <button onClick={onSkip} title="Skip mood" style={{
          background:"none", border:"none", color: theme.text,
          cursor:"pointer", fontFamily: theme.font, fontSize:11,
          padding:"0 2px", lineHeight:1,
        }}>⏭</button>
      </div>

      {/* Main pill */}
      <div style={{
        display:"flex", alignItems:"center", gap:6,
        background: theme.bg,
        border:`2px solid ${expanded ? accent + "99" : theme.border}`,
        borderRadius:10, padding:"0 10px", height:36,
        transition:"border-color 0.22s, box-shadow 0.22s, width 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: expanded ? `0 0 12px ${accent}22` : "none",
      }}>
        {/* Mute icon */}
        <button onClick={onMuteToggle} title={muted?"Unmute":"Mute"} style={{
          background:"none", border:"none", fontSize:15,
          cursor:"pointer", padding:0, lineHeight:1, flexShrink:0,
        }}>
          {muted ? "🔇" : volume > 0.55 ? "🔊" : volume > 0 ? "🔉" : "🔈"}
        </button>

        {/* Wave SVG */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          style={{
            width: expanded ? 100 : 56,
            transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)",
            cursor:"ew-resize", userSelect:"none", flexShrink:0,
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
            style={{ display:"block", overflow:"visible" }}>
            <line x1={0} y1={CY} x2={W} y2={CY}
              stroke={theme.border} strokeWidth={1.5} strokeLinecap="round" />
            <path d={wavePath} fill="none"
              stroke={accent}
              strokeWidth={muted ? 1 : 1.8}
              strokeLinecap="round" strokeLinejoin="round"
              opacity={muted ? 0.3 : 1}
              style={{
                filter: muted ? "none" : `drop-shadow(0 0 3px ${accent}88)`,
                transition:"stroke 0.4s, opacity 0.4s",
              }}
            />
            {/* Knob */}
            <circle cx={kx} cy={ky}
              r={dragging ? 5 : expanded ? 4.5 : 3.5}
              fill={muted ? theme.border : theme.textAct}
              style={{
                filter:`drop-shadow(0 0 ${dragging?7:3}px ${accent}cc)`,
                transition:"r 0.15s",
              }}
            />
            {expanded && (
              <circle cx={kx} cy={ky} r={dragging ? 8 : 6.5}
                fill="none" stroke={accent} strokeWidth={1} opacity={0.35} />
            )}
          </svg>
        </div>

        {/* Volume % */}
        <span style={{
          fontFamily: theme.font, fontSize:11, color: theme.text,
          minWidth:22, textAlign:"right",
          opacity: expanded ? 0.85 : 0,
          transition:"opacity 0.2s",
          fontVariantNumeric:"tabular-nums", flexShrink:0,
        }}>
          {muted ? "—" : Math.round(volume * 100)}
        </span>
      </div>
    </div>
  )
}
