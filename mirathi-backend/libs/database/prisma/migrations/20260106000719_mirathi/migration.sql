-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHERS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_UPLOAD', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('TITLE_DEED', 'NATIONAL_ID', 'DEATH_CERTIFICATE', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'KRA_PIN', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LAND', 'PROPERTY', 'VEHICLE', 'BANK_ACCOUNT', 'INVESTMENT', 'BUSINESS', 'LIVESTOCK', 'PERSONAL_EFFECTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'VERIFIED', 'ENCUMBERED', 'DISPUTED', 'LIQUIDATED');

-- CreateEnum
CREATE TYPE "LandCategory" AS ENUM ('RESIDENTIAL', 'AGRICULTURAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('PERSONAL_CAR', 'COMMERCIAL_VEHICLE', 'MOTORCYCLE', 'TRACTOR');

-- CreateEnum
CREATE TYPE "DebtCategory" AS ENUM ('MORTGAGE', 'BANK_LOAN', 'SACCO_LOAN', 'PERSONAL_LOAN', 'MOBILE_LOAN', 'FUNERAL_EXPENSES', 'MEDICAL_BILLS', 'TAXES_OWED', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OUTSTANDING', 'PARTIALLY_PAID', 'PAID_IN_FULL', 'DISPUTED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'REVOKED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'FRIEND', 'CHARITY', 'OTHER');

-- CreateEnum
CREATE TYPE "BequestType" AS ENUM ('SPECIFIC_ASSET', 'PERCENTAGE', 'CASH_AMOUNT', 'RESIDUAL');

-- CreateEnum
CREATE TYPE "WitnessStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SuccessionRegime" AS ENUM ('TESTATE', 'INTESTATE', 'PARTIALLY_INTESTATE');

-- CreateEnum
CREATE TYPE "SuccessionReligion" AS ENUM ('STATUTORY', 'ISLAMIC', 'HINDU', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "MarriageType" AS ENUM ('MONOGAMOUS', 'POLYGAMOUS', 'COHABITATION', 'SINGLE');

-- CreateEnum
CREATE TYPE "CourtJurisdiction" AS ENUM ('HIGH_COURT', 'MAGISTRATE_COURT', 'KADHIS_COURT', 'CUSTOMARY_COURT');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY', 'COMPLETE');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('MISSING_DOCUMENT', 'INVALID_DOCUMENT', 'MINOR_WITHOUT_GUARDIAN', 'MISSING_VALUATION', 'JURISDICTION_ISSUE', 'TAX_CLEARANCE', 'FAMILY_DISPUTE', 'WITNESS_ISSUE', 'EXECUTOR_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "RoadmapPhase" AS ENUM ('PRE_FILING', 'FILING', 'COURT_PROCESS', 'GRANT_ISSUANCE', 'DISTRIBUTION');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('IDENTITY_VERIFICATION', 'ASSET_DISCOVERY', 'DEBT_SETTLEMENT', 'DOCUMENT_COLLECTION', 'VALUATION', 'LEGAL_REQUIREMENT', 'COURT_FILING', 'FAMILY_CONSENT', 'GUARDIANSHIP', 'TAX_COMPLIANCE');

-- CreateEnum
CREATE TYPE "KenyanFormType" AS ENUM ('PA1_PROBATE', 'PA80_INTESTATE', 'PA5_SUMMARY', 'PA12_AFFIDAVIT_MEANS', 'PA38_FAMILY_CONSENT', 'CHIEFS_LETTER', 'ISLAMIC_PETITION');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SELF', 'FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'SIBLING', 'HALF_SIBLING');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('ACTIVE', 'DIVORCED', 'ANNULLED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "GuardianshipStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ELIGIBLE', 'CONDITIONAL', 'INELIGIBLE', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KenyanCounty" AS ENUM ('BARINGO', 'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO_MARAKWET', 'EMBU', 'GARISSA', 'HOMA_BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU', 'KILIFI', 'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE', 'LAIKIPIA', 'LAMU', 'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT', 'MERU', 'MIGORI', 'MOMBASA', 'MURANGA', 'NAIROBI', 'NAKURU', 'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 'NYERI', 'SAMBURU', 'SIAYA', 'TAITA_TAVETA', 'TANA_RIVER', 'THARAKA_NITHI', 'TRANS_NZOIA', 'TURKANA', 'UASIN_GISHU', 'VIHIGA', 'WAJIR', 'WEST_POKOT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
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
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
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
    "id" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" VARCHAR(255),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_changes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "oldRole" "UserRole" NOT NULL,
    "newRole" "UserRole" NOT NULL,
    "changedBy" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_verification_tokens" (
    "id" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "newEmail" VARCHAR(255) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "deviceId" VARCHAR(255),
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "documentName" VARCHAR(200) NOT NULL,
    "referenceNumber" VARCHAR(100),
    "referenceType" "ReferenceType",
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "storageKey" TEXT,
    "mimeType" VARCHAR(100),
    "fileSizeBytes" INTEGER,
    "encryptedReference" TEXT,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "ocrExtractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_attempts" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "verifierId" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "homeCounty" "KenyanCounty",
    "tribe" VARCHAR(50),
    "clanName" VARCHAR(100),
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "totalMinors" INTEGER NOT NULL DEFAULT 0,
    "totalSpouses" INTEGER NOT NULL DEFAULT 0,
    "hasMissingLinks" BOOLEAN NOT NULL DEFAULT false,
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "userId" UUID,
    "firstName" VARCHAR(100) NOT NULL,
    "middleName" VARCHAR(100),
    "lastName" VARCHAR(100) NOT NULL,
    "maidenName" VARCHAR(100),
    "relationship" "RelationshipType" NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "placeOfBirth" VARCHAR(200),
    "nationalId" VARCHAR(20),
    "birthCertNo" VARCHAR(50),
    "kraPin" VARCHAR(20),
    "passportNumber" VARCHAR(50),
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "dateOfDeath" TIMESTAMP(3),
    "deathCertNo" VARCHAR(50),
    "causeOfDeath" TEXT,
    "placeOfDeath" VARCHAR(200),
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" TEXT,
    "isMentallyCapable" BOOLEAN NOT NULL DEFAULT true,
    "isAdopted" BOOLEAN NOT NULL DEFAULT false,
    "adoptionType" TEXT,
    "adoptionDate" TIMESTAMP(3),
    "biologicalParentIds" TEXT[],
    "polygamousHouseId" UUID,
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "currentAddress" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marriages" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "spouse1Id" UUID NOT NULL,
    "spouse2Id" UUID NOT NULL,
    "type" "MarriageType" NOT NULL,
    "status" "MarriageStatus" NOT NULL DEFAULT 'ACTIVE',
    "marriageDate" TIMESTAMP(3) NOT NULL,
    "divorceDate" TIMESTAMP(3),
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "marriageOrder" INTEGER,
    "polygamousHouseId" UUID,
    "certNumber" VARCHAR(100),
    "registeredAt" TIMESTAMP(3),
    "registryOffice" VARCHAR(200),
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polygamous_houses" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "houseName" VARCHAR(100) NOT NULL,
    "houseOrder" INTEGER NOT NULL,
    "houseCode" VARCHAR(20) NOT NULL,
    "motherId" UUID NOT NULL,
    "motherName" VARCHAR(200) NOT NULL,
    "childCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dissolutionDate" TIMESTAMP(3),
    "dissolutionReason" TEXT,
    "legalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polygamous_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardianships" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "wardName" VARCHAR(200) NOT NULL,
    "wardAge" INTEGER NOT NULL,
    "status" "GuardianshipStatus" NOT NULL DEFAULT 'DRAFT',
    "eligibilityChecklist" JSONB,
    "eligibilityScore" INTEGER NOT NULL DEFAULT 0,
    "proximityScore" INTEGER NOT NULL DEFAULT 0,
    "relationshipScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "legalReference" TEXT,
    "warnings" TEXT[],
    "blockingIssues" TEXT[],
    "courtOrderNumber" VARCHAR(100),
    "courtOrderDate" TIMESTAMP(3),
    "courtStation" VARCHAR(200),
    "lastReportDate" TIMESTAMP(3),
    "nextReportDue" TIMESTAMP(3),
    "isCompliant" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardianships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_assignments" (
    "id" UUID NOT NULL,
    "guardianshipId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "guardianName" VARCHAR(200) NOT NULL,
    "wardId" UUID NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isAlternate" BOOLEAN NOT NULL DEFAULT false,
    "priorityOrder" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eligibilitySnapshot" JSONB,
    "eligibilityScore" INTEGER NOT NULL DEFAULT 0,
    "appointedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedDate" TIMESTAMP(3),
    "suspendedDate" TIMESTAMP(3),
    "terminatedDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "courtApproved" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderRef" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardian_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "kraPin" VARCHAR(20),
    "totalAssets" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalDebts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netWorth" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isInsolvent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "estimatedValue" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "proofDocumentUrl" TEXT,
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceDetails" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "location" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "titleDeedNumber" VARCHAR(100) NOT NULL,
    "parcelNumber" VARCHAR(100),
    "county" "KenyanCounty" NOT NULL,
    "subCounty" VARCHAR(100),
    "landCategory" "LandCategory" NOT NULL,
    "sizeInAcres" DECIMAL(10,2),

    CONSTRAINT "land_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "registrationNumber" VARCHAR(20) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER,
    "vehicleCategory" "VehicleCategory" NOT NULL,

    CONSTRAINT "vehicle_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "creditorName" VARCHAR(200) NOT NULL,
    "creditorContact" VARCHAR(100),
    "description" TEXT NOT NULL,
    "category" "DebtCategory" NOT NULL,
    "priority" "DebtPriority" NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "originalAmount" DECIMAL(15,2) NOT NULL,
    "outstandingBalance" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "dueDate" TIMESTAMP(3),
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securityDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "testatorName" VARCHAR(200) NOT NULL,
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "executorName" VARCHAR(200),
    "executorPhone" VARCHAR(20),
    "executorEmail" VARCHAR(100),
    "executorRelationship" TEXT,
    "funeralWishes" TEXT,
    "burialLocation" VARCHAR(200),
    "specialInstructions" TEXT,
    "hasExecutor" BOOLEAN NOT NULL DEFAULT false,
    "hasBeneficiaries" BOOLEAN NOT NULL DEFAULT false,
    "hasWitnesses" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completenessScore" INTEGER NOT NULL DEFAULT 0,
    "validationWarnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bequests" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "assetId" UUID,
    "beneficiaryName" VARCHAR(200) NOT NULL,
    "beneficiaryType" "BeneficiaryType" NOT NULL,
    "relationship" VARCHAR(100),
    "bequestType" "BequestType" NOT NULL,
    "percentage" DECIMAL(5,2),
    "cashAmount" DECIMAL(15,2),
    "description" TEXT NOT NULL,
    "hasConditions" BOOLEAN NOT NULL DEFAULT false,
    "conditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "witnesses" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "fullName" VARCHAR(200) NOT NULL,
    "nationalId" VARCHAR(20),
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "status" "WitnessStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "isOver18" BOOLEAN NOT NULL DEFAULT true,
    "isNotBeneficiary" BOOLEAN NOT NULL DEFAULT true,
    "isMentallyCapable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_assessments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "familyId" UUID,
    "regime" "SuccessionRegime" NOT NULL,
    "religion" "SuccessionReligion" NOT NULL,
    "marriageType" "MarriageType" NOT NULL,
    "targetCourt" "CourtJurisdiction" NOT NULL,
    "hasWill" BOOLEAN NOT NULL DEFAULT false,
    "hasMinors" BOOLEAN NOT NULL DEFAULT false,
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "isInsolvent" BOOLEAN NOT NULL DEFAULT false,
    "requiresGuardian" BOOLEAN NOT NULL DEFAULT false,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "documentScore" INTEGER NOT NULL DEFAULT 0,
    "legalScore" INTEGER NOT NULL DEFAULT 0,
    "familyScore" INTEGER NOT NULL DEFAULT 0,
    "financialScore" INTEGER NOT NULL DEFAULT 0,
    "totalRisks" INTEGER NOT NULL DEFAULT 0,
    "criticalRisks" INTEGER NOT NULL DEFAULT 0,
    "highRisks" INTEGER NOT NULL DEFAULT 0,
    "mediumRisks" INTEGER NOT NULL DEFAULT 0,
    "nextSteps" TEXT[],
    "estimatedDaysToReady" INTEGER,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readiness_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flags" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "legalBasis" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolutionSteps" TEXT[],
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "affectsScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_roadmaps" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "assessmentId" UUID,
    "regime" "SuccessionRegime" NOT NULL,
    "religion" "SuccessionReligion" NOT NULL,
    "targetCourt" "CourtJurisdiction" NOT NULL,
    "currentPhase" "RoadmapPhase" NOT NULL DEFAULT 'PRE_FILING',
    "overallProgress" INTEGER NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "availableTasks" INTEGER NOT NULL DEFAULT 0,
    "lockedTasks" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedCompletion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" UUID NOT NULL,
    "roadmapId" UUID NOT NULL,
    "phase" "RoadmapPhase" NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'LOCKED',
    "dependsOnTaskIds" TEXT[],
    "unlocksTaskIds" TEXT[],
    "whatIsIt" TEXT,
    "whyNeeded" TEXT,
    "howToGet" TEXT,
    "estimatedDays" INTEGER,
    "legalBasis" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probate_previews" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "assessmentId" UUID,
    "regime" "SuccessionRegime" NOT NULL,
    "targetCourt" "CourtJurisdiction" NOT NULL,
    "requiredForms" "KenyanFormType"[],
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "disclaimer" TEXT NOT NULL DEFAULT 'This is an educational preview only. Not for official court submission.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probate_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_previews" (
    "id" UUID NOT NULL,
    "probatePreviewId" UUID NOT NULL,
    "formType" "KenyanFormType" NOT NULL,
    "formTitle" VARCHAR(200) NOT NULL,
    "formCode" VARCHAR(20) NOT NULL,
    "htmlPreview" TEXT NOT NULL,
    "dataSnapshot" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT,
    "instructions" TEXT[],
    "missingFields" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_guides" (
    "id" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "fullContent" TEXT NOT NULL,
    "appliesToRegime" "SuccessionRegime"[],
    "appliesToReligion" "SuccessionReligion"[],
    "legalSections" TEXT[],
    "relatedFormTypes" "KenyanFormType"[],
    "relatedTasks" TEXT[],
    "keywords" TEXT[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TestatorWills" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_TestatorWills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToWill" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DocumentToWill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EstateToReadinessAssessment" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_EstateToReadinessAssessment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssetOwner" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssetOwner_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssetToDocument" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssetToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FamilyMemberLifeInterest" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FamilyMemberLifeInterest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_unique" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_phoneNumber_idx" ON "user_profiles"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_unique" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_used_idx" ON "password_reset_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_unique" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "role_changes_userId_idx" ON "role_changes"("userId");

-- CreateIndex
CREATE INDEX "role_changes_createdAt_idx" ON "role_changes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_unique" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_userId_unique" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "phone_verification_tokens_tokenHash_unique" ON "phone_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "phone_verification_tokens_userId_used_idx" ON "phone_verification_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "phone_verification_tokens_expiresAt_idx" ON "phone_verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_tokenHash_unique" ON "email_change_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_change_tokens_userId_used_idx" ON "email_change_tokens"("userId", "used");

-- CreateIndex
CREATE INDEX "email_change_tokens_expiresAt_idx" ON "email_change_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "login_sessions_tokenHash_unique" ON "login_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "login_sessions_userId_expiresAt_idx" ON "login_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "login_sessions_deviceId_idx" ON "login_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "password_history_userId_createdAt_idx" ON "password_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "documents_uploaderId_status_idx" ON "documents"("uploaderId", "status");

-- CreateIndex
CREATE INDEX "documents_status_expiresAt_idx" ON "documents"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "documents_referenceNumber_referenceType_key" ON "documents"("referenceNumber", "referenceType");

-- CreateIndex
CREATE INDEX "families_creatorId_idx" ON "families"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_userId_key" ON "family_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_nationalId_key" ON "family_members"("nationalId");

-- CreateIndex
CREATE INDEX "family_members_familyId_relationship_idx" ON "family_members"("familyId", "relationship");

-- CreateIndex
CREATE INDEX "family_members_nationalId_idx" ON "family_members"("nationalId");

-- CreateIndex
CREATE INDEX "family_members_isAlive_idx" ON "family_members"("isAlive");

-- CreateIndex
CREATE UNIQUE INDEX "marriages_certNumber_key" ON "marriages"("certNumber");

-- CreateIndex
CREATE INDEX "marriages_familyId_idx" ON "marriages"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_familyId_houseOrder_key" ON "polygamous_houses"("familyId", "houseOrder");

-- CreateIndex
CREATE INDEX "guardianships_familyId_idx" ON "guardianships"("familyId");

-- CreateIndex
CREATE INDEX "guardianships_wardId_idx" ON "guardianships"("wardId");

-- CreateIndex
CREATE INDEX "guardian_assignments_guardianId_idx" ON "guardian_assignments"("guardianId");

-- CreateIndex
CREATE INDEX "guardian_assignments_wardId_idx" ON "guardian_assignments"("wardId");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_assignments_guardianshipId_guardianId_key" ON "guardian_assignments"("guardianshipId", "guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "estates_userId_key" ON "estates"("userId");

-- CreateIndex
CREATE INDEX "assets_estateId_category_idx" ON "assets"("estateId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "land_details_assetId_key" ON "land_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_details_assetId_key" ON "vehicle_details"("assetId");

-- CreateIndex
CREATE INDEX "debts_estateId_priority_idx" ON "debts"("estateId", "priority");

-- CreateIndex
CREATE INDEX "wills_userId_status_idx" ON "wills"("userId", "status");

-- CreateIndex
CREATE INDEX "bequests_willId_idx" ON "bequests"("willId");

-- CreateIndex
CREATE INDEX "witnesses_willId_idx" ON "witnesses"("willId");

-- CreateIndex
CREATE INDEX "readiness_assessments_userId_idx" ON "readiness_assessments"("userId");

-- CreateIndex
CREATE INDEX "readiness_assessments_estateId_idx" ON "readiness_assessments"("estateId");

-- CreateIndex
CREATE INDEX "readiness_assessments_status_idx" ON "readiness_assessments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_assessments_userId_estateId_key" ON "readiness_assessments"("userId", "estateId");

-- CreateIndex
CREATE INDEX "risk_flags_assessmentId_severity_idx" ON "risk_flags"("assessmentId", "severity");

-- CreateIndex
CREATE INDEX "risk_flags_isBlocking_idx" ON "risk_flags"("isBlocking");

-- CreateIndex
CREATE UNIQUE INDEX "executor_roadmaps_estateId_key" ON "executor_roadmaps"("estateId");

-- CreateIndex
CREATE INDEX "executor_roadmaps_userId_idx" ON "executor_roadmaps"("userId");

-- CreateIndex
CREATE INDEX "executor_roadmaps_estateId_idx" ON "executor_roadmaps"("estateId");

-- CreateIndex
CREATE INDEX "executor_roadmaps_currentPhase_idx" ON "executor_roadmaps"("currentPhase");

-- CreateIndex
CREATE INDEX "roadmap_tasks_roadmapId_phase_idx" ON "roadmap_tasks"("roadmapId", "phase");

-- CreateIndex
CREATE INDEX "roadmap_tasks_status_idx" ON "roadmap_tasks"("status");

-- CreateIndex
CREATE INDEX "probate_previews_userId_idx" ON "probate_previews"("userId");

-- CreateIndex
CREATE INDEX "probate_previews_estateId_idx" ON "probate_previews"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "probate_previews_userId_estateId_key" ON "probate_previews"("userId", "estateId");

-- CreateIndex
CREATE UNIQUE INDEX "form_previews_probatePreviewId_formType_key" ON "form_previews"("probatePreviewId", "formType");

-- CreateIndex
CREATE UNIQUE INDEX "legal_guides_slug_key" ON "legal_guides"("slug");

-- CreateIndex
CREATE INDEX "legal_guides_category_idx" ON "legal_guides"("category");

-- CreateIndex
CREATE INDEX "legal_guides_slug_idx" ON "legal_guides"("slug");

-- CreateIndex
CREATE INDEX "_TestatorWills_B_index" ON "_TestatorWills"("B");

-- CreateIndex
CREATE INDEX "_DocumentToWill_B_index" ON "_DocumentToWill"("B");

-- CreateIndex
CREATE INDEX "_EstateToReadinessAssessment_B_index" ON "_EstateToReadinessAssessment"("B");

-- CreateIndex
CREATE INDEX "_AssetOwner_B_index" ON "_AssetOwner"("B");

-- CreateIndex
CREATE INDEX "_AssetToDocument_B_index" ON "_AssetToDocument"("B");

-- CreateIndex
CREATE INDEX "_FamilyMemberLifeInterest_B_index" ON "_FamilyMemberLifeInterest"("B");

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
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse1Id_fkey" FOREIGN KEY ("spouse1Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse2Id_fkey" FOREIGN KEY ("spouse2Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polygamous_houses" ADD CONSTRAINT "polygamous_houses_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardianships" ADD CONSTRAINT "guardianships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_assignments" ADD CONSTRAINT "guardian_assignments_guardianshipId_fkey" FOREIGN KEY ("guardianshipId") REFERENCES "guardianships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_assignments" ADD CONSTRAINT "guardian_assignments_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_assignments" ADD CONSTRAINT "guardian_assignments_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_details" ADD CONSTRAINT "land_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bequests" ADD CONSTRAINT "bequests_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bequests" ADD CONSTRAINT "bequests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "witnesses" ADD CONSTRAINT "witnesses_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "readiness_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "executor_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_previews" ADD CONSTRAINT "form_previews_probatePreviewId_fkey" FOREIGN KEY ("probatePreviewId") REFERENCES "probate_previews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestatorWills" ADD CONSTRAINT "_TestatorWills_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestatorWills" ADD CONSTRAINT "_TestatorWills_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EstateToReadinessAssessment" ADD CONSTRAINT "_EstateToReadinessAssessment_A_fkey" FOREIGN KEY ("A") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EstateToReadinessAssessment" ADD CONSTRAINT "_EstateToReadinessAssessment_B_fkey" FOREIGN KEY ("B") REFERENCES "readiness_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetOwner" ADD CONSTRAINT "_AssetOwner_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetOwner" ADD CONSTRAINT "_AssetOwner_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToDocument" ADD CONSTRAINT "_AssetToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToDocument" ADD CONSTRAINT "_AssetToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_B_fkey" FOREIGN KEY ("B") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
