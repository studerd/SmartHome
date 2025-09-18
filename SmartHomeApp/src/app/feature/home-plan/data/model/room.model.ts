
import * as THREE from 'three';

export type PickHandler = (object: THREE.Object3D) => void;
export interface LampEntity {
  id: string;            // ex: "Chambre:Plafonnier1"
  mesh: THREE.Object3D;
  light: THREE.PointLight;
  roomId: string;        // ex: "Chambre"
  isOn: boolean;
}

export interface RoomEntity {
  id: string;            // ex: "Chambre"
  group: THREE.Object3D;
  lamps: LampEntity[];
  isOn: boolean;
}
