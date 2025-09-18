import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export class CameraFitUtil{

static fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D
) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  controls.target.copy(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = (maxDim / 2) / Math.tan(fov / 2);
  cameraZ *= 1.4;

  camera.position.set(center.x + cameraZ * 0.2, center.y + maxDim * 0.5, center.z + cameraZ);
  camera.near = Math.max(maxDim / 1000, 0.1);
  camera.far = Math.min(maxDim * 100, 5000);
  camera.updateProjectionMatrix();
  controls.update();
}

}
