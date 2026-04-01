import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("3D Scene Error Catch:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: "fixed", inset: 0,
          background: "#1a1a1e", color: "#e0d7c6",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          zIndex: 1000, padding: 20, textAlign: "center"
        }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>📖 Something went wrong</h1>
          <p style={{ opacity: 0.8, maxWidth: 400, lineHeight: 1.6 }}>
            The professor's study seems to have encountered a temporal glitch. 
            Please check your internet connection or try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: "2rem", padding: "10px 24px",
              background: "transparent", border: "1.5px solid #c4b69c",
              color: "#c4b69c", cursor: "pointer", borderRadius: 4,
              fontSize: "0.9rem", transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(196, 182, 156, 0.1)" }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            Attempt Re-entry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
