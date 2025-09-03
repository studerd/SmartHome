import {ToastType} from '../enum';

export type Payload = Object;
export type Dto = Object;

export interface IsEmpty {
  isEmpty: boolean;
}

export interface Business extends IsEmpty {
  id: string;
  str: string;
}

export interface LatLong {
  lat: number;
  long: number;
}

export type Toast = {
  id: string;
  type: ToastType;
  body: string;
  delay?: number;
  actions?: ToastAction[];
}
export type ToastAction = {
  label?: string;
  icon?: string;
  callBack: Function;
}
