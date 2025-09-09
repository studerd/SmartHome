import { Injectable, Logger } from '@nestjs/common';
import { AppData } from './data';
import { InjectRepository } from '@nestjs/typeorm';
import { Credential } from '@security';
import { Repository } from 'typeorm';
import { TokenService } from '../../security/service';
import { isNil } from 'lodash';
import { Builder } from 'builder-pattern';
import { ulid } from 'ulid';

@Injectable()
export class AppService {

  private readonly logger = new Logger(AppService.name);

  constructor(@InjectRepository(AppData) private readonly repository: Repository<AppData>) {
  }

  public async getInfo(): Promise<AppData | null> {
    const appConfig: AppData | null = await this.reqOne();
    if (isNil(appConfig)) {
      await this.repository.save(Builder<AppData>().app_id(ulid()).isInitialized(false).build());
      return await this.reqOne();
    }
    return appConfig;
  }

  private async reqOne() {
    return await this.repository.createQueryBuilder('t')
      .limit(1)
      .getOne();
  }
}
