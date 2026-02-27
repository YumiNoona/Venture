import { useEffect, useRef } from "react"

const WEATHER_CFG = {
  autumn: {
    count:     55,
    colors:    ["#c9602a", "#e07a2a", "#d4943a", "#c9973a", "#8b3a12", "#e8a830"],
    sizeMin:   3,   sizeMax:   8,
    speedMin:  0.6, speedMax:  1.6,
    wobble:    0.8,
    shape:     "leaf",
    wind:      0.35,
    opacity:   0.75,
  },
  winter: {
    count:     80,
    colors:    ["#e8f0ff", "#d0e4ff", "#c8d8f8", "#ffffff", "#dde8ff"],
    sizeMin:   2,   sizeMax:   5,
    speedMin:  0.4, speedMax:  1.1,
    wobble:    0.3,
    shape:     "snow",
    wind:      0.12,
    opacity:   0.80,
  },
  spring: {
    count:     60,
    colors:    ["#f9a8d4", "#fbc8dc", "#e879a0", "#fbcfe8", "#fde8f0", "#f8a4c8"],
    sizeMin:   3,   sizeMax:   7,
    speedMin:  0.5, speedMax:  1.4,
    wobble:    0.6,
    shape:     "petal",
    wind:      0.2,
    opacity:   0.72,
  },
}

function makeParticle(W, H, cfg, initial = false) {
  return {
    x:       Math.random() * W,
    y:       initial ? Math.random() * H : -20,
    vx:      (Math.random() - 0.5) * cfg.wind * 2,
    vy:      cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
    size:    cfg.sizeMin + Math.random() * (cfg.sizeMax - cfg.sizeMin),
    color:   cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
    phase:   Math.random() * Math.PI * 2,
    rot:     Math.random() * Math.PI * 2,
    rotSpd:  (Math.random() - 0.5) * 0.04,
    wobFreq: 0.4 + Math.random() * 0.4,
    wobAmp:  cfg.wobble * (0.5 + Math.random() * 0.8),
    opacity: 0.4 + Math.random() * 0.6,
  }
}

function drawSnow(ctx, r) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    const mx = Math.cos(a) * r * 0.5, my = Math.sin(a) * r * 0.5
    const perp = a + Math.PI / 2
    ctx.moveTo(mx + Math.cos(perp) * r * 0.22, my + Math.sin(perp) * r * 0.22)
    ctx.lineTo(mx - Math.cos(perp) * r * 0.22, my - Math.sin(perp) * r * 0.22)
  }
}

function drawLeaf(ctx, r) {
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.5, r, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, r)
  ctx.lineTo(0, r * 1.5)
  ctx.stroke()
}

function drawPetal(ctx, r) {
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.bezierCurveTo(r * 0.7, -r * 0.5, r * 0.7, r * 0.5, 0, r * 0.8)
  ctx.bezierCurveTo(-r * 0.7, r * 0.5, -r * 0.7, -r * 0.5, 0, -r)
  ctx.closePath()
  ctx.fill()
}

export default function WeatherSystem({ seasonKey, nightMode, debug = {} }) {
  const canvasRef  = useRef(null)
  const particles  = useRef([])
  const rafRef     = useRef(null)
  const timeRef    = useRef(0)

  // ── FIX: nightMode in a ref so it can be read per-frame without triggering re-init
  const nightModeRef = useRef(nightMode)
  useEffect(() => { nightModeRef.current = nightMode }, [nightMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const cfg   = WEATHER_CFG[seasonKey] ?? WEATHER_CFG.autumn
    const count = debug?.weatherCount || cfg.count
    const wind  = debug?.weatherWind  || cfg.wind

    // Seed initial particles spread across viewport
    particles.current = Array.from({ length: count }, () =>
      makeParticle(canvas.width, canvas.height, cfg, true),
    )

    let lastTime = performance.now()

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 2.5)
      lastTime = now
      timeRef.current += dt * 0.016

      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // ── FIX: read nightMode from ref — no stale closure
      const isNight     = nightModeRef.current
      const windStrength = wind * (isNight ? 1.4 : 1.0)
      const nightBonus   = isNight ? 1.2 : 1.0

      while (particles.current.length < count) {
        particles.current.push(makeParticle(W, H, cfg, false))
      }

      for (const p of particles.current) {
        const wobble = Math.sin(timeRef.current * p.wobFreq * 60 + p.phase) * p.wobAmp
        p.x  += (p.vx + wobble * 0.05 + windStrength * 0.4) * dt
        p.y  += p.vy * nightBonus * dt
        p.rot += p.rotSpd * dt

        if (p.y > H + 30) {
          p.x = Math.random() * W
          p.y = -20
          p.vx = (Math.random() - 0.5) * windStrength * 2
        }
        if (p.x > W + 50) p.x = -20
        if (p.x < -50) p.x = W + 20

        const fadeIn  = Math.min(p.y / 80, 1)
        const fadeOut = Math.max(0, 1 - Math.max(0, p.y - (H - 60)) / 60)
        const alpha   = p.opacity * fadeIn * fadeOut * cfg.opacity

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle   = p.color
        ctx.strokeStyle = p.color
        ctx.lineWidth   = 1
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)

        if (cfg.shape === "snow") {
          ctx.shadowBlur  = 4
          ctx.shadowColor = p.color
          ctx.beginPath()
          drawSnow(ctx, p.size)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.2, 0, Math.PI * 2)
          ctx.fill()
        } else if (cfg.shape === "leaf") {
          ctx.shadowBlur  = 2
          ctx.shadowColor = p.color
          drawLeaf(ctx, p.size)
        } else {
          ctx.shadowBlur  = 3
          ctx.shadowColor = p.color
          drawPetal(ctx, p.size)
        }

        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  // ── FIX: nightMode removed from deps — no more full teardown on toggle
  }, [seasonKey, debug?.weatherCount, debug?.weatherWind])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        opacity: debug?.weatherOpacity ?? 1,
      }}
    />
  )
}
