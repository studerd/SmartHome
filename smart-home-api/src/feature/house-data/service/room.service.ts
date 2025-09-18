import { Injectable, Logger } from '@nestjs/common';
import { Room } from '../data/entity/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(@InjectRepository(Room) private readonly repository: Repository<Room>) {
  }

  public async getAll(): Promise<Room[]> {
    return await this.repository.find();
  }
}
