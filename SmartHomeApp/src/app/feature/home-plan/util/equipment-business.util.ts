import {RoomDto} from '../data/model/room.dto';
import {Equipment, Room, RoomPlace} from '../data';
import {EquipmentDto} from '../data/model/equipment.dto';

export class EquipmentBusinessUtil{
  static fromDto(dto: EquipmentDto): Equipment {
    return {
      id: dto.equipment_id,
      isEmpty: false,
      isOn: dto.isOn,
      name: dto.name,
      str: dto.name
    }
  }
}
