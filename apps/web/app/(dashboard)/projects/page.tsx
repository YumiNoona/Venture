"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, Play, Code, Settings as SettingsIcon } from "lucide-react"

// Dynamic import of the Venture Engine to prevent SSR hydration crashes
const Engine = dynamic(
  () => import("@venture/engine").then((m) => m.Engine),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-muted/20 animate-pulse rounded-lg border border-border/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Initializing engine...</p>
        </div>
      </div>
    )
  }
)

export default function ProjectsPage() {
  const [activeTab, setActiveTab ] = useState("editor")
  const [editorState, setEditorState] = useState({
    name: "My New Project",
    slug: "my-new-project",
    modelUrl: "/models/venture-placeholder.glb",
    config: {
      intensity: 1.5,
      environment: "city",
      interactions: true
    }
  })
  
  const [savedConfig, setSavedConfig] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Slug generation logic with collision handling placeholder
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    
    setEditorState(prev => ({ ...prev, name, slug }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate DB save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSavedConfig({ ...editorState })
    setIsSaving(false)
  }

  if (!editorState.modelUrl || !editorState.config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading project assets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Editor</h1>
          <p className="text-muted-foreground">Customize your 3D experience and interaction logic.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-4 w-4" /> Preview
          </Button>
          <Button size="sm" className="gap-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Side: Interaction & Object Editor */}
        <div className="lg:col-span-5 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <Card className="p-6 space-y-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input 
                  id="name" 
                  value={editorState.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter project name..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Public URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">venture.app/</span>
                  <Input 
                    id="slug" 
                    value={editorState.slug} 
                    readOnly 
                    className="font-mono text-xs bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="appearance" className="gap-2">
                   <SettingsIcon className="h-3.5 w-3.5" /> Style
                </TabsTrigger>
                <TabsTrigger value="interactions" className="gap-2">
                  <Code className="h-3.5 w-3.5" /> Logic
                </TabsTrigger>
                <TabsTrigger value="assets" className="gap-2">
                  <SettingsIcon className="h-3.5 w-3.5" /> Asset
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="appearance" className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Lighting Intensity</Label>
                  <Input type="range" min="0" max="5" step="0.1" value={editorState.config.intensity} />
                </div>
                {/* More style controls */}
              </TabsContent>
              
              <TabsContent value="interactions" className="pt-4">
                <div className="p-4 border rounded-md border-dashed text-center space-y-2">
                  <p className="text-sm font-medium">Add Interaction Trigger</p>
                  <p className="text-xs text-muted-foreground">Select a mesh in the preview to add behavior.</p>
                  <Button variant="secondary" size="sm" className="mt-2">Scan Scene</Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Side: Live 3D Preview (Isolation Container) */}
        <div className="lg:col-span-7 flex flex-col h-[500px] lg:h-full min-h-[500px] sticky top-0">
          <Card className="relative w-full h-full overflow-hidden border-border/50 shadow-2xl bg-black group">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm transition-all group-hover:scale-105">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              Live Preview Runtime
            </div>
            
            {/* The Engine Component (Next.js Dynamic Import) */}
            <div className="w-full h-full">
              <Engine 
                modelUrl={editorState.modelUrl} 
                config={editorState.config}
                plan="pro" // MVP: Hardcoded plan gate for now
              />
            </div>
          </Card>
          <div className="mt-4 p-3 bg-muted/20 border border-border/50 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
             <SettingsIcon className="size-3" />
             Navigation: Left-click to Rotate | Scroll to Zoom | Right-click to Pan
          </div>
        </div>
      </div>
    </div>
  )
}
