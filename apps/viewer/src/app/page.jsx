"use client"

import { useEffect, useState } from "react"
import { Scene } from "@venture/engine"
import { migrateConfig } from "@venture/utils"

export default function ViewerPage() {
  const [engineState, setEngineState] = useState({
    config: null,
    loading: true,
    error: null,
    plan: "free"
  })

  useEffect(() => {
    // In a real application, fetch the config and plan from Supabase based on project slug.
    // Here we simulate fetching & migrating a project config.
    async function loadProject() {
      try {
        const mockRawConfig = { version: 1, objects: { "mesh_0": "rotate" } }
        const migrated = migrateConfig(mockRawConfig)
        
        setEngineState({
          config: migrated,
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
    return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "#0d0905", color: "#e8d5b0", fontFamily: "sans-serif" }}>Loading Venture...</div>
  }

  if (engineState.error) {
    return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "#0d0905", color: "#e8d5b0", fontFamily: "sans-serif" }}>Error: {engineState.error}</div>
  }

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scene 
        modelUrl="/models/venture-placeholder.glb"
        config={engineState.config}
        plan={engineState.plan}
      />
    </div>
  )
}
