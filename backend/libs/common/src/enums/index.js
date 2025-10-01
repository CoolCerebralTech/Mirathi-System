"use strict";
// ============================================================================
// Shamba Sure - Shared Enumerations
// ============================================================================
// This file is the single source of truth for the "controlled vocabularies"
// used across all microservices. It ensures consistency in event names,
// error codes, and other critical business logic identifiers.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = exports.EventPattern = exports.NotificationStatus = exports.NotificationChannel = exports.DocumentStatus = exports.AssetType = exports.WillStatus = exports.RelationshipType = exports.UserRole = void 0;
// --- 1. Prisma-Generated Enums ---
// Re-export all enums generated from our database schema.
// This provides a single, consistent import path (`@shamba/common`) for these types.
var database_1 = require("../../../database/src"); // Corrected to import from our own database lib
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return database_1.UserRole; } });
Object.defineProperty(exports, "RelationshipType", { enumerable: true, get: function () { return database_1.RelationshipType; } });
Object.defineProperty(exports, "WillStatus", { enumerable: true, get: function () { return database_1.WillStatus; } });
Object.defineProperty(exports, "AssetType", { enumerable: true, get: function () { return database_1.AssetType; } });
Object.defineProperty(exports, "DocumentStatus", { enumerable: true, get: function () { return database_1.DocumentStatus; } });
Object.defineProperty(exports, "NotificationChannel", { enumerable: true, get: function () { return database_1.NotificationChannel; } });
Object.defineProperty(exports, "NotificationStatus", { enumerable: true, get: function () { return database_1.NotificationStatus; } });
// --- 2. Messaging Event Enums ---
// Defines the contract for all events that are published to RabbitMQ.
// Using a consistent naming convention (`domain.entity.action`) is recommended.
var EventPattern;
(function (EventPattern) {
    // Accounts Service Events
    EventPattern["USER_CREATED"] = "accounts.user.created";
    EventPattern["USER_UPDATED"] = "accounts.user.updated";
    EventPattern["USER_DELETED"] = "accounts.user.deleted";
    EventPattern["PASSWORD_RESET_REQUESTED"] = "accounts.password.reset_requested";
    // Succession Service Events
    EventPattern["WILL_CREATED"] = "succession.will.created";
    EventPattern["WILL_ACTIVATED"] = "succession.will.activated";
    EventPattern["ASSET_CREATED"] = "succession.asset.created";
    EventPattern["HEIR_ASSIGNED"] = "succession.heir.assigned";
    // Documents Service Events
    EventPattern["DOCUMENT_UPLOADED"] = "documents.document.uploaded";
    EventPattern["DOCUMENT_VERIFIED"] = "documents.document.verified";
})(EventPattern || (exports.EventPattern = EventPattern = {}));
// --- 3. Standardized Error Code Enum ---
// Provides a consistent set of internal error codes for logging, monitoring,
// and creating standardized API error responses.
var ErrorCode;
(function (ErrorCode) {
    // General (1xxx)
    ErrorCode[ErrorCode["VALIDATION_FAILED"] = 1000] = "VALIDATION_FAILED";
    ErrorCode[ErrorCode["UNKNOWN_ERROR"] = 1999] = "UNKNOWN_ERROR";
    // Auth (2xxx)
    ErrorCode[ErrorCode["UNAUTHENTICATED"] = 2000] = "UNAUTHENTICATED";
    ErrorCode[ErrorCode["INVALID_CREDENTIALS"] = 2001] = "INVALID_CREDENTIALS";
    ErrorCode[ErrorCode["JWT_EXPIRED"] = 2002] = "JWT_EXPIRED";
    ErrorCode[ErrorCode["JWT_INVALID"] = 2003] = "JWT_INVALID";
    ErrorCode[ErrorCode["FORBIDDEN"] = 2004] = "FORBIDDEN";
    // Resource (3xxx)
    ErrorCode[ErrorCode["NOT_FOUND"] = 3000] = "NOT_FOUND";
    ErrorCode[ErrorCode["CONFLICT"] = 3001] = "CONFLICT";
    // Business Logic (4xxx)
    ErrorCode[ErrorCode["INVALID_OPERATION"] = 4000] = "INVALID_OPERATION";
    // e.g., cannot execute a will that is in DRAFT status
    // External Services (5xxx)
    ErrorCode[ErrorCode["SERVICE_UNAVAILABLE"] = 5000] = "SERVICE_UNAVAILABLE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// --- 4. HTTP Status Codes ---
// ARCHITECTURAL NOTE: The `HttpStatus` enum is already provided by the
// `@nestjs/common` package. To avoid redundancy and ensure we are always
// using the standard, canonical values, we will NOT redefine it here.
//
// Instead, services should import it directly from NestJS:
// `import { HttpStatus } from '@nestjs/common';`
//
// This prevents our shared library from having an unnecessary dependency on
// framework-specific details and ensures we always use the official enum.
//# sourceMappingURL=index.js.map