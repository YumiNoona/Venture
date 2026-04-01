import { useState, useCallback } from "react"
import { Scene } from "@venture/engine"

// Simulated State Serializer for JSON config handling
function useProjectState() {
  const [config, setConfig] = useState({ objects: {} })
  const [meshIds, setMeshIds] = useState([])

  const updateObjectInteraction = (stableId, interactionType) => {
    setConfig(prev => ({
      ...prev,
      objects: {
        ...prev.objects,
        [stableId]: { interaction: interactionType }
      }
    }))
  }

  return { config, setConfig, meshIds, setMeshIds, updateObjectInteraction }
}

export default function App() {
  const { config, meshIds, setMeshIds, updateObjectInteraction } = useProjectState()
  const [activeTab, setActiveTab] = useState("editor")
  const [plan, setPlan] = useState("free")

  const handleSceneLoaded = useCallback((ids) => {
    setMeshIds(ids)
  }, [setMeshIds])

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0d0905', color: '#e8d5b0', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar: Project Editor UI */}
      <div style={{ width: 320, borderRight: '1px solid #332b21', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #332b21' }}>
          <h2>Venture Dashboard</h2>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.7 }}>Plan</label>
            <select 
              value={plan} 
              onChange={e => setPlan(e.target.value)}
              style={{ width: '100%', marginTop: 5, background: '#1a1611', color: '#fff', border: '1px solid #332b21' }}
            >
              <option value="free">Free (Watermarked)</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          <h3>Interactive Objects</h3>
          {meshIds.length === 0 && <p style={{ fontSize: 13, opacity: 0.5 }}>Loading engine...</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
            {meshIds.map(({ id, label }) => {
              const currentInteraction = config.objects[id]?.interaction || ""
              return (
                <div key={id} style={{ padding: 10, background: '#1a1611', borderRadius: 6, border: '1px solid #332b21' }}>
                  <div style={{ fontSize: 12, marginBottom: 5 }}>{label || id}</div>
                  <select
                    value={currentInteraction}
                    onChange={(e) => updateObjectInteraction(id, e.target.value)}
                    style={{ width: '100%', padding: '4px', background: '#0d0905', color: '#e8d5b0', border: '1px solid #332b21' }}
                  >
                    <option value="">None</option>
                    <option value="press">Piano Note</option>
                    <option value="tilt">Magic Hat</option>
                    <option value="rotate">Spin</option>
                    <option value="wobble">Wobble</option>
                    <option value="glint">Glint Outline</option>
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Inline Preview */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Render Engine Inline */}
        <Scene 
          modelUrl="/models/venture-placeholder.glb"
          config={config} 
          onLoaded={handleSceneLoaded} 
          plan={plan}
          nightMode={false}
          sparkleEnabled={true}
        />
      </div>

    </div>
  )
}
