import {Equipment, Room, RoomName, RoomPlace} from '../data';
import {Object3D} from 'three';
import {RoomDto} from '../data/model/room.dto';
import {EquipmentBusinessUtil} from './equipment-business.util';
import {isNil} from 'lodash';

export class RoomBusinessUtil {

  static fakeData(): Room[] {
    return [
      RoomBusinessUtil.fakeRoom(RoomName.PARENT_BEDROOM, true, RoomPlace.GRANGE),
      RoomBusinessUtil.fakeRoom(RoomName.WC_FARMHOUSE, true, RoomPlace.MAISON)
    ];
  }

  static associate(list: Room[], room: Room): Room {
    let found: Room | undefined = list.find(r => r.name === room.name);
    if (!isNil(found)) {
      return {...room, node: found.node}
    }
    return {...room};
  }

  static fromDto(dto: RoomDto): Room {
    const name: string = dto.name.replace('Room_GRANGE_', '')
      .replace('Room_MAISON_', '').split('-').join(' ');
    const equipments: Equipment[] = dto.equipments.map((eD) => EquipmentBusinessUtil.fromDto(eD));
    const isOn: boolean = !isNil(equipments.find(e => e.isOn));
    return {
      equipments,
      id: dto.room_id,
      isEmpty: false,
      name,
      place: dto.name.indexOf('MAISON') > -1 ? RoomPlace.MAISON : RoomPlace.GRANGE,
      str: name,
      isOn
    }
  }

  static fakeRoom(name: string, isOn: boolean, place: RoomPlace): Room {
    const room: Room = {
      equipments: [
        {id: '', isEmpty: false, name: '', isOn, str: ''}
      ], id: name, isEmpty: false, name, place, str: name
    } as Room;

    return room;
  }

  static fromObject3D(obj: Object3D): Room {
    let name: string = obj.name.replace('Room_GRANGE_', '')
      .replace('Room_MAISON_', '').split('-').join(' ');
    return {
      equipments: [],
      id: obj.name,
      isEmpty: false,
      name,
      place: obj.name.indexOf('MAISON') > -1 ? RoomPlace.MAISON : RoomPlace.GRANGE,
      str: name,
      node: obj,
      isOn: false
    }
  }
}
