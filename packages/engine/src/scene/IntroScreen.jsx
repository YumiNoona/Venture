import { useEffect, useState, useRef, useCallback } from "react"

// ── Time-of-day greeting ──────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return "Good morning"
  if (h >= 12 && h < 17) return "Good afternoon"
  if (h >= 17 && h < 21) return "Good evening"
  return "Good night"
}

const GREETING      = getGreeting()
const TYPEWRITER_TEXT = `${GREETING}. Welcome to Venture.`
const SUB_TEXT = "An interactive 3D Venture space — hover and click the objects to explore."

// ── Floating particle for dark mode loading screen ────────────────────────────
function StarParticle({ style }) {
  return (
    <div style={{
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(201,151,58,0.6)",
      pointerEvents: "none",
      animation: "starFloat 4s ease-in-out infinite",
      ...style,
    }} />
  )
}

const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:  `${8 + (i * 37.3) % 84}%`,
  top:   `${5 + (i * 53.7) % 90}%`,
  size:  1.5 + (i % 4) * 0.8,
  delay: `${(i * 0.41) % 3.5}s`,
  dur:   `${3.2 + (i % 5) * 0.7}s`,
  opacity: 0.15 + (i % 5) * 0.07,
}))

export default function IntroScreen({ onEnter }) {
  const [theme, setTheme]           = useState("light")
  const [phase, setPhase]           = useState("loading")
  const [progress, setProgress]     = useState(0)
  const [typed, setTyped]           = useState("")
  const [subVisible, setSubVisible] = useState(false)
  const [btnVisible, setBtnVisible] = useState(false)
  const [exiting, setExiting]       = useState(false)
  const [diveIn, setDiveIn]         = useState(false)
  const [btnHov, setBtnHov]         = useState(false)
  const [themeHov, setThemeHov]     = useState(false)
  const raf    = useRef()
  const start  = useRef(Date.now())
  // ── FIX: collect all timers so they can be cleared on unmount
  const timers = useRef([])

  const dark = theme === "dark"

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const T = dark ? {
    bgGrad:    "linear-gradient(145deg, #0d0905 0%, #080603 60%, #060402 100%)",
    card:      "rgba(18,12,6,0.92)",
    cardBdr:   "rgba(120,80,30,0.35)",
    cardShad:  "0 8px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)",
    title:     "#e8d5b0",
    sub:       "#5a3f25",
    badge:     "#a07040",
    badgeBdr:  "rgba(120,80,30,0.45)",
    chip:      "#5a3825",
    chipBg:    "#0f0905",
    chipBdr:   "rgba(60,38,18,0.7)",
    btnBg:     "#1a1208",
    btnBdr:    "#4a3520",
    btnTxt:    "#c9973a",
    btnHovBg:  "linear-gradient(135deg, #c9973a 0%, #e8b84a 100%)",
    btnHovTxt: "#ffffff",
    btnShad:   "0 2px 8px rgba(0,0,0,0.5)",
    accent:    "#c9973a",
    divider:   "#c9973a",
    footer:    "#2e1f0e",
    vignette:  "inset 0 0 130px 65px rgba(6,4,2,0.9)",
    diveVig:   "inset 0 0 300px 160px #060402",
    radial:    "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(180,100,20,0.07) 0%, transparent 70%)",
    dot:       "rgba(201,151,58,0.08)",
    pbarTrack: "#2e1f0e55",
    blur:      "none",
  } : {
    bgGrad:    "linear-gradient(145deg, #f5efe6 0%, #ede4d6 40%, #e8ddd0 100%)",
    card:      "rgba(255,252,246,0.62)",
    cardBdr:   "rgba(180,140,70,0.28)",
    cardShad:  "0 8px 48px rgba(160,110,40,0.12), inset 0 1px 0 rgba(255,255,255,0.65)",
    title:     "#3d2410",
    sub:       "#7a5535",
    badge:     "#8b5e2a",
    badgeBdr:  "rgba(180,140,70,0.4)",
    chip:      "#8b6030",
    chipBg:    "rgba(255,255,255,0.65)",
    chipBdr:   "rgba(180,140,70,0.35)",
    btnBg:     "rgba(255,255,255,0.72)",
    btnBdr:    "rgba(180,140,70,0.5)",
    btnTxt:    "#7a5535",
    btnHovBg:  "linear-gradient(135deg, #c9973a 0%, #e8b84a 100%)",
    btnHovTxt: "#ffffff",
    btnShad:   "0 2px 12px rgba(160,110,40,0.15), 0 1px 0 rgba(255,255,255,0.85) inset",
    accent:    "#c9973a",
    divider:   "#c9973a",
    footer:    "#b8a080",
    vignette:  "inset 0 0 120px 60px rgba(180,140,80,0.18)",
    diveVig:   "inset 0 0 300px 150px rgba(200,160,100,0.6)",
    radial:    "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(210,160,60,0.22) 0%, transparent 70%)",
    dot:       "rgba(160,110,40,0.18)",
    pbarTrack: "#d4b88060",
    blur:      "blur(10px)",
  }

  // ── Loading progress ───────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - start.current
      let p = Math.min(elapsed / 2400, 1)
      p = p < 0.85 ? p * 1.1 : 0.935 + (p - 0.85) * 0.65
      p = Math.min(p, 1)
      setProgress(p)
      if (p < 1) { raf.current = requestAnimationFrame(tick) }
      else {
        const t = setTimeout(() => setPhase("typing"), 350)
        timers.current.push(t)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // ── Typewriter ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "typing") return
    let i = 0
    const iv = setInterval(() => {
      i++; setTyped(TYPEWRITER_TEXT.slice(0, i))
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(iv)
        const t1 = setTimeout(() => setSubVisible(true), 250)
        const t2 = setTimeout(() => setBtnVisible(true), 700)
        timers.current.push(t1, t2)
        setPhase("ready")
      }
    }, 55)
    return () => clearInterval(iv)
  }, [phase])

  // ── Cleanup all timers on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  // ── FIX: no nested setTimeout — uses timer ref for cleanup
  const handleEnter = () => {
    setDiveIn(true)
    const t1 = setTimeout(() => {
      setExiting(true)
      const t2 = setTimeout(onEnter, 600)
      timers.current.push(t2)
    }, 400)
    timers.current.push(t1)
  }

  const toggleTheme = useCallback(() => setTheme(t => t === "light" ? "dark" : "light"), [])

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: T.bgGrad,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Lora', Georgia, serif",
      opacity: exiting ? 0 : 1,
      transform: diveIn ? "scale(1.06)" : "scale(1)",
      transition: exiting
        ? "opacity 0.6s ease"
        : diveIn
          ? "transform 0.4s ease"
          : "background 0.55s ease, opacity 0.3s ease",
      pointerEvents: exiting ? "none" : "all",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        boxShadow: diveIn ? T.diveVig : T.vignette,
        transition: "box-shadow 0.4s ease",
        zIndex: 10,
      }} />

      {/* Radial glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: T.radial, transition: "background 0.55s ease" }} />

      {/* Paper grain */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        opacity: dark ? 0.35 : 0.55,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        transition: "opacity 0.55s ease",
      }} />

      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, ${T.dot} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }} />

      {/* Dark mode particles */}
      {dark && PARTICLES.map(p => (
        <StarParticle key={p.id} style={{
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          animationDelay: p.delay, animationDuration: p.dur,
          "--op": p.opacity,
        }} />
      ))}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setThemeHov(true)}
        onMouseLeave={() => setThemeHov(false)}
        style={{
          position: "absolute", top: 20, right: 20,
          background: themeHov
            ? (dark ? "#1a1208" : "rgba(255,255,255,0.9)")
            : (dark ? "#0f0905" : "rgba(255,255,255,0.65)"),
          border: `1.5px solid ${dark ? "#4a3520" : "rgba(180,140,70,0.45)"}`,
          borderRadius: 10, padding: "6px 14px",
          fontFamily: "'Caveat', cursive", fontSize: 13, fontWeight: 600,
          color: dark ? "#c9973a" : "#7a5535",
          cursor: "pointer", zIndex: 20,
          transition: "all 0.2s",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span>{dark ? "☀️" : "🌙"}</span>
        <span>{dark ? "Light" : "Dark"}</span>
      </button>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 5,
        background: T.card,
        border: `1.5px solid ${T.cardBdr}`,
        borderRadius: 20,
        padding: "clamp(28px, 5vw, 44px) clamp(24px, 5vw, 52px)",
        maxWidth: "min(480px, 90vw)",
        width: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 18,
        boxShadow: T.cardShad,
        backdropFilter: dark ? "none" : T.blur,
        textAlign: "center",
        transition: "background 0.55s ease, border-color 0.55s ease",
      }}>

        {/* ── Loading phase ── */}
        {phase === "loading" && (
          <>
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 13, fontWeight: 600,
              color: T.badge, letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {dark
                ? <span style={{ animation: "flameDance 1.8s ease-in-out infinite" }}>🕯</span>
                : <span style={{ animation: "spin 3s linear infinite", display: "inline-block" }}>✦</span>
              }
              <span>{dark ? "Lighting the candles..." : "Preparing the room..."}</span>
            </div>

            {/* Progress bar */}
            <div style={{ width: 220, position: "relative" }}>
              <svg width="220" height="18" viewBox="0 0 220 18" style={{ display: "block", overflow: "visible" }}>
                <path d="M4 9 Q110 6 216 9"
                  stroke={T.pbarTrack} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* ── FIX: proportional control point so curve stays true to track shape */}
                {progress > 0 && (() => {
                  const px = 4 + progress * 212
                  const cx = 4 + (px - 4) * 0.15
                  return (
                    <path d={`M4 9 Q${cx.toFixed(1)} 6 ${px.toFixed(1)} 9`}
                      stroke={T.accent} strokeWidth="3" fill="none" strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 ${dark ? "7px" : "4px"} rgba(201,151,58,${dark ? "0.9" : "0.6"}))` }}
                    />
                  )
                })()}
                {progress > 0.02 && (() => {
                  const px = 4 + progress * 212
                  return (
                    <circle cx={px} cy={9} r={dark ? 5 : 4} fill="#e8b84a"
                      style={{ filter: `drop-shadow(0 0 ${dark ? "8px" : "5px"} rgba(232,184,74,${dark ? "1.0" : "0.85"}))` }} />
                  )
                })()}
              </svg>
            </div>

            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 14,
              color: T.badge, fontWeight: 600, fontVariantNumeric: "tabular-nums",
            }}>
              {Math.round(progress * 100)}%
            </div>

            {dark && (
              <div style={{
                fontSize: 11, color: "#3d2a15", fontFamily: "'Caveat', cursive",
                letterSpacing: "0.1em", animation: "cozyBlink 2.5s step-end infinite",
              }}>hover · click · explore</div>
            )}
          </>
        )}

        {/* ── Typing / Ready phase ── */}
        {(phase === "typing" || phase === "ready") && (
          <>
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 13, letterSpacing: "0.18em",
              color: T.badge, textTransform: "uppercase", fontWeight: 700,
              border: `1.5px solid ${T.badgeBdr}`, borderRadius: 20, padding: "3px 16px",
              background: dark ? "#0f0905" : "rgba(255,255,255,0.5)",
              transition: "all 0.55s ease",
            }}>✦ 3D Portfolio ✦</div>

            {/* Typewriter title — now shows time-of-day greeting */}
            <h1 style={{
              margin: 0, fontFamily: "'Caveat', cursive",
              fontSize: "clamp(26px, 5.5vw, 48px)", fontWeight: 700,
              color: T.title, lineHeight: 1.1, minHeight: "1.1em",
              letterSpacing: "-0.01em",
              textShadow: dark ? "0 0 40px rgba(200,140,40,0.35)" : "0 2px 20px rgba(180,120,40,0.18)",
              transition: "color 0.55s ease, text-shadow 0.55s ease",
            }}>
              {typed}
              <span style={{
                display: "inline-block", width: 3, height: "0.8em",
                background: "#c9973a", marginLeft: 4, verticalAlign: "text-top",
                animation: "cozyBlink 0.85s step-end infinite", borderRadius: 1,
              }} />
            </h1>

            <svg width="200" height="10" viewBox="0 0 200 10" style={{
              overflow: "visible",
              opacity: subVisible ? 0.7 : 0, transition: "opacity 0.5s ease",
            }}>
              <path d="M0 5 Q25 1 50 5 Q75 9 100 5 Q125 1 150 5 Q175 9 200 5"
                stroke={T.divider} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>

            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.85,
              color: T.sub, fontStyle: "italic",
              opacity: subVisible ? 1 : 0,
              transform: subVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.5s ease, transform 0.5s ease, color 0.55s ease",
            }}>{SUB_TEXT}</p>

            <div style={{
              display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
              opacity: btnVisible ? 1 : 0, transition: "opacity 0.4s 0.1s ease",
            }}>
              {[
                { icon: "🖱", text: "Left drag orbit" },
                { icon: "✋", text: "Right drag pan" },
                { icon: "🔍", text: "Scroll / pinch zoom" },
              ].map((h, i) => (
                <div key={i} style={{
                  fontFamily: "'Caveat', cursive", fontSize: 12, color: T.chip,
                  background: T.chipBg, border: `1.5px solid ${T.chipBdr}`,
                  borderRadius: 8, padding: "3px 11px",
                  display: "flex", alignItems: "center", gap: 4,
                  transition: "all 0.55s ease",
                }}>
                  <span>{h.icon}</span><span>{h.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleEnter}
              onMouseEnter={() => setBtnHov(true)}
              onMouseLeave={() => setBtnHov(false)}
              style={{
                marginTop: 6, padding: "14px 52px",
                fontFamily: "'Caveat', cursive", fontWeight: 700,
                fontSize: 17, letterSpacing: "0.06em",
                background: btnHov ? T.btnHovBg : T.btnBg,
                border: `2px solid ${btnHov ? "#c9973a" : T.btnBdr}`,
                borderRadius: 14,
                color: btnHov ? T.btnHovTxt : T.btnTxt,
                cursor: "pointer",
                opacity: btnVisible ? 1 : 0,
                transform: btnVisible
                  ? btnHov ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)"
                  : "scale(0.97)",
                transition: "opacity 0.4s ease, transform 0.2s ease, background 0.22s, border-color 0.22s, color 0.22s, box-shadow 0.22s",
                boxShadow: btnHov
                  ? "0 6px 28px rgba(201,151,58,0.4), 0 2px 0 rgba(255,255,255,0.25) inset"
                  : T.btnShad,
              }}
            >Enter Room →</button>
          </>
        )}
      </div>

      <div style={{
        position: "absolute", bottom: 20, right: 24,
        fontFamily: "'Caveat', cursive", fontSize: 11,
        color: T.footer, letterSpacing: "0.08em", opacity: 0.8,
        transition: "color 0.55s ease",
      }}>React Three Fiber · Three.js</div>

      <style>{`
        @keyframes cozyBlink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes flameDance {
          0%,100% { transform: rotate(-4deg) scale(1.0); }
          50%     { transform: rotate(4deg)  scale(1.08); }
        }
        @keyframes starFloat {
          0%,100% { transform: translateY(0px)  scale(1);   opacity: var(--op, 0.3); }
          33%     { transform: translateY(-6px) scale(1.2); opacity: calc(var(--op, 0.3) * 1.5); }
          66%     { transform: translateY(3px)  scale(0.9); opacity: calc(var(--op, 0.3) * 0.7); }
        }
      `}</style>
    </div>
  )
}
