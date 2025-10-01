"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// ============================================================================
// PRISMA DEFAULTS RE-EXPORT
// ============================================================================
// Re-export all generated enums, models, and utility types from the Prisma client.
// This provides a single, consistent import path for all other services.
__exportStar(require("@prisma/client"), exports);
// ============================================================================
// GENERATED PAYLOAD TYPES FOR BUSINESS LOGIC
// ============================================================================
// These types are generated directly from our schema using Prisma.UserGetPayload.
// They are guaranteed to be in sync with the database schema at all times.
// This is the STRONGLY RECOMMENDED way to define types for related data.
// ----------------------------------------------------------------------------
// --- ACCOUNTS SERVICE ---
const userWithProfile = client_1.Prisma.validator()({
    include: { profile: true },
});
// --- SUCCESSION SERVICE ---
const willWithAssignments = client_1.Prisma.validator()({
    include: {
        beneficiaryAssignments: {
            include: {
                asset: true,
                beneficiary: true,
            },
        },
    },
});
const assetWithAssignments = client_1.Prisma.validator()({
    include: {
        beneficiaryAssignments: {
            include: {
                will: true,
                beneficiary: true,
            },
        },
    },
});
const familyWithMembers = client_1.Prisma.validator()({
    include: {
        members: {
            include: {
                user: true,
            },
        },
    },
});
// --- DOCUMENTS SERVICE ---
const documentWithVersions = client_1.Prisma.validator()({
    include: {
        versions: true,
    },
});
//# sourceMappingURL=prisma.types.js.map