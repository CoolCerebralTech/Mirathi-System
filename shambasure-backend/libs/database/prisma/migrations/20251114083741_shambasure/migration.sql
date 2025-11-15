-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SPOUSE', 'EX_SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'PARENT', 'SIBLING', 'HALF_SIBLING', 'GRANDCHILD', 'GRANDPARENT', 'NIECE_NEPHEW', 'AUNT_UNCLE', 'COUSIN', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LAND_PARCEL', 'PROPERTY', 'FINANCIAL_ASSET', 'DIGITAL_ASSET', 'BUSINESS_INTEREST', 'VEHICLE', 'INTELLECTUAL_PROPERTY', 'LIVESTOCK', 'PERSONAL_EFFECTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetOwnershipType" AS ENUM ('SOLE', 'JOINT_TENANCY', 'TENANCY_IN_COMMON', 'COMMUNITY_PROPERTY');

-- CreateEnum
CREATE TYPE "BequestType" AS ENUM ('SPECIFIC', 'RESIDUARY', 'CONDITIONAL', 'TRUST', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "BequestConditionType" AS ENUM ('AGE_REQUIREMENT', 'SURVIVAL', 'EDUCATION', 'MARRIAGE', 'ALTERNATE', 'NONE');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('LEGAL_GUARDIAN', 'FINANCIAL_GUARDIAN', 'PROPERTY_GUARDIAN', 'TESTAMENTARY');

-- CreateEnum
CREATE TYPE "ExecutorStatus" AS ENUM ('NOMINATED', 'ACTIVE', 'DECLINED', 'REMOVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WitnessStatus" AS ENUM ('PENDING', 'SIGNED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('VALIDITY_CHALLENGE', 'UNDUE_INFLUENCE', 'LACK_CAPACITY', 'FRAUD', 'OMITTED_HEIR', 'ASSET_VALUATION', 'EXECUTOR_MISCONDUCT', 'OTHER');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('MORTGAGE', 'PERSONAL_LOAN', 'CREDIT_CARD', 'BUSINESS_DEBT', 'TAX_OBLIGATION', 'FUNERAL_EXPENSE', 'MEDICAL_BILL', 'OTHER');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'CUSTOMARY_MARRIAGE', 'CIVIL_UNION');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('LAND_OWNERSHIP', 'IDENTITY_PROOF', 'SUCCESSION_DOCUMENT', 'FINANCIAL_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "RetentionPolicy" AS ENUM ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "phoneNumber" VARCHAR(20),
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "address" JSONB,
    "nextOfKin" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_changes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldRole" "UserRole" NOT NULL,
    "newRole" "UserRole" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "deviceId" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" TEXT NOT NULL,
    "treeData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "familyId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfDeath" TIMESTAMP(3),
    "relationshipTo" TEXT,
    "role" "RelationshipType" NOT NULL,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marriages" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "spouse1Id" TEXT NOT NULL,
    "spouse2Id" TEXT NOT NULL,
    "marriageDate" TIMESTAMP(3) NOT NULL,
    "marriageType" "MarriageStatus" NOT NULL,
    "certificateNumber" TEXT,
    "divorceDate" TIMESTAMP(3),
    "divorceCertNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "type" "GuardianType" NOT NULL,
    "appointedBy" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssetType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownershipType" "AssetOwnershipType" NOT NULL DEFAULT 'SOLE',
    "ownershipShare" DECIMAL(5,2),
    "estimatedValue" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3),
    "valuationSource" TEXT,
    "location" JSONB,
    "registrationNumber" TEXT,
    "identificationDetails" JSONB,
    "hasVerifiedDocument" BOOLEAN NOT NULL DEFAULT false,
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceDetails" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_co_owners" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "sharePercent" DECIMAL(5,2) NOT NULL,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_co_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "valuedBy" TEXT,
    "method" TEXT,
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "ownerId" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "description" TEXT NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "outstandingBalance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "creditorName" TEXT NOT NULL,
    "creditorContact" TEXT,
    "accountNumber" TEXT,
    "dueDate" TIMESTAMP(3),
    "interestRate" DECIMAL(5,2),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "testatorId" TEXT NOT NULL,
    "willDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "supersedes" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revocationReason" TEXT,
    "funeralWishes" TEXT,
    "burialLocation" TEXT,
    "residuaryClause" TEXT,
    "requiresWitnesses" BOOLEAN NOT NULL DEFAULT true,
    "witnessCount" INTEGER NOT NULL DEFAULT 0,
    "hasAllWitnesses" BOOLEAN NOT NULL DEFAULT false,
    "digitalAssetInstructions" TEXT,
    "specialInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_versions" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeLog" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "will_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_executors" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "executorId" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "orderOfPriority" INTEGER NOT NULL DEFAULT 1,
    "status" "ExecutorStatus" NOT NULL DEFAULT 'NOMINATED',
    "appointedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "isCompensated" BOOLEAN NOT NULL DEFAULT false,
    "compensationAmount" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_witnesses" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "witnessId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "idNumber" TEXT,
    "relationship" TEXT,
    "address" JSONB,
    "status" "WitnessStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureData" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "ineligibilityReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_assignments" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "beneficiaryId" TEXT,
    "familyMemberId" TEXT,
    "externalBeneficiaryName" TEXT,
    "externalBeneficiaryContact" TEXT,
    "bequestType" "BequestType" NOT NULL DEFAULT 'SPECIFIC',
    "sharePercent" DECIMAL(5,2) NOT NULL,
    "specificAmount" DECIMAL(15,2),
    "hasCondition" BOOLEAN NOT NULL DEFAULT false,
    "conditionType" "BequestConditionType" NOT NULL DEFAULT 'NONE',
    "conditionDetails" TEXT,
    "alternateBeneficiaryId" TEXT,
    "alternateSharePercent" DECIMAL(5,2),
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "distributionNotes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disinheritance_records" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "disinheritedMemberId" TEXT NOT NULL,
    "reason" TEXT,
    "wasNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disinheritance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "disputantId" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'FILED',
    "description" TEXT NOT NULL,
    "lawyerName" TEXT,
    "lawyerContact" TEXT,
    "caseNumber" TEXT,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "evidenceUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" TEXT NOT NULL,
    "deceasedUserId" TEXT,
    "deceasedName" TEXT NOT NULL,
    "dateOfDeath" TIMESTAMP(3),
    "probateCaseNumber" TEXT,
    "estateValue" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "administrationType" TEXT,
    "administratorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_inventories" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "assetId" TEXT,
    "description" TEXT NOT NULL,
    "estimatedValue" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "ownedByDeceased" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estate_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants_of_administration" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "applicantId" TEXT,
    "applicantName" TEXT,
    "grantType" TEXT NOT NULL,
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "caseNumber" TEXT,
    "notes" TEXT,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grants_of_administration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditor_claims" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "creditorName" TEXT NOT NULL,
    "amountClaimed" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "supportingDocumentId" TEXT,
    "status" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditor_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_accountings" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "totalAssets" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalLiabilities" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netEstateValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "preparedById" TEXT,
    "preparedAt" TIMESTAMP(3),
    "auditedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_accountings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_entitlements" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "beneficiaryUserId" TEXT,
    "beneficiaryFamilyMemberId" TEXT,
    "externalName" TEXT,
    "relationship" "RelationshipType",
    "entitlementType" "BequestType" NOT NULL DEFAULT 'SPECIFIC',
    "sharePercent" DECIMAL(5,2),
    "fixedAmount" DECIMAL(18,2),
    "lifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "heldInTrustId" TEXT,
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_schedules" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribution_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intestacy_cases" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionJson" JSONB NOT NULL,
    "computedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "intestacy_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testamentary_trusts" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "trusteeId" TEXT,
    "trusteeName" TEXT,
    "purpose" TEXT,
    "validUntil" TIMESTAMP(3),
    "fundsHeld" DECIMAL(18,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testamentary_trusts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "uploaderId" TEXT NOT NULL,
    "identityForUserId" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "retentionPolicy" TEXT,
    "allowedViewers" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "assetId" TEXT,
    "willId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuingAuthority" TEXT,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "checksum" TEXT,
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "changeNote" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "checksum" TEXT,
    "documentId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_verification_attempts" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "verifierId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "templateId" TEXT NOT NULL,
    "recipientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EstateWills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EstateWills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_phoneNumber_idx" ON "user_profiles"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_used_idx" ON "password_reset_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "role_changes_userId_idx" ON "role_changes"("userId");

-- CreateIndex
CREATE INDEX "role_changes_createdAt_idx" ON "role_changes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_userId_key" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "phone_verification_tokens_tokenHash_key" ON "phone_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "phone_verification_tokens_userId_used_idx" ON "phone_verification_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "phone_verification_tokens_expiresAt_idx" ON "phone_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_tokenHash_key" ON "email_change_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_change_tokens_userId_used_idx" ON "email_change_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "email_change_tokens_expiresAt_idx" ON "email_change_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "login_sessions_tokenHash_key" ON "login_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "login_sessions_userId_expiresAt_idx" ON "login_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "login_sessions_deviceId_idx" ON "login_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "password_history_userId_createdAt_idx" ON "password_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "families_creatorId_idx" ON "families"("creatorId");

-- CreateIndex
CREATE INDEX "families_deletedAt_idx" ON "families"("deletedAt");

-- CreateIndex
CREATE INDEX "family_members_familyId_idx" ON "family_members"("familyId");

-- CreateIndex
CREATE INDEX "family_members_userId_idx" ON "family_members"("userId");

-- CreateIndex
CREATE INDEX "family_members_isMinor_isDeceased_idx" ON "family_members"("isMinor", "isDeceased");

-- CreateIndex
CREATE INDEX "family_members_deletedAt_idx" ON "family_members"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_userId_familyId_key" ON "family_members"("userId", "familyId");

-- CreateIndex
CREATE INDEX "marriages_familyId_idx" ON "marriages"("familyId");

-- CreateIndex
CREATE INDEX "marriages_spouse1Id_spouse2Id_idx" ON "marriages"("spouse1Id", "spouse2Id");

-- CreateIndex
CREATE INDEX "marriages_isActive_idx" ON "marriages"("isActive");

-- CreateIndex
CREATE INDEX "guardians_guardianId_idx" ON "guardians"("guardianId");

-- CreateIndex
CREATE INDEX "guardians_wardId_idx" ON "guardians"("wardId");

-- CreateIndex
CREATE INDEX "guardians_isActive_idx" ON "guardians"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_guardianId_wardId_type_key" ON "guardians"("guardianId", "wardId", "type");

-- CreateIndex
CREATE INDEX "assets_ownerId_isActive_idx" ON "assets"("ownerId", "isActive");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_hasVerifiedDocument_idx" ON "assets"("hasVerifiedDocument");

-- CreateIndex
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");

-- CreateIndex
CREATE INDEX "asset_co_owners_assetId_idx" ON "asset_co_owners"("assetId");

-- CreateIndex
CREATE INDEX "asset_co_owners_userId_idx" ON "asset_co_owners"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_co_owners_assetId_userId_key" ON "asset_co_owners"("assetId", "userId");

-- CreateIndex
CREATE INDEX "asset_valuations_assetId_valuationDate_idx" ON "asset_valuations"("assetId", "valuationDate");

-- CreateIndex
CREATE INDEX "debts_ownerId_isPaid_idx" ON "debts"("ownerId", "isPaid");

-- CreateIndex
CREATE INDEX "debts_assetId_idx" ON "debts"("assetId");

-- CreateIndex
CREATE INDEX "wills_testatorId_status_idx" ON "wills"("testatorId", "status");

-- CreateIndex
CREATE INDEX "wills_status_idx" ON "wills"("status");

-- CreateIndex
CREATE INDEX "wills_activatedAt_idx" ON "wills"("activatedAt");

-- CreateIndex
CREATE INDEX "wills_deletedAt_idx" ON "wills"("deletedAt");

-- CreateIndex
CREATE INDEX "will_versions_willId_idx" ON "will_versions"("willId");

-- CreateIndex
CREATE INDEX "will_versions_createdAt_idx" ON "will_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "will_versions_willId_versionNumber_key" ON "will_versions"("willId", "versionNumber");

-- CreateIndex
CREATE INDEX "will_executors_willId_idx" ON "will_executors"("willId");

-- CreateIndex
CREATE INDEX "will_executors_executorId_idx" ON "will_executors"("executorId");

-- CreateIndex
CREATE INDEX "will_executors_isPrimary_status_idx" ON "will_executors"("isPrimary", "status");

-- CreateIndex
CREATE INDEX "will_witnesses_willId_idx" ON "will_witnesses"("willId");

-- CreateIndex
CREATE INDEX "will_witnesses_witnessId_idx" ON "will_witnesses"("witnessId");

-- CreateIndex
CREATE INDEX "will_witnesses_status_idx" ON "will_witnesses"("status");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_willId_idx" ON "beneficiary_assignments"("willId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_assetId_idx" ON "beneficiary_assignments"("assetId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_beneficiaryId_idx" ON "beneficiary_assignments"("beneficiaryId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_familyMemberId_idx" ON "beneficiary_assignments"("familyMemberId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_distributionStatus_idx" ON "beneficiary_assignments"("distributionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_assignments_willId_assetId_beneficiaryId_key" ON "beneficiary_assignments"("willId", "assetId", "beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_assignments_willId_assetId_familyMemberId_key" ON "beneficiary_assignments"("willId", "assetId", "familyMemberId");

-- CreateIndex
CREATE INDEX "disinheritance_records_willId_idx" ON "disinheritance_records"("willId");

-- CreateIndex
CREATE INDEX "disinheritance_records_disinheritedMemberId_idx" ON "disinheritance_records"("disinheritedMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "disinheritance_records_willId_disinheritedMemberId_key" ON "disinheritance_records"("willId", "disinheritedMemberId");

-- CreateIndex
CREATE INDEX "disputes_willId_status_idx" ON "disputes"("willId", "status");

-- CreateIndex
CREATE INDEX "disputes_disputantId_idx" ON "disputes"("disputantId");

-- CreateIndex
CREATE INDEX "estates_deceasedUserId_idx" ON "estates"("deceasedUserId");

-- CreateIndex
CREATE INDEX "estates_probateCaseNumber_idx" ON "estates"("probateCaseNumber");

-- CreateIndex
CREATE INDEX "estate_inventories_estateId_assetId_idx" ON "estate_inventories"("estateId", "assetId");

-- CreateIndex
CREATE INDEX "grants_of_administration_estateId_applicantId_idx" ON "grants_of_administration"("estateId", "applicantId");

-- CreateIndex
CREATE INDEX "creditor_claims_estateId_status_idx" ON "creditor_claims"("estateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "estate_accountings_estateId_key" ON "estate_accountings"("estateId");

-- CreateIndex
CREATE INDEX "beneficiary_entitlements_estateId_beneficiaryUserId_idx" ON "beneficiary_entitlements"("estateId", "beneficiaryUserId");

-- CreateIndex
CREATE INDEX "distribution_schedules_estateId_stepOrder_idx" ON "distribution_schedules"("estateId", "stepOrder");

-- CreateIndex
CREATE INDEX "intestacy_cases_estateId_idx" ON "intestacy_cases"("estateId");

-- CreateIndex
CREATE INDEX "testamentary_trusts_estateId_trusteeId_idx" ON "testamentary_trusts"("estateId", "trusteeId");

-- CreateIndex
CREATE INDEX "documents_uploaderId_status_createdAt_idx" ON "documents"("uploaderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "documents_category_status_createdAt_idx" ON "documents"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "documents_assetId_willId_identityForUserId_idx" ON "documents"("assetId", "willId", "identityForUserId");

-- CreateIndex
CREATE INDEX "documents_createdAt_deletedAt_idx" ON "documents"("createdAt", "deletedAt");

-- CreateIndex
CREATE INDEX "documents_uploaderId_idx" ON "documents"("uploaderId");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "documents"("createdAt");

-- CreateIndex
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");

-- CreateIndex
CREATE INDEX "documents_isPublic_idx" ON "documents"("isPublic");

-- CreateIndex
CREATE INDEX "documents_encrypted_idx" ON "documents"("encrypted");

-- CreateIndex
CREATE INDEX "documents_documentNumber_idx" ON "documents"("documentNumber");

-- CreateIndex
CREATE INDEX "documents_expiryDate_idx" ON "documents"("expiryDate");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE INDEX "document_versions_createdAt_idx" ON "document_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "document_verification_attempts_documentId_idx" ON "document_verification_attempts"("documentId");

-- CreateIndex
CREATE INDEX "document_verification_attempts_verifierId_idx" ON "document_verification_attempts"("verifierId");

-- CreateIndex
CREATE INDEX "document_verification_attempts_createdAt_idx" ON "document_verification_attempts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "Notification_recipientId_status_idx" ON "Notification"("recipientId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "_EstateWills_B_index" ON "_EstateWills"("B");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_changes" ADD CONSTRAINT "role_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_verification_tokens" ADD CONSTRAINT "phone_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse1Id_fkey" FOREIGN KEY ("spouse1Id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse2Id_fkey" FOREIGN KEY ("spouse2Id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_testatorId_fkey" FOREIGN KEY ("testatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_versions" ADD CONSTRAINT "will_versions_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_disinheritedMemberId_fkey" FOREIGN KEY ("disinheritedMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_disputantId_fkey" FOREIGN KEY ("disputantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estates" ADD CONSTRAINT "estates_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_inventories" ADD CONSTRAINT "estate_inventories_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants_of_administration" ADD CONSTRAINT "grants_of_administration_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_accountings" ADD CONSTRAINT "estate_accountings_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_entitlements" ADD CONSTRAINT "beneficiary_entitlements_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_schedules" ADD CONSTRAINT "distribution_schedules_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intestacy_cases" ADD CONSTRAINT "intestacy_cases_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testamentary_trusts" ADD CONSTRAINT "testamentary_trusts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_identityForUserId_fkey" FOREIGN KEY ("identityForUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verification_attempts" ADD CONSTRAINT "document_verification_attempts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_verification_attempts" ADD CONSTRAINT "document_verification_attempts_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EstateWills" ADD CONSTRAINT "_EstateWills_A_fkey" FOREIGN KEY ("A") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EstateWills" ADD CONSTRAINT "_EstateWills_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
