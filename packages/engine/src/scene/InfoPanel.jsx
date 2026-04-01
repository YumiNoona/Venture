import { useEffect, useState } from "react"
import { OBJECT_META } from "../constants/objectMeta"

const ICONS = {
  rotate:"🌐", wobble:"🍾", shrink:"🗺️", press:"🎹",
  float:"🐦", darkmode:"🕯️", tilt:"🎩", glint:"🪞", peck:"🐦",
}

function CloseButton({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Close (Esc)"
      style={{
        position:"absolute", top:14, right:14,
        width:36, height:36,
        background: hov ? "#3d2a15" : "#2a1f0e",
        border:`1.5px solid ${hov ? "#c9973a" : "#4a3520"}`,
        borderRadius:"50%",
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", transition:"all 0.18s ease", zIndex:25,
        boxShadow: hov ? "0 0 12px rgba(201,151,58,0.3)" : "none",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2 L12 12 M12 2 L2 12"
          stroke={hov ? "#e8c87a" : "#8b6a3a"}
          strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function CloseTab({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"absolute", left:-52, top:"50%",
        transform:"translateY(-50%)",
        width:52, height:72,
        background: hov ? "#2a1f14" : "#1a1208",
        border:"2px solid #6b4c2a", borderRight:"none",
        borderRadius:"14px 0 0 14px",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        gap:4, cursor:"pointer",
        transition:"background 0.2s",
        userSelect:"none",
        boxShadow:"-4px 0 16px rgba(0,0,0,0.6)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 3 L15 15 M15 3 L3 15"
          stroke={hov ? "#e8c87a" : "#8b6a3a"}
          strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span style={{
        fontSize:8, letterSpacing:"0.08em",
        color: hov ? "#e8c87a" : "#6b4c2a",
        fontFamily:"'Caveat', cursive", fontWeight:600,
        writingMode:"vertical-rl", transform:"rotate(180deg)", marginTop:2,
      }}>close</span>
    </div>
  )
}

export default function InfoPanel({ selected, onClose }) {
  const metaKey = selected
    ? Object.keys(OBJECT_META).find(k => selected.name === k || selected.name?.startsWith(k))
    : null
  const meta   = metaKey ? OBJECT_META[metaKey] : null
  const isOpen = !!meta
  const [visible, setVisible] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (isOpen) { setVisible(true); setAnimKey(k => k+1) }
    else { const t = setTimeout(() => setVisible(false), 480); return () => clearTimeout(t) }
  }, [isOpen, metaKey])

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isOpen) onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!visible && !isOpen) return null
  const accent = metaKey ? (OBJECT_META[metaKey]?.outlineColor ?? "#e8c87a") : "#e8c87a"

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />

      {/* ── Backdrop — NO blur, just subtle dark tint ── */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position:"fixed", inset:0, zIndex:10,
            // IMPORTANT: no backdropFilter here — that's what was blurring the canvas
            background:"rgba(0,0,0,0.18)",
            transition:"opacity 0.4s ease",
          }}
        />
      )}

      {/* ── Panel ── */}
      <div style={{
        position:"fixed", right:0, top:0,
        width:340, height:"100vh",
        background:"linear-gradient(160deg, #120d07 0%, #0e0a05 60%, #0a0805 100%)",
        borderLeft:"2px solid #3d2a15",
        color:"#d4b896",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition:"transform 0.44s cubic-bezier(0.4,0,0.2,1)",
        zIndex:20,
        display:"flex", flexDirection:"column",
        fontFamily:"'Lora', Georgia, serif",
        overflow:"hidden",
        boxShadow:"-8px 0 40px rgba(0,0,0,0.7)",
      }}>

        {/* Accent line */}
        <div style={{
          height:3, flexShrink:0,
          background:`linear-gradient(90deg, transparent 0%, ${accent}88 30%, ${accent} 50%, ${accent}88 70%, transparent 100%)`,
          opacity: isOpen ? 1 : 0, transition:"opacity 0.3s 0.2s",
        }} />

        {/* Grain overlay */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity:0.6,
        }} />

        <CloseTab onClick={onClose} />
        <CloseButton onClick={onClose} />

        {meta && (
          <div key={animKey} style={{
            display:"flex", flexDirection:"column",
            padding:"58px 22px 24px",
            height:"100%", boxSizing:"border-box",
            overflowY:"auto", gap:16,
            animation:"cozySlidIn 0.44s cubic-bezier(0.4,0,0.2,1) forwards",
            position:"relative", zIndex:1,
            scrollbarWidth:"thin", scrollbarColor:"#3d2a15 transparent",
          }}>

            {/* Icon + badge */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:4 }}>
              <div style={{
                fontSize:28, lineHeight:1,
                background:"#1a1208", border:`2px solid ${accent}44`,
                borderRadius:12, padding:"8px 12px", flexShrink:0,
                boxShadow:`0 0 12px ${accent}22`,
              }}>
                {ICONS[meta.interaction] ?? "✦"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <span style={{
                  fontSize:11, letterSpacing:"0.18em", color:accent,
                  textTransform:"uppercase", fontWeight:700,
                  fontFamily:"'Caveat', cursive",
                }}>✦ Interactive Object</span>
                <span style={{
                  fontSize:12, color:"#8b6a3a",
                  background:"#1a1208", border:"1.5px solid #3d2a15",
                  borderRadius:20, padding:"2px 10px",
                  fontFamily:"'Caveat', cursive",
                }}>{meta.hint}</span>
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              margin:0, fontSize:36, fontWeight:700,
              letterSpacing:"-0.01em", lineHeight:1.05,
              fontFamily:"'Caveat', cursive", color:"#e8d5b0",
              textShadow:`0 0 40px ${accent}44`,
            }}>{meta.label}</h2>

            {/* Wavy divider */}
            <svg width="100%" height="8" viewBox="0 0 300 8" style={{ overflow:"visible", flexShrink:0 }}>
              <path d="M0 4 Q25 1 50 4 Q75 7 100 4 Q125 1 150 4 Q175 7 200 4 Q225 1 250 4 Q275 7 300 4"
                stroke={`${accent}55`} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>

            {/* Description */}
            <p style={{ margin:0, fontSize:13, lineHeight:1.85, color:"#9a7d5a", fontStyle:"italic" }}>
              {meta.description}
            </p>

            {/* Tags */}
            {meta.tags && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {meta.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize:12, color:"#6b4c2a",
                    background:"#1a1208", border:"1.5px solid #2e1f0e",
                    borderRadius:8, padding:"3px 10px",
                    fontFamily:"'Caveat', cursive",
                  }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Fun Fact */}
            {meta.funFact && (
              <div style={{
                background:"#0f0905", border:`1.5px solid ${accent}33`,
                borderRadius:12, padding:"12px 14px",
              }}>
                <div style={{
                  fontSize:11, color:accent, letterSpacing:"0.12em",
                  textTransform:"uppercase", marginBottom:6, fontWeight:700,
                  fontFamily:"'Caveat', cursive",
                }}>📜 Fun Fact</div>
                <p style={{ margin:0, fontSize:12, color:"#7a5c38", lineHeight:1.7, fontStyle:"italic" }}>
                  {meta.funFact}
                </p>
              </div>
            )}

            {/* Hint reminder */}
            <div style={{
              background:"#0f0905", border:"1.5px solid #2e1f0e",
              borderRadius:12, padding:"10px 14px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{ fontSize:16 }}>💡</span>
              <span style={{
                fontSize:12, color:"#6b4c2a", lineHeight:1.55,
                fontFamily:"'Caveat', cursive", fontWeight:600,
              }}>{meta.hint} — give it a try!</span>
            </div>

            <div style={{ flex:1 }} />

            {/* Inspiration link */}
            <a href={meta.link} target="_blank" rel="noopener noreferrer" style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"12px 16px", background:"#0f0905",
              border:"1.5px solid #2e1f0e", borderRadius:12,
              color:"#6b4c2a", textDecoration:"none", fontSize:13,
              fontFamily:"'Caveat', cursive", fontWeight:600, transition:"all 0.2s",
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor="#6b4c2a"; e.currentTarget.style.color="#e8c87a" }}
              onMouseOut={e  => { e.currentTarget.style.borderColor="#2e1f0e"; e.currentTarget.style.color="#6b4c2a" }}
            >
              <span>✦ View Inspiration</span>
              <span style={{ opacity:0.5, fontSize:18 }}>↗</span>
            </a>

          </div>
        )}
      </div>

      <style>{`
        @keyframes cozySlidIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #3d2a15; border-radius: 2px; }
      `}</style>
    </>
  )
}
