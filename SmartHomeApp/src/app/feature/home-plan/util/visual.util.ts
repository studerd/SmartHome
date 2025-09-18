import {RoomEntity} from '../data';
import * as THREE from 'three';
export class VisualUtil {
  static markBulbForEmissive(obj: THREE.Object3D) {
    obj.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__origEmissive === undefined) {
            m.userData.__origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
            m.userData.__origEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
        });
      }
    });
  }

  static setBulbEmissive(obj: THREE.Object3D, on: boolean) {
    obj.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__origEmissive === undefined) {
            m.userData.__origEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
          }
          if (m.userData.__origEmissiveIntensity === undefined) {
            m.userData.__origEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
          if (m.emissive) {
            if (on) {
              m.emissive.set(0xffd88a);
              m.emissiveIntensity = 1.2;
            } else {
              m.emissive.copy(m.userData.__origEmissive);
              m.emissiveIntensity = m.userData.__origEmissiveIntensity ?? 0;
            }
            m.needsUpdate = true;
          }
        });
      }
    });
  }

  static applyRoomLit(room: RoomEntity, lit: boolean) {
    room.isOn = lit;
    room.group.traverse(o => {
      const mesh = o as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m: any) => {
          if (!m.userData) m.userData = {};
          if (m.userData.__roomOrigEmissive === undefined) {
            m.userData.__roomOrigEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0x000000);
            m.userData.__roomOrigEmissiveIntensity = m.emissiveIntensity ?? 0;
          }
          if (m.emissive) {
            if (lit) {
              const base = m.userData.__roomOrigEmissive as THREE.Color;
              m.emissive.copy(base).add(new THREE.Color(0x151515));
              m.emissiveIntensity = Math.max(m.userData.__roomOrigEmissiveIntensity ?? 0, 0.15);
            } else {
              m.emissive.copy(m.userData.__roomOrigEmissive);
              m.emissiveIntensity = m.userData.__roomOrigEmissiveIntensity ?? 0;
            }
            m.needsUpdate = true;
          }
        });
      }
    });
  }

}
