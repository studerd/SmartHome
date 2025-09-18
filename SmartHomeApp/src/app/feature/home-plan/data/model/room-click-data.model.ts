
import * as THREE from 'three';
export interface RoomClickData {
  roomId: string | null;
  roomName: string;
  object: THREE.Object3D;
  bbox: THREE.Box3;
  center: THREE.Vector3;
};
