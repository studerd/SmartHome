import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from '@root';
import { Logger } from '@nestjs/common';
import { HttpExceptionFilter } from '@common';
import { swaggerConfiguration } from './common/documentation';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(adapterHost));
  swaggerConfiguration.config(app);
  await app.listen(3000);
};
bootstrap().then(() => {
  const logger = new Logger('Main Logger');
  logger.log('Server is started!');
});
