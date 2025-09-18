import {RoomUtil, VisualUtil} from '../util';
import {Equipment, LampEntity, Room, RoomEntity} from '../data';
import {Injectable, signal, WritableSignal} from '@angular/core';

import * as THREE from 'three';
import {Object3D, Scene} from 'three';
import {RoomBusinessUtil} from '../util/room-business.util';

@Injectable({
  providedIn: 'root'
})
export class View3DService {
  rooms$: WritableSignal<Room[]> = signal([]);
  equipments$: WritableSignal<Equipment[]> = signal([]);
  rooms = new Map<string, RoomEntity>();
  lamps = new Map<string, LampEntity>();

  init(root: Object3D, scene: Scene): void {
    let rooms: Room[] = [];
    let equipments: Equipment[] = [];
    root.traverse((obj: Object3D) => {
      if (!obj.name) return;
      if (obj.name.startsWith(RoomUtil.ROOM_PREFIX)) {
        rooms.push(RoomBusinessUtil.fromObject3D(obj));
      }
      if (obj.name.startsWith(RoomUtil.EQUIPMENT_PREFIX)) {
        rooms.push(RoomBusinessUtil.fromObject3D(obj));
      }
    });
    this.rooms$.set(rooms);
    this.equipments$.set(equipments);
  }

  /** Indexe Rooms & Lamps dans le modèle et crée les lights. */
  indexEntities(root: THREE.Object3D, scene: THREE.Scene) {
    root.traverse(obj => {
      if (!obj.name) return;

      if (RoomUtil.isRoom(obj.name)) {
        const id = RoomUtil.getRoomId(obj.name);
        if (!id) return;
        if (!this.rooms.has(id)) this.rooms.set(id, {id, group: obj, lamps: [], isOn: false});
      }

      if (RoomUtil.isLamp(obj.name)) {
        const meta = RoomUtil.parseLampId(obj.name);
        if (!meta) return;
        const {roomId, subId} = meta;

        if (!this.rooms.has(roomId)) this.rooms.set(roomId, <RoomEntity>{
          id: roomId,
          group: scene,
          lamps: [],
          isOn: false
        });

        const center = this.getWorldCenter(obj);
        const light = new THREE.PointLight(0xfff2cc, 0.0, 8, 1.5);
        light.position.copy(center);
        scene.add(light);

        const lampId = `${roomId}:${subId}`;
        const lamp: LampEntity = {id: lampId, mesh: obj, light, roomId, isOn: false};
        this.lamps.set(lampId, lamp);
        this.rooms.get(roomId)!.lamps.push(lamp);

        VisualUtil.markBulbForEmissive(obj);
      }
    });
  }

  setLampState(lampId: string, on?: boolean) {
    const lamp = this.lamps.get(lampId);
    if (!lamp) return;
    const target = on === undefined ? !lamp.isOn : on;
    lamp.isOn = target;
    lamp.light.intensity = target ? 1.3 : 0.0;
    VisualUtil.setBulbEmissive(lamp.mesh, target);

    const room = this.rooms.get(lamp.roomId);
    if (!room) return;
    const anyOn = room.lamps.some(l => l.isOn);
    VisualUtil.applyRoomLit(room, anyOn);
  }

  setRoomState(roomId: string, on?: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const target = on === undefined ? !room.isOn : on;
    room.lamps.forEach(l => {
      l.isOn = target;
      l.light.intensity = target ? 1.3 : 0.0;
      VisualUtil.setBulbEmissive(l.mesh, target);
    });
    VisualUtil.applyRoomLit(room, target);
  }

  getWorldCenter(obj: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(obj);
    const center = new THREE.Vector3();
    box.getCenter(center);
    return center;
  }
}
