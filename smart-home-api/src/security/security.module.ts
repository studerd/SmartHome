import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenService, SecurityService } from './service';
import { Credential } from './data';
import { SecurityController } from './security.controller';
import { JwtGuard } from './jwt.guard';
import { ConfigKey, configManager } from '@common';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({
    global: true,
    secret: configManager.getValue(ConfigKey.JWT_TOKEN_SECRET),
    signOptions: { expiresIn: configManager.getValue(ConfigKey.JWT_TOKEN_EXPIRE_IN) },
  }), TypeOrmModule.forFeature([Credential])],
  providers: [TokenService, SecurityService, JwtGuard],
  exports: [SecurityService],
  controllers: [SecurityController],
})
export class SecurityModule {
}
