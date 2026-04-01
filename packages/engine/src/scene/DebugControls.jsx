import { useControls, folder } from "leva"

export default function useDebugControls() {
  return useControls({

    "🌅 Lighting": folder({
      ambientIntensity:     { value: 0.5,   min: 0,     max: 3,    step: 0.05,  label: "Ambient (Day)" },
      directionalIntensity: { value: 2.0,   min: 0,     max: 8,    step: 0.1,   label: "Sun (Day)" },
      lightX:               { value: 6,     min: -20,   max: 20,   step: 0.5,   label: "Sun X" },
      lightY:               { value: 10,    min: -5,    max: 25,   step: 0.5,   label: "Sun Y" },
      lightZ:               { value: 6,     min: -20,   max: 20,   step: 0.5,   label: "Sun Z" },
      fillLight:            { value: 0.2,   min: 0,     max: 3,    step: 0.05,  label: "Fill Light (Day)" },
      nightTransitionSpeed: { value: 0.03,  min: 0.005, max: 0.15, step: 0.005, label: "Day/Night Speed" },
    }, { collapsed: true }),

    "🌙 Night Mode": folder({
      nightAmbient:        { value: 0.04,  min: 0.01, max: 0.3,  step: 0.005, label: "Night Ambient (min 0.04)" },
      nightFillLight:      { value: 0.02,  min: 0,    max: 0.3,  step: 0.005, label: "Night Fill" },
      nightEnvIntensity:   { value: 0.02,  min: 0,    max: 0.2,  step: 0.005, label: "Night Env Map" },
      nightBloomIntensity: { value: 0.8,   min: 0,    max: 3,    step: 0.05,  label: "Night Bloom (keep <1 to avoid overbloom)" },
      nightBloomThreshold: { value: 0.55,  min: 0.3,  max: 1,    step: 0.05,  label: "Night Bloom Cut" },
      nightVignette:       { value: 0.55,  min: 0,    max: 1.2,  step: 0.05,  label: "Night Vignette" },
    }, { collapsed: true }),

    "🕯 Candle Light": folder({
      candleLightIntensity: { value: 3.5,  min: 0,   max: 12,   step: 0.1,   label: "Intensity" },
      candleLightDistance:  { value: 8,    min: 1,   max: 25,   step: 0.5,   label: "Distance" },
      candleLightDecay:     { value: 2,    min: 0.5, max: 5,    step: 0.1,   label: "Decay" },
      candleFlicker:        { value: 0.4,  min: 0,   max: 1.5,  step: 0.05,  label: "Flicker Amount" },
    }, { collapsed: true }),

    "📷 Camera": folder({
      cameraLerp:    { value: 0.05, min: 0.005, max: 0.3,  step: 0.005, label: "Zoom Speed" },
      cameraOffsetX: { value: 1.5,  min: -6,    max: 6,    step: 0.1,   label: "Offset X" },
      cameraOffsetY: { value: 1.2,  min: -2,    max: 6,    step: 0.1,   label: "Offset Y" },
      cameraOffsetZ: { value: 1.5,  min: -6,    max: 6,    step: 0.1,   label: "Offset Z" },
      fov:           { value: 45,   min: 20,    max: 90,   step: 1,     label: "FOV" },
    }, { collapsed: true }),

    "✨ Outline": folder({
      outlineColor:         { value: "#ffffff",                                                      label: "Fallback Color" },
      outlineOpacity:       { value: 0.9,   min: 0,    max: 1,    step: 0.05,                        label: "Opacity" },
      outlineWidth:         { value: 1.0,   min: 0.5,  max: 2.5,  step: 0.05,                        label: "Scale" },
      outlineStyle:         { value: "pulse", options: ["pulse","wobble","breathe","solid","jitter"], label: "Style" },
      outlinePulseSpeed:    { value: 3,     min: 0.5,  max: 12,   step: 0.5,                         label: "Pulse Hz" },
      outlinePulseStrength: { value: 0.025, min: 0,    max: 0.12, step: 0.005,                       label: "Pulse Depth" },
    }, { collapsed: true }),

    "🌸 Post FX": folder({
      bloomIntensity:   { value: 0.3,  min: 0,   max: 4,   step: 0.05, label: "Bloom (Day)" },
      bloomThreshold:   { value: 0.8,  min: 0,   max: 1,   step: 0.05, label: "Bloom Cut (Day)" },
      vignetteStrength: { value: 0.28, min: 0,   max: 1.2, step: 0.05, label: "Vignette (Day)" },
    }, { collapsed: true }),

    "🌍 Globe": folder({
      globeSpeed: { value: 1.5, min: 0.1, max: 8,  step: 0.1, label: "Spin Speed" },
      globeAxis:  { value: "Y", options: ["Y","X","Z"],         label: "Spin Axis" },
    }, { collapsed: true }),

    "🍾 Bottle": folder({
      bottleWobbleFreq:  { value: 14,    min: 4,   max: 30,   step: 0.5,   label: "Wobble Frequency" },
      bottleWobbleDecay: { value: 0.94,  min: 0.8, max: 0.99, step: 0.005, label: "Wobble Decay" },
      bottleIdleSway:    { value: 0.012, min: 0,   max: 0.05, step: 0.002, label: "Idle Sway Amount" },
      bottleClickWobble: { value: 0.38,  min: 0.1, max: 0.8,  step: 0.02,  label: "Click Wobble Power" },
    }, { collapsed: true }),

    "🐦 Birds": folder({
      birdSpeed:     { value: 1.0, min: 0.1, max: 5,   step: 0.05, label: "Flight Speed" },
      birdRadius:    { value: 1.0, min: 0.3, max: 3,   step: 0.1,  label: "Flight Radius" },
      birdHeight:    { value: 0.3, min: 0,   max: 1.5, step: 0.05, label: "Flight Height" },
      birdFlapSpeed: { value: 8,   min: 1,   max: 20,  step: 0.5,  label: "Flap Speed" },
    }, { collapsed: true }),

    "🐦 Pigeon": folder({
      pigeonPeckSpeed: { value: 6,    min: 1,    max: 20,  step: 0.5,  label: "Peck Speed" },
      pigeonPeckAngle: { value: 0.12, min: 0.01, max: 0.4, step: 0.01, label: "Peck Angle" },
    }, { collapsed: true }),

    "🪞 Mirror": folder({
      glintDuration:  { value: 0.6, min: 0.1, max: 2,  step: 0.05, label: "Glint Duration" },
      glintIntensity: { value: 1.0, min: 0.1, max: 3,  step: 0.1,  label: "Glint Strength" },
    }, { collapsed: true }),

    // ── NEW SECTIONS ──────────────────────────────────────────────────────────

    "✦ Cursor Sparkle": folder({
      sparkDensity:  { value: 2,    min: 1,   max: 8,   step: 1,    label: "Particles/Burst" },
      sparkSize:     { value: 1.0,  min: 0.2, max: 3.0, step: 0.1,  label: "Size Scale" },
      sparkSpeed:    { value: 1.0,  min: 0.2, max: 3.0, step: 0.1,  label: "Launch Speed" },
      sparkLifetime: { value: 1.0,  min: 0.2, max: 3.0, step: 0.1,  label: "Lifetime (×)" },
      sparkGravity:  { value: 1.0,  min: 0.0, max: 3.0, step: 0.1,  label: "Gravity (×)" },
      sparkEmitRate: { value: 20,   min: 5,   max: 80,  step: 5,    label: "Emit Interval (ms)" },
      sparkMinMove:  { value: 2,    min: 0.5, max: 10,  step: 0.5,  label: "Min Move (px)" },
      sparkGlow:     { value: true,                                   label: "Glow FX" },
    }, { collapsed: true }),

    "💨 Dust Motes": folder({
      dustCount:        { value: 160,   min: 20,   max: 400, step: 10,    label: "Count" },
      dustSize:         { value: 0.025, min: 0.005,max: 0.08,step: 0.005, label: "Point Size" },
      dustSpeed:        { value: 1.0,   min: 0.1,  max: 4.0, step: 0.1,   label: "Drift Speed (×)" },
      dustDayOpacity:   { value: 0.40,  min: 0,    max: 1.0, step: 0.05,  label: "Day Opacity" },
      dustNightOpacity: { value: 0.68,  min: 0,    max: 1.0, step: 0.05,  label: "Night Opacity" },
    }, { collapsed: true }),

    "⛅ Weather": folder({
      weatherCount:   { value: 0,    min: 0,    max: 200, step: 5,    label: "Particle Count (0=auto)" },
      weatherWind:    { value: 0,    min: 0,    max: 2.0, step: 0.05, label: "Wind Override (0=auto)" },
      weatherOpacity: { value: 1.0,  min: 0,    max: 1.0, step: 0.05, label: "Overall Opacity" },
    }, { collapsed: true }),

    "🎵 Audio": folder({
      audioMasterVol:  { value: 0.65, min: 0,    max: 1.0,  step: 0.05,  label: "Master Volume" },
      audioPadVol:     { value: 1.0,  min: 0,    max: 2.0,  step: 0.05,  label: "Pad Volume (×)" },
      audioMelodyVol:  { value: 1.0,  min: 0,    max: 2.0,  step: 0.05,  label: "Melody Volume (×)" },
      audioHissVol:    { value: 0.003,min: 0,    max: 0.015,step: 0.001,  label: "Vinyl Texture Level" },
      audioReverbWet:  { value: 0.16, min: 0,    max: 0.5,  step: 0.02,  label: "Reverb Wet Mix" },
      audioCrossfadeS: { value: 4.0,  min: 1.0,  max: 12.0, step: 0.5,   label: "Crossfade (sec)" },
      audioLowpassHz:  { value: 900,  min: 300,  max: 2000, step: 50,    label: "Pad Lowpass (Hz)" },
    }, { collapsed: true }),

    "🍂 Season FX": folder({
      seasonFogDensity: { value: 0,     min: 0,    max: 0.12, step: 0.002, label: "Fog Density Override (0=auto)" },
      seasonFogR:       { value: 0,     min: 0,    max: 0.3,  step: 0.005, label: "Fog R Override" },
      seasonFogG:       { value: 0,     min: 0,    max: 0.3,  step: 0.005, label: "Fog G Override" },
      seasonFogB:       { value: 0,     min: 0,    max: 0.3,  step: 0.005, label: "Fog B Override" },
      seasonAmbR:       { value: 0,     min: 0,    max: 1.5,  step: 0.05,  label: "Ambient Tint R (0=auto)" },
      seasonAmbG:       { value: 0,     min: 0,    max: 1.5,  step: 0.05,  label: "Ambient Tint G (0=auto)" },
      seasonAmbB:       { value: 0,     min: 0,    max: 1.5,  step: 0.05,  label: "Ambient Tint B (0=auto)" },
    }, { collapsed: true }),

  })
}
