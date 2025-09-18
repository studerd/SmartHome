
import * as THREE from 'three';

export class ScreenUtil {
  static disposeScene(root: THREE.Object3D) {
    if (!root) return;
    root.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      // @ts-ignore
      if (mesh.isMesh) {
        (mesh.geometry as THREE.BufferGeometry)?.dispose?.();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach(m => {
          // @ts-ignore
          if (m && m.isMaterial) {
            Object.values(m).forEach((v: any) => {
              if (v && v.isTexture) v.dispose();
            });
            // @ts-ignore
            m.dispose?.();
          }
        });
      }
      // @ts-ignore
      if ((obj as any).isPointLight) (obj as THREE.PointLight).dispose?.();
    });
  }

}
