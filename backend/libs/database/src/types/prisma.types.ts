import { 
  User, 
  UserProfile, 
  Will, 
  Asset, 
  Family,
  FamilyMember,
  BeneficiaryAssignment,
  Document,
  DocumentVersion,
  Notification,
  NotificationTemplate,
  AuditLog,
  PasswordResetToken,
  UserRole,
  RelationshipType,
  WillStatus,
  AssetType,
  DocumentStatus,
  NotificationChannel,
  NotificationStatus,
  PrismaClient
} from '@prisma/client';

// Re-export all Prisma types for easy access
export {
  User,
  UserProfile,
  Will,
  Asset,
  Family,
  FamilyMember,
  BeneficiaryAssignment,
  Document,
  DocumentVersion,
  Notification,
  NotificationTemplate,
  AuditLog,
  PasswordResetToken,
  UserRole,
  RelationshipType,
  WillStatus,
  AssetType,
  DocumentStatus,
  NotificationChannel,
  NotificationStatus,
};

// Extended types for business logic
export type UserWithProfile = User & { profile?: UserProfile };
export type WillWithAssignments = Will & { 
  beneficiaryAssignments: (BeneficiaryAssignment & {
    asset: Asset;
    beneficiary: User;
  })[];
};

export type AssetWithAssignments = Asset & {
  beneficiaryAssignments: (BeneficiaryAssignment & {
    will: Will;
    beneficiary: User;
  })[];
};

export type FamilyWithMembers = Family & {
  members: (FamilyMember & {
    user: User;
  })[];
};

export type DocumentWithVersions = Document & {
  versions: DocumentVersion[];
};

// Pagination types
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

// Database transaction type
export type PrismaTransaction = Omit<PrismaClient, 
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;