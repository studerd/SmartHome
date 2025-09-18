import { Module } from '@nestjs/common';
import { EquipmentController, RoomController } from './controller';
import { EquipmentService, RoomService } from './service';
import { Room } from './data/entity/room.entity';
import { Equipment } from './data/entity';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [TypeOrmModule.forFeature([Room, Equipment])],
  providers: [EquipmentService, RoomService],
  controllers: [EquipmentController, RoomController],
})
export class HouseDataModule {
}
