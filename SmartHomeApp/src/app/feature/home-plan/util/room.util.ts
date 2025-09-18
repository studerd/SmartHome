import {Room, RoomName, RoomPlace} from '../data';
import {
  AdditiveBlending,
  BufferGeometry,
  ColorRepresentation,
  DoubleSide, FrontSide,
  Material,
  Mesh,
  MeshBasicMaterial, NormalBlending,
  Object3D
} from 'three';

export class RoomUtil {
  static readonly ROOM_PREFIX = 'Room_';
  static readonly EQUIPMENT_PREFIX = 'Equipment_';
  static readonly ROOM_LIGHT_TAG   = '__roomLight';
  static readonly ROOM_LIGHT_ADDED = '__roomLightAdded';
  static isRoom(name?: string): boolean {
    return !!name && name.startsWith(RoomUtil.ROOM_PREFIX);
  }

  static isLamp(name?: string): boolean {
    return !!name && name.startsWith(RoomUtil.EQUIPMENT_PREFIX);
  }

  static getRoomId(name: string): string | null {
    if (!RoomUtil.isRoom(name)) return null;
    return name.split(':')[1]?.trim() ?? null;
  }

  static parseLampId(name: string): { roomId: string; subId: string } | null {
    if (!RoomUtil.isLamp(name)) return null;
    const parts = name.split(':');
    const roomId = parts[1]?.trim();
    const subId = (parts.slice(2).join(':').trim()) || 'Lamp';
    if (!roomId) return null;
    return {roomId, subId};
  }
  static applyLightOverlay(
    roomNode: Object3D,
    color: ColorRepresentation = '#FFE08A',
    opacity = 0.35
  ) {
    if (!roomNode) return;

    // 1) Collecte des meshes cibles (aucune mutation ici)
    const targets: Mesh[] = [];
    roomNode.traverse(obj => {
      if ((obj as any).userData?.[this.ROOM_LIGHT_TAG]) return; // ignorer overlays
      const mesh = obj as Mesh;
      // @ts-ignore
      if (!mesh?.isMesh || !mesh.geometry) return;
      if ((mesh as any).userData?.[this.ROOM_LIGHT_ADDED]) return; // déjà traité
      if (mesh.children.some(c => (c as any).userData?.[this.ROOM_LIGHT_TAG])) return; // déjà overlay
      targets.push(mesh);
    });

    // 2) Ajout des overlays (après collecte)
    for (const mesh of targets) {
      const overlayMat = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity,                     // ex. 0.35
        blending: NormalBlending, // ⬅️ évite la saturation en blanc
        depthTest: false,            // toujours au-dessus du mesh de base
        depthWrite: false,
        side: FrontSide,       // pas de faces arrière (moins d'accumulation)
        polygonOffset: true,         // limite le z-fighting
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });

      const overlay = new Mesh(mesh.geometry, overlayMat);
      overlay.name = '__RoomLightOverlay';
      (overlay as any).userData = { [this.ROOM_LIGHT_TAG]: true };
      (overlay as any).raycast = () => {};              // l’overlay ne capte pas les clics
      overlay.renderOrder = (mesh.renderOrder || 0) + 100;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      overlay.layers.mask = mesh.layers.mask;

      mesh.add(overlay);
      (mesh as any).userData = {
        ...(mesh as any).userData,
        [this.ROOM_LIGHT_ADDED]: true
      };
    }
  }
  static clearLightOverlay(roomNode: Object3D) {
    if (!roomNode) return;

    const toRemove: Object3D[] = [];

    // Collecte d’abord (pas de mutation pendant traverse)
    roomNode.traverse(obj => {
      if ((obj as any).userData?.[this.ROOM_LIGHT_TAG]) {
        toRemove.push(obj);
      }
    });

    for (const node of toRemove) {
      const parent = node.parent as any;
      const mat = (node as any).material as Material | Material[] | undefined;
      const geo = (node as any).geometry as BufferGeometry | undefined;

      node.parent?.remove(node);
      Array.isArray(mat) ? mat.forEach(m => m.dispose?.()) : mat?.dispose?.();
      // On ne dispose PAS la geometry partagée (on la réutilise sur le mesh d’origine)
      // geo?.dispose?.(); // ← à éviter ici

      // Si le parent était un mesh taggé, on retire le flag idempotence
      if (parent?.isMesh && parent.userData?.[this.ROOM_LIGHT_ADDED]) {
        delete parent.userData[this.ROOM_LIGHT_ADDED];
      }
    }
  }

}
