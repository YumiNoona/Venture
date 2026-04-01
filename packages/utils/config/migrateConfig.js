/**
 * Migrates a Vorld project configuration object to the latest version.
 * This ensures older saved configs safely power the latest engine features.
 */
export function migrateConfig(rawConfig) {
  if (!rawConfig) return { version: 2, objects: {} }
  
  // Clone to avoid mutating original
  let config = JSON.parse(JSON.stringify(rawConfig))
  
  // Implicit version 1 if no version specified
  const currentVersion = config.version || 1
  
  switch (currentVersion) {
    case 1:
      // Migrate v1 to v2: standardize interaction mapping
      // Convert legacy string types to new structured types if needed
      config.version = 2
      if (!config.objects) config.objects = {}
      for (const [id, meta] of Object.entries(config.objects)) {
        if (typeof meta === "string") {
          config.objects[id] = { interaction: meta }
        }
      }
      break
    
    // Add additional cases for future migrations:
    // case 2: ... break
  }

  return config
}
