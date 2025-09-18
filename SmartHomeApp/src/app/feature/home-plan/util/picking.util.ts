import {PickHandler} from '../data';

import * as THREE from 'three';
export class PickingUtil {

  static setupPicking(
    domElement: HTMLElement,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    onPick: PickHandler
  ) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function toNDC(event: PointerEvent) {
      const rect = domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function pickAtPointer() {
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (!intersects.length) return;
      onPick(intersects[0].object as THREE.Object3D);
    }

    const handler = (e: PointerEvent) => {
      toNDC(e);
      pickAtPointer();
    };
    domElement.addEventListener('pointerdown', handler);

    return () => domElement.removeEventListener('pointerdown', handler);
  }

  static findAncestorByName(
    obj: THREE.Object3D,
    predicate: (name: string) => boolean
  ): THREE.Object3D | null {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (cur.name && predicate(cur.name)) return cur;
      cur = cur.parent;
    }
    return null;
  }

}
