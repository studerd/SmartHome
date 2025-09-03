import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Credential, CredentialDeleteException, RefreshPayload,
  SignInPayload, SignupException,
  SignUpPayload,
  Token,
  UserAlreadyExistException,
  UserNotFoundException,
} from '../data';
import { Repository } from 'typeorm';
import { TokenService } from './token.service';
import { isNil } from 'lodash';
import { comparePassword, encryptPassword } from '@common';
import { Builder } from 'builder-pattern';

@Injectable()
export class SecurityService {
  constructor(@InjectRepository(Credential) private readonly repository: Repository<Credential>, private readonly tokenService: TokenService) {
  }

  async detail(id: string): Promise<Credential> {
    const result = await this.repository.findOneBy({ credential_id: id });
    if (!(isNil(result))) {
      return result;
    }
    throw new UserNotFoundException();
  }

  async signIn(payload: SignInPayload): Promise<Token> {
    let result = await this.repository.findOneBy({ username: payload.username });

    if (!isNil(result) && await comparePassword(payload.password, result.password)) {
      return this.tokenService.getTokens(result);
    }
    throw new UserNotFoundException();
  }

  async signup(payload: SignUpPayload): Promise<Credential> {
    const result: Credential | null = await this.repository.findOneBy({ username: payload.username });
    if (!isNil(result)) {
      throw new UserAlreadyExistException();
    }
    try {
      const encryptedPassword = await encryptPassword(payload.password);
      const newCredential: Credential = Builder<Credential>()
        .username(payload.username)
        .password(encryptedPassword)
        .mail(payload.mail).build();
      return this.repository.save(newCredential);
    } catch (e) {
      throw new SignupException();
    }
  }

  async refresh(payload: RefreshPayload): Promise<Token | null> {
    return this.tokenService.refresh(payload);
  }

  async delete(id): Promise<void> {
    try {
      const detail: Credential = await this.detail(id);
      await this.repository.remove(detail);
    } catch (e) {
      throw new CredentialDeleteException();
    }
  }
}
