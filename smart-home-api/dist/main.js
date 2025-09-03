"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const _root_1 = require("./feature/root");
const common_1 = require("@nestjs/common");
const _common_1 = require("./common");
const documentation_1 = require("./common/documentation");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(_root_1.AppModule);
    const adapterHost = app.get(core_1.HttpAdapterHost);
    app.useGlobalFilters(new _common_1.HttpExceptionFilter(adapterHost));
    documentation_1.swaggerConfiguration.config(app);
    await app.listen(3000);
};
bootstrap().then(() => {
    const logger = new common_1.Logger('Main Logger');
    logger.log('Server is started!');
});
//# sourceMappingURL=main.js.map