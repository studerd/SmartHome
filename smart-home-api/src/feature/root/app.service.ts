import { Injectable, Logger } from '@nestjs/common';
import { AppData } from './data';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isNil } from 'lodash';
import { Builder } from 'builder-pattern';
import { ulid } from 'ulid';
import { SecurityService } from '../../security/service';
import { CreateConfigPayload, Credential } from '@security';

@Injectable()
export class AppService {

  private readonly logger = new Logger(AppService.name);

  constructor(@InjectRepository(AppData) private readonly repository: Repository<AppData>, private readonly securityService: SecurityService) {
  }

  public async getInfo(): Promise<AppData | null> {
    const appConfig: AppData | null = await this.reqOne();
    if (isNil(appConfig)) {
      await this.repository.save(Builder<AppData>().app_id(ulid()).isInitialized(false).build());
      return await this.reqOne();
    }
    return appConfig;
  }

  public async create(payload: CreateConfigPayload) {
    const credential: Credential = await this.securityService.sendModification(payload.superAdminData);
    const appData: AppData = Builder<AppData>().app_id(payload.id)
      .isInitialized(true)
      .superAdmin(credential)
      .build();
    await this.repository.save(appData);
    return await this.getInfo();
  }

  private async reqOne() {
    return await this.repository.createQueryBuilder('t')
      .leftJoinAndSelect('t.superAdmin', 'c')
      .limit(1)
      .getOne();
  }
}
