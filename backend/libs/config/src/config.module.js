"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const config_schema_1 = require("./schemas/config.schema");
const config_service_1 = require("./services/config.service");
// ============================================================================
// Shamba Sure - Shared Configuration Module
// ============================================================================
// This is the single, centralized module for all configuration management.
// It performs the following critical tasks:
// 1. Loads environment variables from a .env file.
// 2. Validates all loaded variables against our strict Joi schema.
// 3. Provides a clean, simple, and strongly-typed `ConfigService`.
//
// By importing this one module into the root of each microservice, we
// guarantee that configuration is handled identically and robustly everywhere.
// ============================================================================
let ConfigModule = class ConfigModule {
};
exports.ConfigModule = ConfigModule;
exports.ConfigModule = ConfigModule = __decorate([
    (0, common_1.Global)() // Makes the ConfigService available globally without needing to re-import this module.
    ,
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: '.env', // Looks for the .env file in the root of the monorepo.
                validationSchema: config_schema_1.configValidationSchema,
                validationOptions: {
                    // Allow environment variables that are not in our schema (e.g., system variables).
                    allowUnknown: true,
                    // Report all validation errors at once instead of stopping at the first one.
                    abortEarly: false,
                },
                // Caching improves performance by only reading/parsing env vars once.
                cache: true,
            }),
        ],
        providers: [config_service_1.ConfigService],
        exports: [config_service_1.ConfigService],
    })
], ConfigModule);
//# sourceMappingURL=config.module.js.map