import { createClient } from "@supabase/supabase-js"

// Placeholder for Supabase initialization
// In production, use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xyzcompany.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key"

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Supabase Tables Schema reference:
 * 
 * table: users
 * - id: uuid (refs auth.users)
 * - email: text
 * - plan: text (default: 'free')
 * 
 * table: projects
 * - id: uuid
 * - user_id: uuid (refs users.id)
 * - name: text
 * - config: jsonb (The Vorld engine interactions config)
 * - config_version: int (e.g. 1, 2)
 * - updated_at: timestamp
 */

export async function getProject(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()
  
  if (error) throw error
  return data
}

export async function saveProject(projectId, config, version = 1) {
  const { error } = await supabase
    .from("projects")
    .update({ 
      config, 
      config_version: version, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", projectId)
    
  if (error) throw error
  return true
}
