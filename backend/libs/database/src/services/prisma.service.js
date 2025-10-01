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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(configService) {
        // Dynamically configure PrismaClient based on environment variables
        const logConfig = [];
        if (configService.get('DATABASE_LOG_QUERY')) {
            logConfig.push({ emit: 'event', level: 'query' });
        }
        if (configService.get('DATABASE_LOG_INFO')) {
            logConfig.push({ emit: 'event', level: 'info' });
        }
        logConfig.push({ emit: 'event', level: 'warn' });
        logConfig.push({ emit: 'event', level: 'error' });
        super({
            log: logConfig,
            errorFormat: 'pretty',
        });
        this.setupEventListeners();
    }
    // --- Type-Safe Event Listeners ---
    setupEventListeners() {
        // Use proper Prisma event types instead of 'any'
        this.$on('query', (e) => {
            this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
        });
        this.$on('info', (e) => {
            this.logger.log(`Info: ${e.message} (${e.target})`);
        });
        this.$on('warn', (e) => {
            this.logger.warn(`Warning: ${e.message} (${e.target})`);
        });
        this.$on('error', (e) => {
            this.logger.error(`Error: ${e.message} (${e.target})`);
        });
    }
    // --- NestJS Lifecycle Hooks ---
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Database connection has been established successfully.');
        }
        catch (error) {
            this.logger.error('Failed to establish database connection.', error);
            // Exit gracefully if the database is not available on startup
            process.exit(1);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database connection has been closed.');
    }
    /**
     * IMPORTANT: Graceful shutdown is handled by NestJS.
     * Ensure `app.enableShutdownHooks()` is called in your `main.ts` file.
     * This service's `onModuleDestroy` will be called automatically.
     */
    // --- High-Level Business Logic Methods ---
    /**
     * Provides a fully type-safe transactional operation with automatic retries on deadlocks.
     * @param operation A callback function that receives a transaction client (`tx`).
     * @param maxRetries The maximum number of times to retry on a deadlock error.
     * @returns The result of the operation.
     */
    async performTransaction(operation, maxRetries = 3) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Use the correct PrismaTransaction type for the transaction client
                return await this.$transaction((tx) => operation(tx), {
                    maxWait: 5000, // 5 seconds
                    timeout: 15000, // 15 seconds
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    // Retry on deadlock (P2034) or other transient transaction errors
                    if (error.code === 'P2034') {
                        lastError = error;
                        this.logger.warn(`Transaction attempt ${attempt} failed with deadlock (P2034), retrying...`);
                        // Exponential backoff
                        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 100));
                        continue;
                    }
                }
                // Non-retryable error
                throw error;
            }
        }
        throw new Error(`Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
/**
 * NOTE ON SOFT DELETES:
 * While powerful, Prisma extensions for soft deletes can add significant complexity
 * and have edge cases (e.g., with unique constraints, cascading deletes).
 *
 * For Shamba Sure's critical data, we will start with standard (hard) deletes.
 * If a soft-delete requirement becomes necessary (e.g., for user deactivation),
 * we will implement it explicitly in the relevant service with an `isActive` or
 * `deactivatedAt` field, rather than globally overriding the delete behavior.
 * This approach is more explicit, less "magical," and easier to debug.
 */ 
//# sourceMappingURL=prisma.service.js.map