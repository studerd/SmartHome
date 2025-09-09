import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@common';

@Controller('app')
export class AppController {
  constructor(private readonly service: AppService) {
  }
  @Public()
  @Get('config')
  public getInfo() {
    return this.service.getInfo();
  }
}
