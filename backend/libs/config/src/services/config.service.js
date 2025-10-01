"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
// ============================================================================
// ARCHITECTURAL NOTE: The Role of the ConfigService
// ============================================================================
// This service provides a simple, strongly-typed API for accessing configuration.
// It is a thin wrapper around NestJS's underlying `@nestjs/config` service.
//
// All VALIDATION, PARSING, and DEFAULT VALUES are handled upstream by the
// `config.schema.ts` (Joi schema). If the application has started successfully,
// we can safely assume that all required configuration values are present
// and correctly typed.
//
// This service should NOT contain any complex logic, validation, or parsing.
// Its sole purpose is to provide a clean, type-safe interface.
// ============================================================================
let ConfigService = class ConfigService {
    nestConfigService;
    constructor(
    // We inject the NestJS ConfigService, but we specify our flattened `Config` interface
    // as the type argument. This gives us full type safety and autocompletion.
    nestConfigService) {
        this.nestConfigService = nestConfigService;
    }
    /**
     * Retrieves a configuration value in a type-safe manner.
     * @param key The key of the configuration property to retrieve.
     * @returns The value of the configuration property.
     */
    get(key) {
        // The `true` in `NestConfigService<Config, true>` infers that all values are defined,
        // as our Joi schema has already validated and provided defaults.
        return this.nestConfigService.get(key, { infer: true });
    }
    /**
  
     * Checks if the current environment is production.
     * @returns `true` if NODE_ENV is 'production', otherwise `false`.
     */
    get isProduction() {
        return this.get('NODE_ENV') === 'production';
    }
    /**
     * Checks if the current environment is development.
     * @returns `true` if NODE_ENV is 'development', otherwise `false`.
     */
    get isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }
    /**
     * Checks if the current environment is test.
     * @returns `true` if NODE_ENV is 'test', otherwise `false`.
     */
    get isTest() {
        return this.get('NODE_ENV') === 'test';
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map