export const metadata = {
  title: "Venture Viewer",
  description: "3D Project Viewer Powered by Venture",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
