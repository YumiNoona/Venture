"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamic import of the Venture Engine to prevent SSR hydration crashes in Next.js
const Engine = dynamic(
  () => import("@venture/engine").then((m) => m.Engine),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        display: "grid", 
        placeItems: "center", 
        height: "100vh", 
        background: "#050505", 
        color: "#ffffff", 
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.05em",
        fontWeight: "bold"
      }}>
        LOADING VENTURE...
      </div>
    )
  }
)

export default function ViewerPage() {
  const [engineState, setEngineState] = useState({
    config: null,
    loading: true,
    error: null,
    plan: "free"
  })

  useEffect(() => {
    // Simulate fetching project config
    async function loadProject() {
      try {
        // Fallback mock config
        const mockRawConfig = { version: 1, objects: { "mesh_0": "rotate" } }
        
        setEngineState({
          config: mockRawConfig,
          loading: false,
          error: null,
          plan: "free"
        })
      } catch (err) {
        setEngineState(prev => ({ ...prev, loading: false, error: err.message }))
      }
    }

    loadProject()
  }, [])

  if (engineState.loading) {
    return null; // Handled by dynamic loading component
  }

  if (engineState.error) {
    return (
      <div style={{ 
        display: "grid", 
        placeItems: "center", 
        height: "100vh", 
        background: "#050505", 
        color: "#ff4444" 
      }}>
        Error: {engineState.error}
      </div>
    )
  }

  // Base path safety for modelUrl as requested
  const modelUrl = "/models/venture-placeholder.glb"

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#000" }}>
      <Engine 
        modelUrl={modelUrl}
        config={engineState.config}
        plan={engineState.plan}
      />
    </div>
  )
}
