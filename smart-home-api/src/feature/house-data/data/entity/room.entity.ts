import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Equipment } from './equipment.entity';

@Entity()
export class Room{

  @PrimaryColumn('varchar', { length: 60})
  room_id: string;
  @Column({nullable:false})
  name: string;
  @OneToMany(()=> Equipment,(e)=> e.room, {eager:true})
  equipments: Equipment[];
  @Column({nullable:true})
  description: string;
}