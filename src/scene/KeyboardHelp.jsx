// KeyboardHelp.jsx — Keyboard shortcut overlay
// Shown when user presses ? or clicks the ? button
import { useState, useEffect, useCallback } from "react"

const SHORTCUTS = [
  { key: "N",   desc: "Toggle night mode" },
  { key: "S",   desc: "Cycle season" },
  { key: "M",   desc: "Mute / unmute music" },
  { key: "→",   desc: "Skip to next mood" },
  { key: "Esc", desc: "Close panel / overlay" },
  { key: "?",   desc: "Toggle this help" },
]

export function useKeyboardShortcuts({ onNight, onSeason, onMute, onSkip }) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return

      if (e.key === "n" || e.key === "N") onNight?.()
      if (e.key === "s" || e.key === "S") onSeason?.()
      if (e.key === "m" || e.key === "M") onMute?.()
      if (e.key === "ArrowRight")         onSkip?.()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onNight, onSeason, onMute, onSkip])
}

export default function KeyboardHelp({ theme }) {
  const [open, setOpen] = useState(false)
  const [hov, setHov]   = useState(false)

  // ? key toggles overlay; Escape closes
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return
      if (e.key === "?") setOpen(o => !o)
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const t = theme ?? {
    bg: "#0f0905", bgHov: "#1a1208",
    border: "#2e1f0e", borderHov: "#6b4c2a", borderAct: "#c9973a",
    text: "#6b4c2a", textHov: "#b8925a", textAct: "#e8c87a",
    accent: "#c9973a", glow: "rgba(201,151,58,0.25)",
    font: "'Caveat', cursive",
  }

  return (
    <>
      {/* ? Button */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title="Keyboard shortcuts (?)"
        style={{
          background: open ? t.bgHov : hov ? t.bgHov : t.bg,
          border: `2px solid ${open ? t.borderAct : hov ? t.borderHov : t.border}`,
          borderRadius: 10,
          color: open ? t.textAct : hov ? t.textHov : t.text,
          width: 36, height: 36,
          fontSize: 14, fontWeight: 700,
          cursor: "pointer",
          fontFamily: t.font,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s",
          flexShrink: 0,
          boxShadow: open ? `0 0 14px ${t.glow}` : "none",
        }}
      >?</button>

      {/* Overlay */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 40,
              background: "rgba(0,0,0,0.35)",
            }}
          />

          {/* Panel */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 50,
            background: t.bg,
            border: `2px solid ${t.borderAct}`,
            borderRadius: 16,
            padding: "24px 28px",
            minWidth: 280,
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 30px ${t.glow}`,
            animation: "kbFadeIn 0.2s ease",
          }}>
            <div style={{
              fontFamily: t.font, fontSize: 16, fontWeight: 700,
              color: t.accent, letterSpacing: "0.08em",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⌨️</span>
              <span>Keyboard Shortcuts</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <kbd style={{
                    fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                    background: t.bgHov,
                    border: `1.5px solid ${t.borderHov}`,
                    borderBottom: `3px solid ${t.borderHov}`,
                    borderRadius: 6,
                    padding: "2px 8px", minWidth: 32, textAlign: "center",
                    color: t.textAct,
                    flexShrink: 0,
                  }}>{key}</kbd>
                  <span style={{
                    fontFamily: t.font, fontSize: 13,
                    color: t.textHov,
                  }}>{desc}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 16, paddingTop: 12,
              borderTop: `1px solid ${t.border}`,
              fontFamily: t.font, fontSize: 11,
              color: t.text, textAlign: "center",
            }}>
              Press <strong style={{ color: t.textAct }}>?</strong> or <strong style={{ color: t.textAct }}>Esc</strong> to close
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes kbFadeIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  )
}
