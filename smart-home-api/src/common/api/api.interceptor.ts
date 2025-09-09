import { ApiCodeResponse, ConfigKey, configManager } from '@common';
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable,map } from 'rxjs';
import { isNil } from 'lodash';

@Injectable()
export class ApiInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ApiInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const path = ctx.getRequest().route.path;
    return next.handle().pipe(map((response: any) => {
      return { code: this.map(path), data: response, result: true };
    }));
  }

  map(path: String): ApiCodeResponse {
    this.logger.log(`path ${path}`);
    const part = path.replace(configManager.getValue(ConfigKey.APP_BASE_URL), '').split('/').filter(s => s.length > 0).slice(0, 2).map(s => s.toUpperCase());
    const code = ApiCodeResponse[`${part.join('_')}_SUCCESS` as keyof typeof ApiCodeResponse];
    return isNil(code) ? ApiCodeResponse.COMMON_SUCCESS : code;
  }
}