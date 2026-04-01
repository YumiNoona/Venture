import { InteractionRegistry } from "./registry"

// Executes actions based on config with safety guards
export function executeInteraction(interactionType, config, context) {
  if (!interactionType) return
  
  const registryEntry = InteractionRegistry[interactionType]
  if (!registryEntry) {
    console.warn(`[InteractionSystem] Unknown interaction type: ${interactionType}`)
    return
  }
  
  // Merge default config with provided config
  const mergedConfig = { ...registryEntry.defaultConfig, ...config }

  try {
    switch (interactionType) {
      case "panel":
        context.triggerPanel(mergedConfig)
        break
      case "animation":
        // Fallback guard
        if (!mergedConfig.animationName) {
          console.warn("[InteractionSystem] Missing animationName for animation interaction")
          return
        }
        context.playAnimation(mergedConfig.meshId, mergedConfig)
        break
      case "link":
        if (mergedConfig.url) {
          if (mergedConfig.newTab) {
            window.open(mergedConfig.url, "_blank", "noopener,noreferrer")
          } else {
            window.location.href = mergedConfig.url
          }
        }
        break
      // highlight and navigate logic might be handled in a useFrame loop or CameraRig
      default:
        console.log(`[InteractionSystem] Executed ${interactionType} (handled externally)`)
    }
  } catch (error) {
    console.error(`[InteractionSystem] Error executing interaction ${interactionType}:`, error)
  }
}
