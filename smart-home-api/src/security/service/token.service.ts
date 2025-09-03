import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential, Token, TokenExpiredException, TokenGenerationException, UserNotFoundException } from '../data';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigKey, configManager } from '@common';
import { RefreshPayload } from '../data/payload/refresh.payload';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(@InjectRepository(Credential) private readonly credentialRepository: Repository<Credential>,
              private jwtService: JwtService) {
  }

  async getTokens(credential: Credential): Promise<Token> {
    try {
      const payload = { sub: credential.credential_id };
      const token = await this.jwtService.signAsync(payload, {
        secret: configManager.getValue(ConfigKey.JWT_TOKEN_SECRET),
        expiresIn: configManager.getValue(ConfigKey.JWT_TOKEN_EXPIRE_IN),
      });
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: configManager.getValue(ConfigKey.JWT_REFRESH_TOKEN_SECRET),
        expiresIn: configManager.getValue(ConfigKey.JWT_REFRESH_TOKEN_EXPIRE_IN),
      });
      return { token, refreshToken, credential };
    } catch (e) {
      this.logger.error(e.message);
      throw new TokenGenerationException();
    }
  }

  async refresh(payload: RefreshPayload): Promise<Token> {
    let id: string;
    try {
      id = this.jwtService.verify(payload.refresh, {
        secret: configManager.getValue(ConfigKey.JWT_REFRESH_TOKEN_SECRET),
      }).sub;
    } catch (e) {
      this.logger.error(e.message);
      throw new TokenExpiredException();
    }

    const credential = await this.credentialRepository.findOneBy({ credential_id: id });
    if (!credential) {
      throw new UserNotFoundException();
    }

    return this.getTokens(credential);
  }
}
