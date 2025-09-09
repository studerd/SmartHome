import { Injectable, Logger } from '@nestjs/common';
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
import { ulid } from 'ulid';
import { CredentialDataPayload } from '../data/payload/credential-data.payload';

@Injectable()
export class SecurityService {

  private readonly logger = new Logger(SecurityService.name);
  constructor(@InjectRepository(Credential) private readonly repository: Repository<Credential>, private readonly tokenService: TokenService) {
  }

  async detail(id: string): Promise<Credential> {
    const result = await this.repository.findOneBy({ credential_id: id });
    if (!(isNil(result))) {
      return result;
    }
    throw new UserNotFoundException();
  }

  async sendModification(payload: CredentialDataPayload): Promise<Credential> {
    if (isNil(payload.id)) {
      return await this.createNewCredential(payload);
    }
    return this.modify(payload);
  }

  async modify(payload: CredentialDataPayload): Promise<Credential> {
    const result: Credential | null = await this.repository.findOneBy({ username: payload.username });
    if (isNil(result)) {
      throw new UserNotFoundException();
    }
    return result;
  }

  async createNewCredential(payload: CredentialDataPayload): Promise<Credential> {
    const result: Credential | null = await this.repository.findOneBy({ username: payload.username });
    if (!isNil(result)) {
      throw new UserAlreadyExistException();
    }
    try {
      const encryptedPassword = await encryptPassword(payload.password);
      const credential:Credential = Builder<Credential>()
        .credential_id(ulid())
        .username(payload.username)
        .password(encryptedPassword)
        .mail(payload.mail)
        .build()
      if(!isNil(payload.biometricData)){
        credential.biometricData = payload.biometricData.vector;
      }
      return this.repository.save(credential);
    } catch (e) {
      throw new SignupException();
    }
  }

  async signIn(payload: SignInPayload): Promise<Token> {

    const BIO_COSINE_THRESHOLD = 0.42; // à calibrer (0.35–0.50 typique)
    try{
      let result: Credential | null = await this.repository.findOneBy({ username: payload.username });
      if (isNil(result)) {
        this.logger.error('result is null',result);
        throw new UserNotFoundException();
      }
      if(!isNil(payload.biometricData) && payload.biometricData.length >0){
        if (!result.biometricData || result.biometricData.length === 0) {
          this.logger.error('result.biometricData is null',result.biometricData);
          throw new UserNotFoundException(); // pas d'empreinte stockée pour cet user
        }
        const probe = this.l2norm(payload.biometricData);
        const stored = this.l2norm(result.biometricData);
        const sim = this.cosine(probe, stored);
        if (sim >= BIO_COSINE_THRESHOLD) {
          return this.tokenService.getTokens(result);
        }
        this.logger.error('sim >= BIO_COSINE_THRESHOLD',sim);
        throw new UserNotFoundException(); // mismatch biométrique
      }else if(!isNil(payload.password) && payload.password.length >0){
        if( await comparePassword(payload.password, result.password)) {
          return this.tokenService.getTokens(result);
        }
      }
      throw new UserNotFoundException();
    }catch(e){
      throw new UserNotFoundException();
    }
  }

  async signup(payload: SignUpPayload): Promise<Credential> {
    const result: Credential | null = await this.repository.findOneBy({ username: payload.username });
    if (!isNil(result)) {
      throw new UserAlreadyExistException();
    }
    try {
      const encryptedPassword = await encryptPassword(payload.password);
      const newCredential: Credential = Builder<Credential>()
        .credential_id(ulid())
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


  private cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
    let dot = 0, na = 0, nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { const x = a[i], y = b[i]; dot += x * y; na += x * x; nb += y * y; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  private l2norm(vec: number[]): number[] {
    let n = 0; for (let i = 0; i < vec.length; i++) n += vec[i] * vec[i];
    n = Math.sqrt(n) || 1;
    if (Math.abs(n - 1) < 1e-3) return vec; // déjà normalisé
    const out = new Array(vec.length);
    for (let i = 0; i < vec.length; i++) out[i] = vec[i] / n;
    return out;
  }
}
