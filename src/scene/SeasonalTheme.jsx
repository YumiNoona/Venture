import { useState, useCallback } from "react"
import { useUITheme } from "./UITheme"

export const SEASONS = {
  autumn: {
    label: "Autumn", emoji: "🍂",
    fogR: 0.055, fogG: 0.038, fogB: 0.018,
    fogNightR: 0.010, fogNightG: 0.007, fogNightB: 0.005,
    bgR: 0.058, bgG: 0.050, bgB: 0.040,
    bgNightR: 0.008, bgNightG: 0.006, bgNightB: 0.010,
    ambR: 1.0, ambG: 0.84, ambB: 0.62,
    fogDensity: 0.038,
    accent: "#c9973a",
  },
  winter: {
    label: "Winter", emoji: "❄️",
    fogR: 0.038, fogG: 0.042, fogB: 0.062,
    fogNightR: 0.005, fogNightG: 0.007, fogNightB: 0.018,
    bgR: 0.042, bgG: 0.046, bgB: 0.065,
    bgNightR: 0.005, bgNightG: 0.007, bgNightB: 0.016,
    ambR: 0.78, ambG: 0.88, ambB: 1.0,
    fogDensity: 0.045,
    accent: "#93c5fd",
  },
  spring: {
    label: "Spring", emoji: "🌸",
    fogR: 0.048, fogG: 0.055, fogB: 0.042,
    fogNightR: 0.007, fogNightG: 0.009, fogNightB: 0.007,
    bgR: 0.050, bgG: 0.056, bgB: 0.044,
    bgNightR: 0.006, bgNightG: 0.009, bgNightB: 0.007,
    ambR: 0.90, ambG: 1.0, ambB: 0.80,
    fogDensity: 0.033,
    accent: "#f9a8d4",
  },
}

export const SEASON_ORDER = ["autumn", "winter", "spring"]

export function useSeasonalTheme() {
  const [seasonKey, setSeasonKey] = useState("autumn")
  const cycleSeason = useCallback(() => {
    setSeasonKey(k => SEASON_ORDER[(SEASON_ORDER.indexOf(k) + 1) % SEASON_ORDER.length])
  }, [])
  return { seasonKey, season: SEASONS[seasonKey], cycleSeason }
}

export function SeasonButton({ season, onClick }) {
  const { theme } = useUITheme()
  const [hov, setHov]     = useState(false)
  const [burst, setBurst] = useState(false)

  const handleClick = () => {
    setBurst(true)
    setTimeout(() => setBurst(false), 500)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Click to cycle season"
      style={{
        position:"relative", overflow:"hidden",
        background: hov ? theme.bgHov : theme.bg,
        border:`2px solid ${hov ? season.accent : theme.border}`,
        borderRadius:10,
        color: hov ? season.accent : theme.text,
        padding:"0 14px", height:36,
        fontSize:13, cursor:"pointer",
        fontFamily: theme.font, fontWeight:600,
        letterSpacing:"0.04em",
        transition:"all 0.22s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: hov ? `0 0 14px ${season.accent}44` : "none",
        transform: hov ? "translateY(-1px)" : "none",
        display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
        flexShrink:0,
      }}
    >
      {burst && (
        <span style={{
          position:"absolute", inset:0,
          background:`radial-gradient(circle, ${season.accent}33 0%, transparent 70%)`,
          animation:"seasonBurst 0.5s ease-out forwards",
          pointerEvents:"none",
        }} />
      )}
      <span style={{ fontSize:14 }}>{season.emoji}</span>
      <span>{season.label}</span>
      <style>{`@keyframes seasonBurst{from{opacity:1;transform:scale(0.5)}to{opacity:0;transform:scale(2.5)}}`}</style>
    </button>
  )
}
