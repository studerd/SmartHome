import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomService } from '../service';
import { Room } from '../data/entity/room.entity';

@ApiBearerAuth('access-token')
@ApiTags('room')
@Controller('room')
export class RoomController {
  constructor(private service: RoomService) {
  }

  @Get('all')
  public getAll():Promise<Room[]>{
    return this.service.getAll();
  }
}
