import { createContext, useContext, useState, useCallback } from "react"

// Context to decouple engine state from behaviors
const InteractionContext = createContext(null)

export function InteractionProvider({ children }) {
  const [activePanel, setActivePanel] = useState(null)
  const [activeAnimations, setActiveAnimations] = useState({})
  
  const triggerPanel = useCallback((panelConfig) => {
    setActivePanel(panelConfig)
  }, [])

  const closePanel = useCallback(() => {
    setActivePanel(null)
  }, [])

  const playAnimation = useCallback((meshId, animConfig) => {
    setActiveAnimations(prev => ({ ...prev, [meshId]: animConfig }))
  }, [])

  const value = {
    activePanel,
    triggerPanel,
    closePanel,
    activeAnimations,
    playAnimation
  }

  return (
    <InteractionContext.Provider value={value}>
      {children}
    </InteractionContext.Provider>
  )
}

export function useInteraction() {
  const context = useContext(InteractionContext)
  if (!context) {
    throw new Error("useInteraction must be used within an InteractionProvider")
  }
  return context
}
