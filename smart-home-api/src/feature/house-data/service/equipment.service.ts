import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from '../data/entity';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(@InjectRepository(Equipment) private readonly repository: Repository<Equipment>) {
  }

  public async getAll(): Promise<Equipment[]> {
    return await this.repository.find();
  }
}
