import { useEffect, useState, useRef, useCallback } from "react"

const TYPEWRITER_TEXT = "Welcome to my room."
const SUB_TEXT = "An interactive 3D space — hover and click the objects to explore."

// ── Floating particle for dark mode loading screen ───────────────────────────
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

// Pre-generate stable particle positions
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
  const raf   = useRef()
  const start = useRef(Date.now())

  const dark = theme === "dark"

  // ── Theme tokens ─────────────────────────────────────────────────────────────
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
    glowColor: "rgba(180,100,20,0.07)",
    pbarTrack: "#2e1f0e55",
    loadText:  "🕯 Lighting the candles...",
    blur:      "none",
    bFilter:   "none",
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
    glowColor: "rgba(210,150,50,0.14)",
    pbarTrack: "#d4b88060",
    loadText:  "✦ Preparing the room",
    blur:      "blur(10px)",
    bFilter:   "blur(10px)",
  }

  // ── Loading progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - start.current
      let p = Math.min(elapsed / 2400, 1)
      p = p < 0.85 ? p * 1.1 : 0.935 + (p - 0.85) * 0.65
      p = Math.min(p, 1)
      setProgress(p)
      if (p < 1) { raf.current = requestAnimationFrame(tick) }
      else { setTimeout(() => setPhase("typing"), 350) }
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  // ── Typewriter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "typing") return
    let i = 0
    const iv = setInterval(() => {
      i++; setTyped(TYPEWRITER_TEXT.slice(0, i))
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(iv)
        setTimeout(() => setSubVisible(true), 250)
        setTimeout(() => setBtnVisible(true), 700)
        setPhase("ready")
      }
    }, 60)
    return () => clearInterval(iv)
  }, [phase])

  const handleEnter = () => {
    setDiveIn(true)
    setTimeout(() => { setExiting(true); setTimeout(onEnter, 600) }, 400)
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

      {/* ── Vignette ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        boxShadow: diveIn ? T.diveVig : T.vignette,
        transition: "box-shadow 0.4s ease, filter 0.55s ease",
        zIndex: 10,
      }} />

      {/* ── Radial glow ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: T.radial,
        transition: "background 0.55s ease",
      }} />

      {/* ── Paper grain ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        opacity: dark ? 0.35 : 0.55,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
        transition: "opacity 0.55s ease",
      }} />

      {/* ── Dot grid (both modes, different colours) ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, ${T.dot} 1px, transparent 1px)`,
        backgroundSize: "36px 36px",
        maskImage: "radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 75%)",
        transition: "background-image 0.55s ease",
      }} />

      {/* ── Dark mode: floating amber star particles ── */}
      {dark && PARTICLES.map(p => (
        <StarParticle key={p.id} style={{
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          opacity: p.opacity,
          animationDelay: p.delay,
          animationDuration: p.dur,
        }} />
      ))}

      {/* ── Dark mode: distant candle glow orbs ── */}
      {dark && (
        <>
          <div style={{
            position: "absolute", width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,130,20,0.06) 0%, transparent 60%)",
            top: "15%", left: "12%", filter: "blur(40px)", pointerEvents: "none",
            animation: "glowPulse 4.5s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", width: 240, height: 240, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,100,10,0.05) 0%, transparent 60%)",
            bottom: "20%", right: "15%", filter: "blur(35px)", pointerEvents: "none",
            animation: "glowPulse 6s ease-in-out infinite 1.5s",
          }} />
        </>
      )}

      {/* ── Light mode: ambient glow orb ── */}
      {!dark && (
        <div style={{
          position: "absolute",
          width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, ${T.glowColor} 0%, transparent 65%)`,
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          filter: "blur(48px)", pointerEvents: "none",
        }} />
      )}

      {/* ── Light mode: corner flourishes ── */}
      {!dark && (["tl","tr","bl","br"]).map(pos => (
        <svg key={pos} style={{
          position: "absolute",
          top:    pos.includes("t") ? 24 : "auto",
          bottom: pos.includes("b") ? 24 : "auto",
          left:   pos.includes("l") ? 24 : "auto",
          right:  pos.includes("r") ? 24 : "auto",
          opacity: 0.18, pointerEvents: "none",
          transform: pos === "tr" ? "scaleX(-1)" : pos === "bl" ? "scaleY(-1)" : pos === "br" ? "scale(-1)" : "none",
        }} width="80" height="80" viewBox="0 0 80 80">
          <path d="M4 4 Q4 40 40 40 M4 4 L4 28 M4 4 L28 4"
            stroke="#8b6030" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ))}

      {/* ── Dark mode: subtle constellation lines ── */}
      {dark && (
        <svg style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none", opacity: 0.07,
        }}>
          <line x1="15%" y1="20%" x2="32%" y2="38%" stroke="#c9973a" strokeWidth="0.5"/>
          <line x1="32%" y1="38%" x2="55%" y2="25%" stroke="#c9973a" strokeWidth="0.5"/>
          <line x1="55%" y1="25%" x2="78%" y2="42%" stroke="#c9973a" strokeWidth="0.5"/>
          <line x1="22%" y1="72%" x2="45%" y2="65%" stroke="#c9973a" strokeWidth="0.5"/>
          <line x1="45%" y1="65%" x2="68%" y2="78%" stroke="#c9973a" strokeWidth="0.5"/>
        </svg>
      )}

      {/* ── Theme toggle — always visible, top-right ── */}
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setThemeHov(true)}
        onMouseLeave={() => setThemeHov(false)}
        title={`Switch to ${dark ? "light" : "dark"} mode`}
        style={{
          position: "absolute", top: 20, right: 20, zIndex: 20,
          background: dark
            ? (themeHov ? "#2a1f0e" : "#18110a")
            : (themeHov ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)"),
          border: `1.5px solid ${dark
            ? (themeHov ? "#c9973a" : "#3d2a15")
            : (themeHov ? "#c9973a" : "rgba(180,140,70,0.45)")}`,
          borderRadius: 12, padding: "7px 16px",
          fontFamily: "'Caveat', cursive", fontSize: 14, fontWeight: 600,
          color: dark
            ? (themeHov ? "#e8c87a" : "#8b6a3a")
            : (themeHov ? "#c9973a" : "#8b6030"),
          cursor: "pointer",
          transition: "all 0.22s ease",
          display: "flex", alignItems: "center", gap: 7,
          boxShadow: themeHov
            ? dark
              ? "0 0 16px rgba(201,151,58,0.22)"
              : "0 4px 18px rgba(180,120,40,0.18)"
            : "none",
          backdropFilter: dark ? "none" : (themeHov ? "blur(12px)" : "blur(8px)"),
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{dark ? "☀️" : "🌙"}</span>
        <span>{dark ? "Light mode" : "Dark mode"}</span>
      </button>

      {/* ── Content card ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
        maxWidth: 520, textAlign: "center", padding: "44px 40px",
        position: "relative", zIndex: 5,
        background: T.card,
        backdropFilter: T.blur,
        WebkitBackdropFilter: T.bFilter,
        border: `1.5px solid ${T.cardBdr}`,
        borderRadius: 24,
        boxShadow: T.cardShad,
        transition: "background 0.55s ease, border-color 0.55s ease, box-shadow 0.55s ease",
      }}>

        {/* ── Loading phase ── */}
        {phase === "loading" && (
          <>
            {/* Loading label — different in dark vs light */}
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 15,
              letterSpacing: "0.14em", color: T.accent, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 8,
              transition: "color 0.55s ease",
            }}>
              {dark ? (
                <span style={{ animation: "flameDance 1.8s ease-in-out infinite" }}>🕯</span>
              ) : (
                <span style={{ animation: "spin 3s linear infinite", display: "inline-block" }}>✦</span>
              )}
              <span>{dark ? "Lighting the candles..." : "Preparing the room..."}</span>
            </div>

            {/* Progress bar — glows in dark, warm in light */}
            <div style={{ width: 220, position: "relative" }}>
              <svg width="220" height="18" viewBox="0 0 220 18" style={{ display: "block", overflow: "visible" }}>
                {/* Track */}
                <path d="M4 9 Q6 6 10 9 Q110 12 210 9 Q214 6 216 9"
                  stroke={T.pbarTrack} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                {/* Fill */}
                <path d={`M4 9 Q6 6 ${4 + progress * 212} 9`}
                  stroke={T.accent} strokeWidth="3" fill="none" strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 ${dark ? "7px" : "4px"} rgba(201,151,58,${dark ? "0.9" : "0.6"}))` }}
                />
                {/* Dot at tip */}
                {progress > 0.02 && (
                  <circle cx={4 + progress * 212} cy={9} r={dark ? 5 : 4} fill="#e8b84a"
                    style={{ filter: `drop-shadow(0 0 ${dark ? "8px" : "5px"} rgba(232,184,74,${dark ? "1.0" : "0.85"}))` }} />
                )}
              </svg>

              {/* Dark mode: secondary glow bar */}
              {dark && (
                <div style={{
                  position: "absolute", top: 6, left: 4,
                  width: `${progress * 100}%`, height: 4,
                  background: "linear-gradient(90deg, transparent, rgba(201,151,58,0.2), transparent)",
                  borderRadius: 4, filter: "blur(4px)",
                  transition: "width 0.1s linear",
                  maxWidth: 212,
                }} />
              )}
            </div>

            {/* Percentage */}
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 14,
              color: T.badge, fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              transition: "color 0.55s ease",
            }}>
              {Math.round(progress * 100)}%
            </div>

            {/* Dark mode: hints below progress */}
            {dark && (
              <div style={{
                fontSize: 11, color: "#3d2a15",
                fontFamily: "'Caveat', cursive",
                letterSpacing: "0.1em",
                animation: "cozyBlink 2.5s step-end infinite",
              }}>
                hover · click · explore
              </div>
            )}
          </>
        )}

        {/* ── Typing / Ready phase ── */}
        {(phase === "typing" || phase === "ready") && (
          <>
            {/* Badge */}
            <div style={{
              fontFamily: "'Caveat', cursive", fontSize: 13,
              letterSpacing: "0.18em", color: T.badge,
              textTransform: "uppercase", fontWeight: 700,
              border: `1.5px solid ${T.badgeBdr}`, borderRadius: 20,
              padding: "3px 16px",
              background: dark ? "#0f0905" : "rgba(255,255,255,0.5)",
              transition: "all 0.55s ease",
            }}>✦ 3D Portfolio ✦</div>

            {/* Typewriter title */}
            <h1 style={{
              margin: 0, fontFamily: "'Caveat', cursive",
              fontSize: "clamp(30px, 6vw, 52px)", fontWeight: 700,
              color: T.title, lineHeight: 1.1, minHeight: "1.1em",
              letterSpacing: "-0.01em",
              textShadow: dark
                ? "0 0 40px rgba(200,140,40,0.35)"
                : "0 2px 20px rgba(180,120,40,0.18)",
              transition: "color 0.55s ease, text-shadow 0.55s ease",
            }}>
              {typed}
              <span style={{
                display: "inline-block", width: 3, height: "0.8em",
                background: "#c9973a", marginLeft: 4, verticalAlign: "text-top",
                animation: "cozyBlink 0.85s step-end infinite", borderRadius: 1,
              }} />
            </h1>

            {/* Wavy divider */}
            <svg width="200" height="10" viewBox="0 0 200 10" style={{
              overflow: "visible",
              opacity: subVisible ? 0.7 : 0, transition: "opacity 0.5s ease",
            }}>
              <path d="M0 5 Q25 1 50 5 Q75 9 100 5 Q125 1 150 5 Q175 9 200 5"
                stroke={T.divider} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>

            {/* Subtitle */}
            <p style={{
              margin: 0, fontSize: 14, lineHeight: 1.85,
              color: T.sub, fontStyle: "italic",
              opacity: subVisible ? 1 : 0,
              transform: subVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.5s ease, transform 0.5s ease, color 0.55s ease",
            }}>{SUB_TEXT}</p>

            {/* Control chips */}
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

            {/* Enter button */}
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

      {/* Footer */}
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
        @keyframes glowPulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%     { opacity: 1.0; transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
