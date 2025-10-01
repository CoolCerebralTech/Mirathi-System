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
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    httpAdapterHost;
    logger = new common_1.Logger('GlobalExceptionFilter');
    constructor(httpAdapterHost) {
        this.httpAdapterHost = httpAdapterHost;
    }
    catch(exception, host) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        // --- Determine HTTP Status and Message ---
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'An unexpected internal server error occurred.';
        let details;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'string') {
                message = response;
            }
            else if (typeof response === 'object' && response !== null) {
                message = response.message || exception.message;
                details = response.details || response.error;
            }
        }
        // This is where we log the REAL error, especially for 500s
        if (status >= 500) {
            this.logger.error(`[${request.method} ${request.url}] - ${status}`, {
                stack: exception instanceof Error ? exception.stack : String(exception),
                exception,
            });
        }
        else {
            this.logger.warn(`[${request.method} ${request.url}] - ${status} - ${message}`);
        }
        // --- Create a Consistent Error Response Body ---
        const responseBody = {
            statusCode: status,
            message,
            errorCode: exception.errorCode || status, // Use custom error code if available
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(request),
            details,
        };
        httpAdapter.reply(ctx.getResponse(), responseBody, status);
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map