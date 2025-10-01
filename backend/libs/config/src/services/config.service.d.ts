import { ConfigService as NestConfigService } from '@nestjs/config';
import { Config } from '../types';
export declare class ConfigService {
    private nestConfigService;
    constructor(nestConfigService: NestConfigService<Config, true>);
    /**
     * Retrieves a configuration value in a type-safe manner.
     * @param key The key of the configuration property to retrieve.
     * @returns The value of the configuration property.
     */
    get<T extends keyof Config>(key: T): Config[T];
    /**
  
     * Checks if the current environment is production.
     * @returns `true` if NODE_ENV is 'production', otherwise `false`.
     */
    get isProduction(): boolean;
    /**
     * Checks if the current environment is development.
     * @returns `true` if NODE_ENV is 'development', otherwise `false`.
     */
    get isDevelopment(): boolean;
    /**
     * Checks if the current environment is test.
     * @returns `true` if NODE_ENV is 'test', otherwise `false`.
     */
    get isTest(): boolean;
}
//# sourceMappingURL=config.service.d.ts.map