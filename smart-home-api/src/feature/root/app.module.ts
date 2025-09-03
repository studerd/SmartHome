import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configManager } from '@common';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard, SecurityModule } from '@security';

@Module({
  imports: [TypeOrmModule.forRoot(configManager.getTypeOrmConfig()), SecurityModule],
  providers: [{ provide: APP_GUARD, useClass: JwtGuard }],
})
export class AppModule {
}
