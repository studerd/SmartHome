import {Business} from '@core';
import {RoomPlace} from '../enum';
import {Equipment} from './equipment.business';
import {Object3D} from 'three';

export interface Room extends Business {
  name: string;
  place: RoomPlace;
  equipments: Equipment[];
  node?: Object3D,
  isOn:boolean;
}
