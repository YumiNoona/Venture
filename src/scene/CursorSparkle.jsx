import { useEffect, useRef } from "react"

function makeParticle(x, y, cfg) {
  const angle  = Math.random() * Math.PI * 2
  const speed  = (0.4 + Math.random() * 1.0) * (cfg.speed ?? 1)
  const size   = (1.8 + Math.random() * 2.6)  * (cfg.sizeScale ?? 1)
  const palette = [
    "#c9973a", "#e8c87a", "#fde68a",
    "#f59e0b", "#fbbf24", "#fff7c0", "#d97706",
  ]
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.7,
    life:  1.0,
    decay: (0.026 + Math.random() * 0.020) / Math.max(0.1, cfg.lifetime ?? 1),
    size,
    color:    palette[Math.floor(Math.random() * palette.length)],
    shape:    Math.floor(Math.random() * 3),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.10,
    gravity:  (0.045 + Math.random() * 0.035) * (cfg.gravity ?? 1),
  }
}

function drawStar(ctx, r) {
  const outer = r, inner = r * 0.38
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a  = (i / 8) * Math.PI * 2 - Math.PI / 2
    const d  = i % 2 === 0 ? outer : inner
    if (i === 0) ctx.moveTo(Math.cos(a)*d, Math.sin(a)*d)
    else         ctx.lineTo(Math.cos(a)*d, Math.sin(a)*d)
  }
  ctx.closePath()
}

export default function CursorSparkle({ enabled = true, debug = {} }) {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const mouse     = useRef({ x: -999, y: -999 })
  const prev      = useRef({ x: -999, y: -999 })
  const rafRef    = useRef(null)
  const lastEmit  = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener("resize", resize)
    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener("mousemove", onMove)

    let lastTime = performance.now()

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 2.5)
      lastTime = now

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Emit along movement vector (interpolated) ─────────────────────────
      const cfg = {
        density:   debug?.sparkDensity   ?? 2,
        speed:     debug?.sparkSpeed     ?? 1.0,
        sizeScale: debug?.sparkSize      ?? 1.0,
        lifetime:  debug?.sparkLifetime  ?? 1.0,
        gravity:   debug?.sparkGravity   ?? 1.0,
        glow:      debug?.sparkGlow      !== false,
        emitRate:  debug?.sparkEmitRate  ?? 20,
        minMove:   debug?.sparkMinMove   ?? 2,
      }

      const { x: mx, y: my } = mouse.current
      const { x: px, y: py } = prev.current
      const dx = mx - px, dy = my - py
      const dist = Math.sqrt(dx*dx + dy*dy)

      if (dist > cfg.minMove && now - lastEmit.current > cfg.emitRate) {
        const steps = Math.min(Math.ceil(dist / 10), 5)
        for (let s = 0; s < steps; s++) {
          const t = s / Math.max(steps - 1, 1)
          const ex = px + dx * t, ey = py + dy * t
          for (let i = 0; i < cfg.density; i++) {
            particles.current.push(makeParticle(ex, ey, cfg))
          }
        }
        lastEmit.current = now
      }
      prev.current = { x: mx, y: my }

      // ── Update + draw ─────────────────────────────────────────────────────
      particles.current = particles.current.filter(p => p.life > 0.01)

      for (const p of particles.current) {
        p.life     -= p.decay * dt
        p.x        += p.vx * dt
        p.y        += p.vy * dt
        p.vy       += p.gravity * dt
        p.vx       *= 0.978
        p.rotation += p.rotSpeed * dt
        if (p.life <= 0) continue

        const alpha = p.life * p.life   // quadratic — snappy tail
        const r     = p.size * (0.2 + p.life * 0.8)

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle   = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (debug?.sparkGlow !== false) {
          ctx.shadowBlur  = r * 2.8
          ctx.shadowColor = p.color
        }

        if (p.shape === 1) {
          drawStar(ctx, r); ctx.fill()
        } else if (p.shape === 2) {
          ctx.beginPath()
          ctx.moveTo(0, -r); ctx.lineTo(r*0.5, 0)
          ctx.lineTo(0,  r); ctx.lineTo(-r*0.5, 0)
          ctx.closePath(); ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill()
        }

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("resize", resize)
    }
  }, [enabled]) // re-runs on enable change; cfg is read each frame via closure

  if (!enabled) return null
  return (
    <canvas ref={canvasRef}
      style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999 }} />
  )
}
