import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from '@root';
import { Logger } from '@nestjs/common';
import { ApiInterceptor, ConfigKey, configManager, HttpExceptionFilter, swaggerConfiguration } from '@common';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(configManager.getValue(ConfigKey.APP_BASE_URL));
  app.enableCors();
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(adapterHost));
  swaggerConfiguration.config(app);
  app.useGlobalInterceptors(new ApiInterceptor());
  await app.listen(configManager.getValue(ConfigKey.APP_PORT));
};
bootstrap().then(() => {
  const logger = new Logger('Main Logger');
  logger.log('Server is started!');
});
