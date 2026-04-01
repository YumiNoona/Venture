import * as THREE from "three"
export function createOutlineMaterial(debug) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(debug?.outlineColor ?? "#ffffff"),
    side: THREE.BackSide,
    transparent: true,
    opacity: debug?.outlineOpacity ?? 0.9,
    depthWrite: false,
  })
}
