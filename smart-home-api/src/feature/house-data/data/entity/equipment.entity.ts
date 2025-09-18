import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class Equipment {
  @PrimaryColumn('varchar', { length: 26 })
  equipment_id: string;
  @Column({ nullable: false })
  name: string;
  @Column({ name: 'is_on', default: false })
  isOn: boolean;
  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Room, (r) => r.equipments)
  @JoinColumn({ referencedColumnName: 'room_id', name: 'room_id_fk' })
  room: Room;
}