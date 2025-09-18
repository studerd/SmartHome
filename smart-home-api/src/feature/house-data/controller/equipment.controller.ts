import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EquipmentService } from '../service';
import { Equipment } from '../data/entity';

@ApiBearerAuth('access-token')
@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private service: EquipmentService) {
  }

  @Get('all')
  public getAll(): Promise<Equipment[]> {
    return this.service.getAll();
  }
}
