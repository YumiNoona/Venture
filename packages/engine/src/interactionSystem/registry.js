// Maps behavior string to logic and default config values
export const InteractionRegistry = {
  panel: {
    description: "Opens an info panel",
    defaultConfig: { title: "New Panel", content: "Panel content here" }
  },
  animation: {
    description: "Triggers a skeletal animation",
    defaultConfig: { animationName: "", loop: false }
  },
  highlight: {
    description: "Highlights the mesh with a specific color",
    defaultConfig: { color: "#ffffff", intensity: 1.0 }
  },
  navigate: {
    description: "Navigates the camera to focus on the object",
    defaultConfig: { zoomLevel: 1.5, duration: 1.0 }
  },
  link: {
    description: "Opens an external link",
    defaultConfig: { url: "", newTab: true }
  }
}
