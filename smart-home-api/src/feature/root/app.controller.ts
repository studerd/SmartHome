import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TestException } from './root.exception';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppControllerHelloWorld } from './app.swagger';

@ApiTags('Route de base')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @ApiOperation(AppControllerHelloWorld)
  @Get()
  getHello(): string {
    throw new TestException();
  }
}
