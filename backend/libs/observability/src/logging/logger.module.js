"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const config_1 = require("../../../config/src");
let LoggerModule = class LoggerModule {
};
exports.LoggerModule = LoggerModule;
exports.LoggerModule = LoggerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // We use the official nestjs-pino module for all our logging needs.
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isProduction = configService.isProduction;
                    return {
                        // The pinoHttp object configures the automatic request logger.
                        pinoHttp: {
                            // Use a pretty formatter in development for readability.
                            transport: !isProduction
                                ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                                : undefined,
                            level: configService.get('LOG_LEVEL'),
                            // This is the core of our structured logging.
                            // It defines the shape of every log entry.
                            formatters: {
                                level: (label) => ({ level: label }),
                                log: (object) => {
                                    // Here we can inject our trace context if available
                                    // (Requires integration with TracingService, a future step)
                                    return object;
                                },
                            },
                            // Customize the automatic request logging messages.
                            customLogLevel: (req, res, err) => {
                                if (res.statusCode >= 500 || err)
                                    return 'error';
                                if (res.statusCode >= 400)
                                    return 'warn';
                                return 'info';
                            },
                            customSuccessMessage: (req, res) => {
                                return `HTTP ${req.method} ${req.url} ${res.statusCode} - ${res.getHeader('x-response-time')}`;
                            },
                            customErrorMessage: (req, res, err) => {
                                return `HTTP ${req.method} ${req.url} ${res.statusCode} ERROR - ${err.message}`;
                            },
                            // Automatically add a unique request ID to every log entry for correlation.
                            genReqId: (req, res) => {
                                const existingId = req.id ?? req.headers["x-request-id"];
                                if (existingId)
                                    return existingId;
                                const id = require('crypto').randomUUID();
                                res.setHeader('x-request-id', id);
                                return id;
                            },
                            // Redact sensitive information from logs automatically.
                            redact: {
                                paths: [
                                    'req.headers.authorization',
                                    'req.headers["x-api-key"]',
                                    '*.password',
                                    '*.token',
                                ],
                                censor: '***REDACTED***',
                            },
                        },
                    };
                },
            }),
        ],
        // We don't need to export anything. `nestjs-pino` automatically
        // replaces the default NestJS logger.
    })
], LoggerModule);
//# sourceMappingURL=logger.module.js.map