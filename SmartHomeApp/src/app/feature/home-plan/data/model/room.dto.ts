import {Dto} from '@core';
import {RoomPlace} from '../enum';
import {EquipmentDto} from './equipment.dto';

export interface RoomDto extends Dto {
  room_id: string;
  name: string;
  place: RoomPlace;
  equipments: EquipmentDto[];

}
