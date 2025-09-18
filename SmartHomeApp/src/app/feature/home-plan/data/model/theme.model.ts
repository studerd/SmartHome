import * as THREE from 'three';

export type ThemePredicate = (mat: any, mesh: THREE.Mesh) => boolean;

/** Matériaux proches du blanc et sans texture (idéal pour murs/plafonds).
 *  Ajuste le seuil si besoin.
 */
export const nearWhiteNoTexture: ThemePredicate = (m) => {
  if (!m || !m.color || m.map) return false;
  const c = m.color as THREE.Color;
  return c.r > 0.9 && c.g > 0.9 && c.b > 0.9;
};

/** Tag par nom de matériau (ex: dans SketchUp: "ThemePrimary_Wall") */
export const byMaterialName = (substr: string): ThemePredicate =>
  (m) => typeof m?.name === 'string' && m.name.includes(substr);
