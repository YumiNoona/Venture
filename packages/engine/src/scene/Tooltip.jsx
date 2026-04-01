import { OBJECT_META } from "../constants/objectMeta"

export default function Tooltip({ hovered, position }) {
  const metaKey = hovered?.name
    ? Object.keys(OBJECT_META).find((k) => hovered.name === k || hovered.name?.startsWith(k))
    : null
  const meta = metaKey ? OBJECT_META[metaKey] : null
  if (!meta || !position) return null

  const accent = OBJECT_META[metaKey]?.outlineColor ?? "#c9973a"

  return (
    <div style={{
      position: "fixed",
      left: position.x + 16, top: position.y - 18,
      background: "#0f0905",
      border: `1.5px solid ${accent}55`,
      borderRadius: 10, padding: "6px 14px",
      color: "#d4b896",
      fontFamily: "'Caveat', cursive",
      fontSize: 14, fontWeight: 600,
      pointerEvents: "none", zIndex: 30,
      whiteSpace: "nowrap",
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: `0 4px 20px rgba(0,0,0,0.55), 0 0 12px ${accent}22`,
      animation: "tipIn 0.1s ease",
    }}>
      <span style={{ color: accent, fontSize: 8 }}>✦</span>
      <span>{meta.label}</span>
      <span style={{ color: "#3d2a15", fontSize: 10 }}>·</span>
      <span style={{ color: "#5a3f25", fontSize: 12, fontWeight: 400 }}>{meta.hint}</span>
      <style>{`@keyframes tipIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  )
}
