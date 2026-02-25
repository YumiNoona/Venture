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
      nightAmbient:         { value: 0.015, min: 0,    max: 0.2,  step: 0.005, label: "Night Ambient" },
      nightFillLight:       { value: 0.02,  min: 0,    max: 0.3,  step: 0.005, label: "Night Fill" },
      nightEnvIntensity:    { value: 0.04,  min: 0,    max: 0.3,  step: 0.01,  label: "Night Env Map" },
      nightBloomIntensity:  { value: 1.2,   min: 0,    max: 5,    step: 0.1,   label: "Night Bloom" },
      nightBloomThreshold:  { value: 0.3,   min: 0,    max: 1,    step: 0.05,  label: "Night Bloom Cut" },
      nightVignette:        { value: 0.7,   min: 0,    max: 1.2,  step: 0.05,  label: "Night Vignette" },
    }, { collapsed: true }),

    "🕯 Candle Light": folder({
      candleLightIntensity: { value: 3.5,   min: 0,    max: 15,   step: 0.1,   label: "Intensity" },
      candleLightDistance:  { value: 8,     min: 1,    max: 25,   step: 0.5,   label: "Distance" },
      candleLightDecay:     { value: 2,     min: 0.5,  max: 5,    step: 0.1,   label: "Decay" },
      candleFlicker:        { value: 0.4,   min: 0,    max: 1.5,  step: 0.05,  label: "Flicker Amount" },
    }, { collapsed: true }),

    "📷 Camera": folder({
      cameraLerp:    { value: 0.05, min: 0.005, max: 0.3,  step: 0.005, label: "Zoom Speed" },
      cameraOffsetX: { value: 1.5,  min: -6,    max: 6,    step: 0.1,   label: "Offset X" },
      cameraOffsetY: { value: 1.2,  min: -2,    max: 6,    step: 0.1,   label: "Offset Y" },
      cameraOffsetZ: { value: 1.5,  min: -6,    max: 6,    step: 0.1,   label: "Offset Z" },
      fov:           { value: 45,   min: 20,    max: 90,   step: 1,     label: "FOV" },
    }, { collapsed: true }),

    "✨ Outline": folder({
      outlineColor:         { value: "#ffffff",                                                       label: "Global Fallback Color" },
      outlineOpacity:       { value: 0.9,    min: 0,    max: 1,    step: 0.05,                        label: "Opacity" },
      outlineWidth:         { value: 1.0,    min: 0.5,  max: 2.5,  step: 0.05,                        label: "Scale" },
      outlineStyle:         { value: "pulse", options: ["pulse","wobble","breathe","solid","jitter"],  label: "Style" },
      outlinePulseSpeed:    { value: 3,      min: 0.5,  max: 12,   step: 0.5,                         label: "Pulse Hz" },
      outlinePulseStrength: { value: 0.025,  min: 0,    max: 0.12, step: 0.005,                       label: "Pulse Depth" },
    }, { collapsed: true }),

    "🌸 Post FX": folder({
      bloomIntensity:   { value: 0.3,  min: 0,    max: 4,    step: 0.05, label: "Bloom (Day)" },
      bloomThreshold:   { value: 0.8,  min: 0,    max: 1,    step: 0.05, label: "Bloom Cut (Day)" },
      vignetteStrength: { value: 0.35, min: 0,    max: 1.2,  step: 0.05, label: "Vignette (Day)" },
    }, { collapsed: true }),

    "🌍 Globe": folder({
      globeSpeed: { value: 1.5, min: 0.1, max: 8,   step: 0.1,  label: "Spin Speed" },
      globeAxis:  { value: "Y", options: ["Y","X","Z"],           label: "Spin Axis" },
    }, { collapsed: true }),

    "🍾 Bottle": folder({
      bottleWobbleFreq:   { value: 14,   min: 4,   max: 30,  step: 0.5,  label: "Wobble Frequency" },
      bottleWobbleDecay:  { value: 0.94, min: 0.8, max: 0.99,step: 0.005,label: "Wobble Decay" },
      bottleIdleSway:     { value: 0.012,min: 0,   max: 0.05,step: 0.002,label: "Idle Sway Amount" },
      bottleClickWobble:  { value: 0.38, min: 0.1, max: 0.8, step: 0.02, label: "Click Wobble Power" },
    }, { collapsed: true }),

    "🐦 Birds": folder({
      birdSpeed:     { value: 1.0, min: 0.1, max: 5,   step: 0.05, label: "Flight Speed" },
      birdRadius:    { value: 1.0, min: 0.3, max: 3,   step: 0.1,  label: "Flight Radius" },
      birdHeight:    { value: 0.3, min: 0,   max: 1.5, step: 0.05, label: "Flight Height" },
      birdFlapSpeed: { value: 8,   min: 1,   max: 20,  step: 0.5,  label: "Flap Speed" },
    }, { collapsed: true }),

    "🐦 Pigeon": folder({
      pigeonPeckSpeed: { value: 6,    min: 1,    max: 20,  step: 0.5,   label: "Peck Speed" },
      pigeonPeckAngle: { value: 0.12, min: 0.01, max: 0.4, step: 0.01,  label: "Peck Angle" },
    }, { collapsed: true }),

    "🪞 Mirror": folder({
      glintDuration:  { value: 0.6, min: 0.1, max: 2,  step: 0.05, label: "Glint Duration" },
      glintIntensity: { value: 1.0, min: 0.1, max: 3,  step: 0.1,  label: "Glint Strength" },
    }, { collapsed: true }),

  })
}
