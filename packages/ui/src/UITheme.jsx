// ─────────────────────────────────────────────────────────────────────────────
// UI Theme system — 3 cozy variants
// "amber"   = original dark amber (existing)
// "parchment" = warm light parchment / aged paper
// "dusk"    = deep purple-blue twilight
// ─────────────────────────────────────────────────────────────────────────────

export const UI_THEMES = {
  amber: {
    name:      "Amber",
    emoji:     "🕯",
    bg:        "#0f0905",
    bgHov:     "#1a1208",
    bgActive:  "#2a1f0e",
    border:    "#2e1f0e",
    borderHov: "#6b4c2a",
    borderAct: "#c9973a",
    text:      "#6b4c2a",
    textHov:   "#b8925a",
    textAct:   "#e8c87a",
    accent:    "#c9973a",
    glow:      "rgba(201,151,58,0.25)",
    // Pill / container styles
    pillBg:    "#0f0905",
    shadow:    "0 4px 20px rgba(0,0,0,0.6)",
    font:      "'Caveat', cursive",
  },
  parchment: {
    name:      "Parchment",
    emoji:     "📜",
    bg:        "rgba(245,235,210,0.92)",
    bgHov:     "rgba(235,220,188,0.96)",
    bgActive:  "rgba(220,195,145,0.98)",
    border:    "rgba(180,140,80,0.35)",
    borderHov: "rgba(160,110,50,0.6)",
    borderAct: "#9b6a28",
    text:      "#7a5430",
    textHov:   "#5a3818",
    textAct:   "#3d2210",
    accent:    "#9b6a28",
    glow:      "rgba(155,106,40,0.22)",
    pillBg:    "rgba(245,235,210,0.92)",
    shadow:    "0 4px 20px rgba(100,70,20,0.18)",
    font:      "'Lora', Georgia, serif",
  },
  dusk: {
    name:      "Dusk",
    emoji:     "🌙",
    bg:        "rgba(14,10,28,0.94)",
    bgHov:     "rgba(28,18,48,0.96)",
    bgActive:  "rgba(45,28,72,0.98)",
    border:    "rgba(100,60,180,0.28)",
    borderHov: "rgba(140,90,220,0.55)",
    borderAct: "#c084fc",
    text:      "#8b6aaa",
    textHov:   "#c4a0e8",
    textAct:   "#e8d0ff",
    accent:    "#c084fc",
    glow:      "rgba(192,132,252,0.25)",
    pillBg:    "rgba(14,10,28,0.94)",
    shadow:    "0 4px 20px rgba(0,0,0,0.7)",
    font:      "'Caveat', cursive",
  },
}

export const THEME_ORDER = ["amber", "parchment", "dusk"]

import { useState, useCallback, createContext, useContext } from "react"

const ThemeCtx = createContext(UI_THEMES.amber)

export function UIThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState("amber")
  const cycle = useCallback(() => {
    setThemeKey(k => THEME_ORDER[(THEME_ORDER.indexOf(k) + 1) % THEME_ORDER.length])
  }, [])
  const theme = UI_THEMES[themeKey]
  return (
    <ThemeCtx.Provider value={{ theme, themeKey, cycle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useUITheme() {
  return useContext(ThemeCtx)
}

// ─────────────────────────────────────────────────────────────────────────────
// Themed button — replaces CozyButton, reads theme from context
// ─────────────────────────────────────────────────────────────────────────────
export function ThemedButton({ label, active, onClick, icon, title, children, style = {} }) {
  const { theme } = useUITheme()
  const [hov, setHov] = useState(false)

  const bg  = active ? theme.bgActive  : hov ? theme.bgHov  : theme.bg
  const bdr = active ? theme.borderAct : hov ? theme.borderHov : theme.border
  const col = active ? theme.textAct   : hov ? theme.textHov : theme.text

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={title}
      style={{
        background: bg,
        border: `2px solid ${bdr}`,
        borderRadius: 10,
        color: col,
        padding: "0 16px",
        fontSize: 13,
        cursor: "pointer",
        height: 36,
        fontFamily: theme.font,
        fontWeight: 600,
        letterSpacing: "0.04em",
        transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active
          ? `0 0 14px ${theme.glow}`
          : hov ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
        transform: hov && !active ? "translateY(-1px)" : "none",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        flexShrink: 0,
        backdropFilter: theme === UI_THEMES.parchment ? "blur(4px)" : "none",
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      {label ?? children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ThemeToggleButton — cycles through UI themes
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeToggleButton() {
  const { theme, cycle } = useUITheme()
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={cycle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`UI Theme: ${theme.name} — click to cycle`}
      style={{
        background: hov ? theme.bgHov : theme.bg,
        border: `2px solid ${hov ? theme.borderHov : theme.border}`,
        borderRadius: 10,
        color: hov ? theme.textHov : theme.text,
        padding: "0 12px",
        height: 36,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: theme.font,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
        transition: "all 0.18s",
        flexShrink: 0,
        boxShadow: hov ? `0 0 10px ${theme.glow}` : "none",
        transform: hov ? "translateY(-1px)" : "none",
      }}
    >
      <span>{theme.emoji}</span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>{theme.name}</span>
    </button>
  )
}
