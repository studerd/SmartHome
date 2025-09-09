import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@common';
import { CredentialDataPayload } from '../../security/data/payload/credential-data.payload';
import { CreateConfigPayload } from '@security';

@Controller('app')
export class AppController {
  constructor(private readonly service: AppService) {
  }
  @Public()
  @Get('config')
  public getInfo() {
    return this.service.getInfo();
  }
  @Public()
  @Post('create')
  public create(@Body() payload:CreateConfigPayload) {
    return this.service.create(payload);
  }
}
