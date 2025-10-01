import { Prisma } from '@prisma/client';
export * from '@prisma/client';
declare const userWithProfile: {
    include: {
        profile: true;
    };
};
export type UserWithProfile = Prisma.UserGetPayload<typeof userWithProfile>;
declare const willWithAssignments: {
    include: {
        beneficiaryAssignments: {
            include: {
                asset: true;
                beneficiary: true;
            };
        };
    };
};
export type WillWithAssignments = Prisma.WillGetPayload<typeof willWithAssignments>;
declare const assetWithAssignments: {
    include: {
        beneficiaryAssignments: {
            include: {
                will: true;
                beneficiary: true;
            };
        };
    };
};
export type AssetWithAssignments = Prisma.AssetGetPayload<typeof assetWithAssignments>;
declare const familyWithMembers: {
    include: {
        members: {
            include: {
                user: true;
            };
        };
    };
};
export type FamilyWithMembers = Prisma.FamilyGetPayload<typeof familyWithMembers>;
declare const documentWithVersions: {
    include: {
        versions: true;
    };
};
export type DocumentWithVersions = Prisma.DocumentGetPayload<typeof documentWithVersions>;
export interface PaginationOptions {
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export type PrismaTransaction = Prisma.TransactionClient;
//# sourceMappingURL=prisma.types.d.ts.map