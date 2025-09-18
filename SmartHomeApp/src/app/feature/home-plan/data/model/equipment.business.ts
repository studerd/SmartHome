import {Business} from '@core';
import {Object3D} from 'three';

export interface Equipment extends Business {
  isOn: boolean;
  name: string;
  node?: Object3D
}
