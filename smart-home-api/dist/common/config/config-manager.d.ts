import { ConfigKey } from './enum/config-key.enum';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
declare class ConfigManager {
    private env;
    constructor(env: {
        [k: string]: string | undefined;
    });
    ensureValues(keys: ConfigKey[]): ConfigManager;
    getTypeOrmConfig(): TypeOrmModuleOptions;
    getValue(key: ConfigKey, throwOnMissing?: boolean): string;
}
declare const configManager: ConfigManager;
export { configManager };
