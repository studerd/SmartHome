import {SignInPin} from '../data';
import {SignInPage} from '@guest';
import {findIndex, findLastIndex} from 'lodash';

export class SignInUtil {
  static genPins(): SignInPin[] {
    return [
      {class: ' fa-thin fa-dot'},
      {class: ' fa-thin fa-dot'},
      {class: ' fa-thin fa-dot'},
      {class: ' fa-thin fa-dot'},
      {class: ' fa-thin fa-dot'},
      {class: ' fa-thin fa-dot'},
    ]
  }

  static addNewValue(pin: SignInPin[], char: string): SignInPin[] {
    const index = SignInUtil.findFirstFreeIndex(pin);
    if(index > -1){
      pin[index] = {class:' fa-regular fa-dot', value:char}
    }

    return [...pin];
  }

  static findFirstFreeIndex(pin: SignInPin[]): number {
    return findIndex(pin, pin => !pin.value || pin.value.trim() === '');
  }

  static findLastOccupiedIndex(pins: SignInPin[]): number {
    return findLastIndex(pins, pin => !!pin.value && pin.value.trim() !== '');
  }
}
