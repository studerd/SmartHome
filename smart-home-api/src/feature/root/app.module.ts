import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configManager } from '@common';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard, SecurityModule } from '@security';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppData } from './data';
import { HouseDataModule } from '../house-data';

@Module({
  imports: [HouseDataModule, TypeOrmModule.forRoot(configManager.getTypeOrmConfig()), TypeOrmModule.forFeature([AppData]), SecurityModule],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }, AppService],
  controllers: [AppController],
})
export class AppModule {
}
