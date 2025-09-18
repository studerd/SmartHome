// src/app/feature/viewer3d/utils/theme.ts
import * as THREE from 'three';
import {nearWhiteNoTexture, ThemePredicate} from '../data';

// + options pour forcer l’overlay "au-dessus", opacité et fallback wireframe
export type EdgeOpts = { overlay?: boolean; opacity?: number; fallbackWireframe?: boolean };

export class ThemeUtil {
  // ====== THEME (couleurs matériaux) =========================================

  /** Applique une couleur de thème aux matériaux filtrés par predicate.
   *  mode 'replace' = remplace la couleur; 'tint' = teinte (plus doux).
   */
  static applyTheme(
    root: THREE.Object3D,
    color: THREE.ColorRepresentation,
    predicate: ThemePredicate = nearWhiteNoTexture,
    mode: 'replace' | 'tint' = 'replace',
    strength = 1
  ) {
    const col = new THREE.Color(color);

    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((m: any) => {
        if (!predicate(m, mesh)) return;

        if (!m.userData) m.userData = {};
        if (!m.userData.__origColor && m.color) {
          m.userData.__origColor = m.color.clone();
        }

        if (!m.color) return;

        if (mode === 'replace') {
          m.color.copy(col);
        } else {
          // Teinte douce: on mélange l’HSL de la cible avec celui d’origine
          const from = m.color.clone();
          const to = col.clone();
          const fHSL = {h: 0, s: 0, l: 0};
          const tHSL = {h: 0, s: 0, l: 0};
          from.getHSL(fHSL);
          to.getHSL(tHSL);
          fHSL.h = tHSL.h;
          fHSL.s = fHSL.s * (1 - strength) + tHSL.s * strength;
          // garde la luminance d’origine pour ne pas “éteindre” les surfaces
          m.color.setHSL(fHSL.h, fHSL.s, fHSL.l);
        }

        m.needsUpdate = true;
      });
    });
  }

  /** Restaure les couleurs originales là où on a appliqué un thème. */
  static resetTheme(root: THREE.Object3D) {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((m: any) => {
        if (m?.userData?.__origColor && m.color) {
          m.color.copy(m.userData.__origColor);
          m.needsUpdate = true;
        }
      });
    });
  }

  // ====== EDGES (arêtes overlay) avec cache ==================================

  private static readonly EDGES_TAG = '__isEdgesOverlay';
  // Cache: (geometry.uuid, threshold, type) → BufferGeometry (Edges/Wireframe)
  private static readonly edgesCache = new Map<string, THREE.BufferGeometry>();

  private static cacheKey(geo: THREE.BufferGeometry, threshold: number, wire = false) {
    return `${geo.uuid}|${threshold}|${wire ? 'W' : 'E'}`;
  }

  /**
   * Ajoute un overlay d'arêtes sur les meshes filtrés par predicate.
   * API conservée (couleur, thresholdAngle, predicate, overlay, opacity, fallbackWireframe)
   */
  static addEdgesOverlay(
    root: THREE.Object3D,
    color: THREE.ColorRepresentation = '#556070',
    thresholdAngle = 35,
    predicate: (mesh: THREE.Mesh) => boolean,
    overlay = true,
    opacity = 0.95,
    fallbackWireframe = true
  ) {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.geometry) return;
      if (!predicate(mesh)) return;
      if (mesh.children.some((c) => (c as any).userData?.[ThemeUtil.EDGES_TAG])) return;

      const srcGeo = mesh.geometry as THREE.BufferGeometry;

      // 1) Essaie EdgesGeometry via cache
      let geo: THREE.BufferGeometry | undefined;
      const kEdges = ThemeUtil.cacheKey(srcGeo, thresholdAngle, false);
      if (ThemeUtil.edgesCache.has(kEdges)) {
        geo = ThemeUtil.edgesCache.get(kEdges)!.clone();
      } else {
        const eg = new THREE.EdgesGeometry(srcGeo, thresholdAngle);
        const posAttr = (eg as any).attributes?.position;
        if (posAttr && posAttr.count > 0) {
          ThemeUtil.edgesCache.set(kEdges, eg);
          geo = eg.clone();
        } else {
          eg.dispose();
          geo = undefined;
        }
      }

      // 2) Fallback Wireframe si aucune arête
      if (!geo && fallbackWireframe) {
        const kWire = ThemeUtil.cacheKey(srcGeo, thresholdAngle, true);
        if (ThemeUtil.edgesCache.has(kWire)) {
          geo = ThemeUtil.edgesCache.get(kWire)!.clone();
        } else {
          const wg = new THREE.WireframeGeometry(srcGeo);
          ThemeUtil.edgesCache.set(kWire, wg);
          geo = wg.clone();
        }
      }

      if (!geo) return;

      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthTest: !overlay, // overlay=true => par-dessus tout
        depthWrite: false,
        toneMapped: false, // ne pas ternir la couleur par l’ACES
      });

      const lines = new THREE.LineSegments(geo, mat);
      lines.name = '__EdgesOverlay';
      (lines as any).userData = {[ThemeUtil.EDGES_TAG]: true};
      lines.renderOrder = (mesh.renderOrder || 0) + 1;
      mesh.add(lines);
    });
  }

  /** Change la couleur (et optionnellement l'opacité) de TOUTES les arêtes overlay sous root. */
  static setEdgesColor(root: THREE.Object3D, color: THREE.ColorRepresentation, opacity?: number) {
    ThemeUtil.traverseEdges(root, (lines) => {
      const m = lines.material as THREE.LineBasicMaterial;
      if (m?.color) {
        m.color.set(color);
      }
      if (typeof opacity === 'number') {
        m.opacity = opacity;
        m.transparent = opacity < 1;
      }
      m.needsUpdate = true;
    });
  }

  /** Affiche/masque toutes les arêtes overlay. */
  static setEdgesVisible(root: THREE.Object3D, visible: boolean) {
    ThemeUtil.traverseEdges(root, (lines) => (lines.visible = visible));
  }

  /** Supprime et libère proprement toutes les arêtes overlay. */
  static removeEdgesOverlay(root: THREE.Object3D) {
    const toRemove: { parent: THREE.Object3D; child: THREE.Object3D }[] = [];

    root.traverse((o) => {
      o.children?.forEach((c) => {
        if ((c as any).userData?.[ThemeUtil.EDGES_TAG]) {
          toRemove.push({parent: o, child: c});
        }
      });
    });

    toRemove.forEach(({parent, child}) => {
      parent.remove(child);
      ThemeUtil.disposeLines(child as THREE.LineSegments);
    });
  }

  static xrayNeutral(root: THREE.Object3D, color: THREE.ColorRepresentation = 0x9fb3c8, opacity = 0.35) {
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh) return;
      mesh.material = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity,
        depthWrite: false // évite les artefacts de profondeur en x-ray
      });
    });
  }

  static forceTranslucentBasic(
    root: THREE.Object3D,
    color: THREE.ColorRepresentation = '#273549',
    opacity = 0.35
  ) {
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh) return;

      mesh.material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false // évite les artefacts de z avec la transparence
      });
    });
  }

  static sanitizePBR(root: THREE.Object3D, {forceDoubleSide=false} = {}) {
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach((m: any) => {
        // 1) enlever les transparences accidentelles
        if (m.transparent || (typeof m.opacity === 'number' && m.opacity < 1)) {
          m.transparent = false;
          m.opacity = 1;
          m.alphaTest = 0;
          m.depthWrite = true;
        }
        // 2) PBR plus “lisible” sans HDRI
        if ('metalness' in m) m.metalness = 0;      // pas de reflets noirs
        if ('roughness' in m) m.roughness = 0.9;    // diffus, lisible
        if ('envMapIntensity' in m) m.envMapIntensity = 0;

        // 3) test rapide contre normales foireuses
        if (forceDoubleSide && 'side' in m) m.side = THREE.DoubleSide;

        m.needsUpdate = true;
      });
    });
  }

  static forceUnlitBasic(root: THREE.Object3D, color: THREE.ColorRepresentation = 0x7a828c) {
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      const newMats = mats.map((m: any) => {
        const params: any = {color, transparent: false, opacity: 1};
        // si texture baseColor présente, on la garde
        if (m.map) params.map = m.map;
        return new THREE.MeshBasicMaterial(params);
      });

      mesh.material = Array.isArray(mesh.material) ? newMats : newMats[0];
    });
  }

  /** Reconstruit l’overlay avec un nouveau threshold/couleur/predicate, etc. */
  static rebuildEdgesOverlay(
    root: THREE.Object3D,
    color: THREE.ColorRepresentation = '#556070',
    thresholdAngle = 35,
    predicate: (mesh: THREE.Mesh) => boolean,
    overlay = true,
    opacity = 0.95,
    fallbackWireframe = true
  ) {
    ThemeUtil.removeEdgesOverlay(root);
    ThemeUtil.addEdgesOverlay(root, color, thresholdAngle, predicate, overlay, opacity, fallbackWireframe);
  }

  /** Compte le nombre de nodes d’overlay présents sous root. */
  static countEdgesOverlay(root: THREE.Object3D): number {
    let count = 0;
    ThemeUtil.traverseEdges(root, () => count++);
    return count;
  }

  // ====== Helpers internes ===================================================

  private static traverseEdges(root: THREE.Object3D, fn: (lines: THREE.LineSegments) => void) {
    root.traverse((o) => {
      o.children?.forEach((c) => {
        if ((c as any).userData?.[ThemeUtil.EDGES_TAG]) fn(c as THREE.LineSegments);
      });
    });
  }

  private static disposeLines(lines: THREE.LineSegments) {
    const g = lines.geometry as THREE.BufferGeometry | undefined;
    const m = lines.material as THREE.Material | undefined;
    if (g) g.dispose();
    if (m) m.dispose();
  }
}
