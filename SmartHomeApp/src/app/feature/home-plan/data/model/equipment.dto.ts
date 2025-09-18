import {Dto} from '@core';

export interface EquipmentDto extends Dto {
  equipment_id: string;
  isOn: boolean;
  name: string;
}
