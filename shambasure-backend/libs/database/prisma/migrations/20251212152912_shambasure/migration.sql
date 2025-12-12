-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('LAND_OWNERSHIP', 'IDENTITY_PROOF', 'SUCCESSION_DOCUMENT', 'FINANCIAL_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "RetentionPolicy" AS ENUM ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SPOUSE', 'EX_SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'PARENT', 'SIBLING', 'HALF_SIBLING', 'GRANDCHILD', 'GRANDPARENT', 'NIECE_NEPHEW', 'AUNT_UNCLE', 'COUSIN', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "RelationshipGuardianshipType" AS ENUM ('TEMPORARY', 'PERMANENT', 'TESTAMENTARY', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "MarriageType" AS ENUM ('CUSTOMARY', 'CHRISTIAN', 'CIVIL', 'ISLAMIC', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "MarriageEndReason" AS ENUM ('DEATH_OF_SPOUSE', 'DIVORCE', 'ANNULMENT', 'CUSTOMARY_DISSOLUTION', 'STILL_ACTIVE');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'CUSTOMARY_MARRIAGE', 'CIVIL_UNION', 'ISLAMIC', 'CHRISTIAN');

-- CreateEnum
CREATE TYPE "KenyanRelationshipCategory" AS ENUM ('SPOUSE', 'CHILDREN', 'PARENTS', 'SIBLINGS', 'EXTENDED_FAMILY', 'NON_FAMILY');

-- CreateEnum
CREATE TYPE "DependencyLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('TESTAMENTARY', 'COURT_APPOINTED', 'NATURAL_PARENT', 'DE_FACTO');

-- CreateEnum
CREATE TYPE "InheritanceRights" AS ENUM ('FULL', 'PARTIAL', 'CUSTOMARY', 'NONE', 'PENDING');

-- CreateEnum
CREATE TYPE "GuardianAppointmentSource" AS ENUM ('FAMILY', 'COURT', 'WILL', 'CUSTOMARY_LAW');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE');

-- CreateEnum
CREATE TYPE "WillType" AS ENUM ('STANDARD', 'JOINT_WILL', 'MUTUAL_WILL', 'HOLOGRAPHIC', 'INTERNATIONAL', 'TESTAMENTARY_TRUST_WILL');

-- CreateEnum
CREATE TYPE "RevocationMethod" AS ENUM ('NEW_WILL', 'CODICIL', 'DESTRUCTION', 'COURT_ORDER', 'MARRIAGE', 'DIVORCE', 'OTHER');

-- CreateEnum
CREATE TYPE "WillStorageLocation" AS ENUM ('SAFE_DEPOSIT_BOX', 'LAWYER_OFFICE', 'HOME_SAFE', 'DIGITAL_VAULT', 'COURT_REGISTRY', 'WITH_EXECUTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalCapacityStatus" AS ENUM ('ASSESSED_COMPETENT', 'ASSESSED_INCOMPETENT', 'PENDING_ASSESSMENT', 'MEDICAL_CERTIFICATION', 'COURT_DETERMINATION', 'SELF_DECLARATION');

-- CreateEnum
CREATE TYPE "WitnessType" AS ENUM ('REGISTERED_USER', 'EXTERNAL_INDIVIDUAL', 'PROFESSIONAL_WITNESS', 'COURT_OFFICER', 'NOTARY_PUBLIC');

-- CreateEnum
CREATE TYPE "WitnessVerificationMethod" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'BIRTH_CERTIFICATE', 'ALIEN_CARD', 'MILITARY_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "WitnessEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE_MINOR', 'INELIGIBLE_BENEFICIARY', 'INELIGIBLE_SPOUSE', 'INELIGIBLE_EXECUTOR', 'INELIGIBLE_RELATIONSHIP', 'INELIGIBLE_MENTAL_CAPACITY', 'INELIGIBLE_CRIMINAL_RECORD', 'PENDING_ELIGIBILITY_CHECK');

-- CreateEnum
CREATE TYPE "WitnessStatus" AS ENUM ('PENDING', 'SIGNED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DIGITAL_SIGNATURE', 'WET_SIGNATURE', 'E_SIGNATURE', 'BIOMETRIC_SIGNATURE', 'WITNESS_MARK');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('LAND_PARCEL', 'PROPERTY', 'FINANCIAL_ASSET', 'DIGITAL_ASSET', 'BUSINESS_INTEREST', 'VEHICLE', 'INTELLECTUAL_PROPERTY', 'LIVESTOCK', 'PERSONAL_EFFECTS', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetOwnershipType" AS ENUM ('SOLE', 'JOINT_TENANCY', 'TENANCY_IN_COMMON', 'COMMUNITY_PROPERTY');

-- CreateEnum
CREATE TYPE "AssetVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "AssetEncumbranceType" AS ENUM ('MORTGAGE', 'CHARGE', 'LIEN', 'COURT_ORDER', 'FAMILY_CLAIM', 'OTHER');

-- CreateEnum
CREATE TYPE "BequestType" AS ENUM ('SPECIFIC', 'RESIDUARY', 'CONDITIONAL', 'TRUST', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "BequestConditionType" AS ENUM ('AGE_REQUIREMENT', 'SURVIVAL', 'EDUCATION', 'MARRIAGE', 'ALTERNATE', 'NONE');

-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('USER', 'FAMILY_MEMBER', 'EXTERNAL', 'CHARITY', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "BequestPriority" AS ENUM ('PRIMARY', 'ALTERNATE', 'CONTINGENT');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('MORTGAGE', 'PERSONAL_LOAN', 'CREDIT_CARD', 'BUSINESS_DEBT', 'TAX_OBLIGATION', 'FUNERAL_EXPENSE', 'MEDICAL_BILL', 'OTHER');

-- CreateEnum
CREATE TYPE "DebtPriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OUTSTANDING', 'PARTIALLY_PAID', 'SETTLED', 'WRITTEN_OFF', 'DISPUTED', 'STATUTE_BARRED');

-- CreateEnum
CREATE TYPE "KenyanTaxType" AS ENUM ('INCOME_TAX', 'CAPITAL_GAINS_TAX', 'STAMP_DUTY', 'WITHHOLDING_TAX', 'VALUE_ADDED_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "ExecutorStatus" AS ENUM ('NOMINATED', 'ACTIVE', 'DECLINED', 'RENUNCIATED', 'REMOVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExecutorAppointmentType" AS ENUM ('TESTAMENTARY', 'COURT_APPOINTED', 'ADMINISTRATOR', 'SPECIAL_EXECUTOR');

-- CreateEnum
CREATE TYPE "ExecutorCompensationType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE_OF_ESTATE', 'HOURLY_RATE', 'STATUTORY_SCALE', 'NONE');

-- CreateEnum
CREATE TYPE "ExecutorEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE_MINOR', 'INELIGIBLE_BANKRUPT', 'INELIGIBLE_CRIMINAL_RECORD', 'INELIGIBLE_NON_RESIDENT', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('ISSUED', 'CONFIRMED', 'REVOKED', 'EXPIRED', 'AMENDED', 'REPLACED');

-- CreateEnum
CREATE TYPE "GrantType" AS ENUM ('PROBATE', 'LETTERS_OF_ADMINISTRATION', 'LETTERS_OF_ADMINISTRATION_WITH_WILL', 'LIMITED_GRANT', 'SPECIAL_GRANT');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT_FILING', 'FILED', 'GAZETTED', 'OBJECTION_PERIOD', 'OBJECTION_RECEIVED', 'HEARING_SCHEDULED', 'HEARING_COMPLETED', 'GRANT_ISSUED', 'CONFIRMATION_HEARING', 'CONFIRMED', 'APPEALED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('NORMAL', 'URGENT', 'EXPEDITED');

-- CreateEnum
CREATE TYPE "GazetteNoticeType" AS ENUM ('PROBATE', 'LETTERS_OF_ADMINISTRATION');

-- CreateEnum
CREATE TYPE "ObjectionStatus" AS ENUM ('PENDING', 'WITHDRAWN', 'DISMISSED', 'UPHELD');

-- CreateEnum
CREATE TYPE "HearingType" AS ENUM ('MENTION', 'DIRECTIONS', 'HEARING', 'RULING', 'JUDGMENT', 'APPEAL', 'REVIEW', 'CONFIRMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "HearingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ADJOURNED', 'CANCELLED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('VALIDITY_CHALLENGE', 'UNDUE_INFLUENCE', 'LACK_CAPACITY', 'FRAUD', 'OMITTED_HEIR', 'ASSET_VALUATION', 'EXECUTOR_MISCONDUCT', 'DEPENDANT_PROVISION', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('FILED', 'UNDER_REVIEW', 'MEDIATION', 'COURT_PROCEEDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'DISPUTED', 'PAID', 'PARTIALLY_PAID', 'STATUTE_BARRED');

-- CreateEnum
CREATE TYPE "ClaimPriority" AS ENUM ('PREFERRED', 'SECURED', 'ORDINARY_PREFERENTIAL', 'ORDINARY');

-- CreateEnum
CREATE TYPE "ExecutorDutyType" AS ENUM ('FILE_INVENTORY', 'PAY_FUNERAL_EXPENSES', 'PAY_DEBTS', 'DISTRIBUTE_ASSETS', 'FILE_ACCOUNTS', 'OBTAIN_GRANT', 'NOTIFY_BENEFICIARIES', 'MANAGE_PROPERTY', 'SETTLE_TAXES', 'CLOSE_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED', 'EXTENDED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('SECTION_83', 'SECTION_79', 'SECTION_45', 'SECTION_71', 'COURT_ORDER', 'WILL_PROVISION', 'CUSTOMARY_LAW');

-- CreateEnum
CREATE TYPE "EntitlementBasis" AS ENUM ('TESTATE_WILL', 'INTESTATE_S35', 'INTESTATE_S36', 'INTESTATE_S38', 'INTESTATE_S39', 'INTESTATE_S40', 'CUSTOMARY_LAW', 'COURT_ORDER');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "TransmissionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KenyanCounty" AS ENUM ('BARINGO', 'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO_MARAKWET', 'EMBU', 'GARISSA', 'HOMA_BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU', 'KILIFI', 'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE', 'LAIKIPIA', 'LAMU', 'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT', 'MERU', 'MIGORI', 'MOMBASA', 'MURANGA', 'NAIROBI', 'NAKURU', 'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 'NYERI', 'SAMBURU', 'SIAYA', 'TAITA_TAVETA', 'TANA_RIVER', 'THARAKA_NITHI', 'TRANS_NZOIA', 'TURKANA', 'UASIN_GISHU', 'VIHIGA', 'WAJIR', 'WEST_POKOT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

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
    "version" INTEGER NOT NULL,
    "filename" VARCHAR(500) NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "uploaderId" UUID NOT NULL,
    "identityForUserId" UUID,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "retentionPolicy" VARCHAR(50),
    "allowedViewers" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "assetId" UUID,
    "willId" UUID,
    "metadata" JSONB,
    "documentNumber" VARCHAR(100),
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "issuingAuthority" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storageProvider" VARCHAR(50) NOT NULL DEFAULT 'local',
    "checksum" VARCHAR(64),
    "isIndexed" BOOLEAN NOT NULL DEFAULT false,
    "indexedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "changeNote" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "checksum" VARCHAR(64),
    "documentId" UUID NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_verification_attempts" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "verifierId" UUID NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_verification_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "creatorId" UUID NOT NULL,
    "clanName" VARCHAR(100),
    "subClan" VARCHAR(100),
    "ancestralHome" VARCHAR(200),
    "familyTotem" VARCHAR(100),
    "homeCounty" "KenyanCounty",
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "livingMemberCount" INTEGER NOT NULL DEFAULT 0,
    "deceasedMemberCount" INTEGER NOT NULL DEFAULT 0,
    "minorCount" INTEGER NOT NULL DEFAULT 0,
    "dependantCount" INTEGER NOT NULL DEFAULT 0,
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "polygamousHouseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "familyId" UUID NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "middleName" VARCHAR(100),
    "nationalId" VARCHAR(20),
    "kraPin" VARCHAR(20),
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "placeOfBirth" VARCHAR(100),
    "dateOfDeath" TIMESTAMP(3),
    "placeOfDeath" VARCHAR(100),
    "deathCertificateNumber" VARCHAR(50),
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "ageAtDeath" INTEGER,
    "currentAge" INTEGER,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "polygamousHouseId" UUID,
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
    "marriageType" "MarriageType" NOT NULL,
    "registrationNumber" VARCHAR(100),
    "issuingAuthority" VARCHAR(100),
    "certificateIssueDate" TIMESTAMP(3),
    "registrationDistrict" VARCHAR(100),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "endReason" "MarriageEndReason" NOT NULL DEFAULT 'STILL_ACTIVE',
    "deceasedSpouseId" UUID,
    "divorceDecreeNumber" VARCHAR(100),
    "divorceCourt" VARCHAR(100),
    "divorceDate" TIMESTAMP(3),
    "bridePricePaid" BOOLEAN NOT NULL DEFAULT false,
    "bridePriceAmount" DOUBLE PRECISION,
    "bridePriceCurrency" VARCHAR(10) DEFAULT 'KES',
    "elderWitnesses" JSONB,
    "ceremonyLocation" VARCHAR(200),
    "traditionalCeremonyType" VARCHAR(100),
    "clanApproval" BOOLEAN NOT NULL DEFAULT false,
    "familyConsent" BOOLEAN NOT NULL DEFAULT false,
    "polygamousHouseId" UUID,
    "isMatrimonialPropertyRegime" BOOLEAN NOT NULL DEFAULT true,
    "matrimonialPropertySettled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marriages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_relationships" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "fromMemberId" UUID NOT NULL,
    "toMemberId" UUID NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "isBiological" BOOLEAN NOT NULL DEFAULT true,
    "isAdopted" BOOLEAN NOT NULL DEFAULT false,
    "adoptionOrderNumber" VARCHAR(100),
    "adoptionCourt" VARCHAR(100),
    "adoptionDate" TIMESTAMP(3),
    "isCustomaryAdoption" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" VARCHAR(100),
    "verificationDocuments" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" UUID,
    "inheritanceRights" "InheritanceRights" NOT NULL DEFAULT 'FULL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "type" "GuardianType" NOT NULL,
    "courtOrderNumber" VARCHAR(100),
    "courtStation" VARCHAR(100),
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "hasPropertyManagementPowers" BOOLEAN NOT NULL DEFAULT false,
    "canConsentToMedical" BOOLEAN NOT NULL DEFAULT true,
    "canConsentToMarriage" BOOLEAN NOT NULL DEFAULT false,
    "restrictions" JSONB,
    "specialInstructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terminationDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polygamous_houses" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "houseName" VARCHAR(100) NOT NULL,
    "houseOrder" INTEGER NOT NULL,
    "houseHeadId" UUID,
    "establishedDate" TIMESTAMP(3) NOT NULL,
    "courtRecognized" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderNumber" VARCHAR(100),
    "houseSharePercentage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polygamous_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_dependants" (
    "id" UUID NOT NULL,
    "deceasedId" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "dependencyBasis" VARCHAR(100) NOT NULL,
    "dependencyLevel" "DependencyLevel" NOT NULL,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "isClaimant" BOOLEAN NOT NULL DEFAULT false,
    "claimAmount" DOUBLE PRECISION,
    "provisionAmount" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "courtOrderReference" VARCHAR(100),
    "courtOrderDate" TIMESTAMP(3),
    "monthlySupport" DOUBLE PRECISION,
    "supportStartDate" TIMESTAMP(3),
    "supportEndDate" TIMESTAMP(3),
    "hasPhysicalDisability" BOOLEAN NOT NULL DEFAULT false,
    "hasMentalDisability" BOOLEAN NOT NULL DEFAULT false,
    "requiresOngoingCare" BOOLEAN NOT NULL DEFAULT false,
    "disabilityDetails" TEXT,
    "dependencyProofDocuments" JSONB,
    "verifiedByCourtAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependant_evidence" (
    "id" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "evidenceType" VARCHAR(100) NOT NULL,
    "documentId" UUID,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependant_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_legal_events" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "relatedUserId" UUID,
    "relatedEstateId" UUID,
    "relatedCaseId" UUID,
    "recordedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_legal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" UUID NOT NULL,
    "deceasedId" UUID NOT NULL,
    "deceasedFullName" VARCHAR(200) NOT NULL,
    "deceasedNationalId" VARCHAR(20),
    "deceasedDateOfBirth" TIMESTAMP(3),
    "deceasedDateOfDeath" TIMESTAMP(3),
    "deceasedDeathCertNumber" VARCHAR(50),
    "isTestate" BOOLEAN NOT NULL DEFAULT false,
    "isIntestate" BOOLEAN NOT NULL DEFAULT false,
    "successionCaseId" UUID,
    "grossValueKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiabilitiesKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netEstateValueKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hotchpotAdjustedValueKES" DOUBLE PRECISION,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "frozenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "testatorId" UUID NOT NULL,
    "type" "WillType" NOT NULL DEFAULT 'STANDARD',
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "legalCapacityStatus" "LegalCapacityStatus" NOT NULL DEFAULT 'PENDING_ASSESSMENT',
    "capacityAssessedBy" UUID,
    "capacityAssessedAt" TIMESTAMP(3),
    "capacityNotes" TEXT,
    "willDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionDate" TIMESTAMP(3),
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" UUID,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revocationMethod" "RevocationMethod",
    "revocationReason" TEXT,
    "revokedBy" UUID,
    "funeralWishes" TEXT,
    "burialLocation" VARCHAR(255),
    "cremationInstructions" TEXT,
    "organDonation" BOOLEAN NOT NULL DEFAULT false,
    "organDonationDetails" TEXT,
    "residuaryClause" TEXT,
    "digitalAssetInstructions" JSONB,
    "specialInstructions" TEXT,
    "storageLocation" "WillStorageLocation",
    "storageDetails" TEXT,
    "physicalWillLocation" VARCHAR(500),
    "digitalCopyStoragePath" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKeyId" VARCHAR(100),
    "requiresWitnesses" BOOLEAN NOT NULL DEFAULT true,
    "witnessCount" INTEGER NOT NULL DEFAULT 0,
    "hasAllWitnesses" BOOLEAN NOT NULL DEFAULT false,
    "minimumWitnessesRequired" INTEGER NOT NULL DEFAULT 2,
    "allWitnessedAt" TIMESTAMP(3),
    "probateCaseNumber" VARCHAR(100),
    "grantOfProbateIssued" BOOLEAN NOT NULL DEFAULT false,
    "grantOfProbateDate" TIMESTAMP(3),
    "courtRegistry" VARCHAR(100),
    "hasDependantProvision" BOOLEAN NOT NULL DEFAULT false,
    "dependantProvisionDetails" TEXT,
    "isHolographic" BOOLEAN NOT NULL DEFAULT false,
    "isWrittenInTestatorsHand" BOOLEAN NOT NULL DEFAULT false,
    "hasTestatorSignature" BOOLEAN NOT NULL DEFAULT false,
    "signatureWitnessed" BOOLEAN NOT NULL DEFAULT false,
    "meetsKenyanFormalities" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codicils" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "codicilDate" TIMESTAMP(3) NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isExecuted" BOOLEAN NOT NULL DEFAULT false,
    "executedDate" TIMESTAMP(3),
    "requiresWitnesses" BOOLEAN NOT NULL DEFAULT true,
    "witnessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codicils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_executors" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "executorId" UUID,
    "fullName" VARCHAR(200),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "nationalId" VARCHAR(20),
    "kraPin" VARCHAR(20),
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "professionalQualification" VARCHAR(100),
    "practicingCertificateNumber" VARCHAR(100),
    "physicalAddress" TEXT,
    "postalAddress" VARCHAR(100),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "orderOfPriority" INTEGER NOT NULL DEFAULT 1,
    "appointmentType" "ExecutorAppointmentType" NOT NULL DEFAULT 'TESTAMENTARY',
    "eligibilityStatus" "ExecutorEligibilityStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "eligibilityVerifiedAt" TIMESTAMP(3),
    "eligibilityVerifiedBy" UUID,
    "ineligibilityReason" TEXT,
    "status" "ExecutorStatus" NOT NULL DEFAULT 'NOMINATED',
    "nominatedAt" TIMESTAMP(3),
    "appointedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "removedAt" TIMESTAMP(3),
    "removalReason" TEXT,
    "completedAt" TIMESTAMP(3),
    "compensationType" "ExecutorCompensationType" NOT NULL DEFAULT 'STATUTORY_SCALE',
    "compensationAmount" DOUBLE PRECISION,
    "compensationPercentage" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "estimatedHours" INTEGER,
    "courtApprovedCompensation" BOOLEAN NOT NULL DEFAULT false,
    "requiresBond" BOOLEAN NOT NULL DEFAULT false,
    "bondAmount" DOUBLE PRECISION,
    "bondProvided" BOOLEAN NOT NULL DEFAULT false,
    "bondProvider" TEXT,
    "bondExpiryDate" TIMESTAMP(3),
    "specificDuties" TEXT,
    "limitations" TEXT,
    "specialPowers" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_witnesses" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "witnessType" "WitnessType" NOT NULL,
    "witnessId" UUID,
    "fullName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "idNumber" VARCHAR(20),
    "idType" VARCHAR(50),
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "isProfessionalWitness" BOOLEAN NOT NULL DEFAULT false,
    "professionalCapacity" VARCHAR(100),
    "professionalLicense" VARCHAR(100),
    "relationship" VARCHAR(100),
    "relationshipDuration" VARCHAR(50),
    "knowsTestatorWell" BOOLEAN NOT NULL DEFAULT true,
    "physicalAddress" TEXT,
    "residentialCounty" VARCHAR(100),
    "eligibilityStatus" "WitnessEligibilityStatus" NOT NULL DEFAULT 'PENDING_ELIGIBILITY_CHECK',
    "eligibilityVerifiedAt" TIMESTAMP(3),
    "eligibilityVerifiedBy" UUID,
    "ineligibilityReason" TEXT,
    "status" "WitnessStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureType" "SignatureType",
    "signatureData" TEXT,
    "signatureLocation" VARCHAR(255),
    "witnessingMethod" VARCHAR(100),
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" UUID,
    "verificationMethod" VARCHAR(100),
    "verificationNotes" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "hasConflictOfInterest" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "understandsObligation" BOOLEAN NOT NULL DEFAULT false,
    "obligationAcknowledgedAt" TIMESTAMP(3),
    "invitationSentAt" TIMESTAMP(3),
    "invitationMethod" VARCHAR(50),
    "reminderSentAt" TIMESTAMP(3),
    "responseReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "AssetType" NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3),
    "valuationSource" VARCHAR(100),
    "ownershipType" "AssetOwnershipType" NOT NULL DEFAULT 'SOLE',
    "ownershipShare" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "county" "KenyanCounty",
    "subCounty" VARCHAR(100),
    "ward" VARCHAR(100),
    "village" VARCHAR(100),
    "gpsCoordinates" VARCHAR(100),
    "titleDeedNumber" VARCHAR(100),
    "registrationNumber" VARCHAR(100),
    "kraPin" VARCHAR(20),
    "identificationDetails" JSONB,
    "verificationStatus" "AssetVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceType" "AssetEncumbranceType",
    "encumbranceAmount" DOUBLE PRECISION,
    "encumbranceDetails" TEXT,
    "isMatrimonialProperty" BOOLEAN NOT NULL DEFAULT false,
    "acquiredDuringMarriage" BOOLEAN NOT NULL DEFAULT false,
    "spouseConsentRequired" BOOLEAN NOT NULL DEFAULT false,
    "spouseConsentObtained" BOOLEAN NOT NULL DEFAULT false,
    "spouseConsentDate" TIMESTAMP(3),
    "hasLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestHolderId" UUID,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "requiresProbate" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "titleDeedNumber" VARCHAR(100) NOT NULL,
    "parcelNumber" VARCHAR(100) NOT NULL,
    "landReferenceNumber" VARCHAR(100),
    "acreage" DOUBLE PRECISION NOT NULL,
    "county" "KenyanCounty" NOT NULL,
    "subCounty" VARCHAR(100),
    "ward" VARCHAR(100),
    "landUse" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "institutionName" VARCHAR(200) NOT NULL,
    "accountNumber" VARCHAR(100) NOT NULL,
    "accountType" VARCHAR(100) NOT NULL,
    "branchName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "registrationNumber" VARCHAR(20) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "chassisNumber" VARCHAR(100),
    "engineNumber" VARCHAR(100),
    "color" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "businessName" VARCHAR(200) NOT NULL,
    "registrationNumber" VARCHAR(100),
    "kraPin" VARCHAR(20),
    "sharePercentage" DOUBLE PRECISION NOT NULL,
    "numberOfShares" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_co_owners" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "userId" UUID,
    "fullName" VARCHAR(200),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "nationalId" VARCHAR(20),
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "relationship" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_co_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "valuedBy" VARCHAR(200),
    "method" VARCHAR(100),
    "purpose" VARCHAR(100),
    "isRegisteredValuer" BOOLEAN NOT NULL DEFAULT false,
    "valuerRegistrationNumber" VARCHAR(100),
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "type" "DebtType" NOT NULL,
    "description" TEXT NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "taxType" "KenyanTaxType",
    "kraPin" VARCHAR(20),
    "taxPeriod" VARCHAR(50),
    "priority" "DebtPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DebtStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "creditorName" VARCHAR(200) NOT NULL,
    "creditorContact" VARCHAR(100),
    "creditorAccountNumber" VARCHAR(100),
    "creditorKraPin" VARCHAR(20),
    "creditorAddress" TEXT,
    "dueDate" TIMESTAMP(3),
    "interestRate" DOUBLE PRECISION,
    "interestType" VARCHAR(50),
    "compoundingFrequency" VARCHAR(50),
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "statuteBarredDate" TIMESTAMP(3),
    "requiresCourtApproval" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalObtained" BOOLEAN NOT NULL DEFAULT false,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securityDetails" TEXT,
    "collateralDescription" TEXT,
    "assetId" UUID,
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DOUBLE PRECISION,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "settlementMethod" VARCHAR(50),
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "incurredDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_assignments" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "beneficiaryType" "BeneficiaryType" NOT NULL,
    "userId" UUID,
    "familyMemberId" UUID,
    "externalName" VARCHAR(200),
    "externalContact" VARCHAR(100),
    "externalIdentification" VARCHAR(100),
    "externalAddress" TEXT,
    "relationshipToDeceased" VARCHAR(100),
    "isDependant" BOOLEAN NOT NULL DEFAULT false,
    "bequestType" "BequestType" NOT NULL DEFAULT 'SPECIFIC',
    "sharePercent" DOUBLE PRECISION,
    "specificAmount" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "conditionType" "BequestConditionType" NOT NULL DEFAULT 'NONE',
    "conditionDetails" TEXT,
    "conditionMet" BOOLEAN,
    "conditionDeadline" TIMESTAMP(3),
    "hasLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "alternateAssignmentId" UUID,
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "distributionMethod" VARCHAR(100),
    "distributionNotes" TEXT,
    "computedSharePercent" DOUBLE PRECISION,
    "computedShareValueKES" DOUBLE PRECISION,
    "priority" "BequestPriority" NOT NULL DEFAULT 'PRIMARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disinheritance_records" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "disinheritedMemberId" UUID NOT NULL,
    "reason" TEXT,
    "wasNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "notificationMethod" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disinheritance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts_inter_vivos" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "description" TEXT NOT NULL,
    "valueAtGiftTimeKES" DOUBLE PRECISION NOT NULL,
    "dateOfGift" TIMESTAMP(3) NOT NULL,
    "isAdvancement" BOOLEAN NOT NULL DEFAULT true,
    "isSubjectToHotchpot" BOOLEAN NOT NULL DEFAULT true,
    "giftDeedReference" VARCHAR(100),
    "witnessDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_inter_vivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heir_shares" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "heirId" UUID NOT NULL,
    "sectionApplied" VARCHAR(50) NOT NULL,
    "computedSharePercent" DOUBLE PRECISION NOT NULL,
    "computedShareValueKES" DOUBLE PRECISION NOT NULL,
    "isLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heir_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inheritance_computations" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "computationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedBy" UUID,
    "isTestate" BOOLEAN NOT NULL DEFAULT false,
    "willId" UUID,
    "isIntestate" BOOLEAN NOT NULL DEFAULT false,
    "polygamousHouseCount" INTEGER NOT NULL DEFAULT 0,
    "hasDependantsProvision" BOOLEAN NOT NULL DEFAULT false,
    "hotchpotIncluded" BOOLEAN NOT NULL DEFAULT true,
    "totalEstateValue" DOUBLE PRECISION NOT NULL,
    "distributionPlan" JSONB NOT NULL,
    "heirShares" JSONB NOT NULL,
    "lifeInterests" JSONB NOT NULL,
    "compliesWithSection35" BOOLEAN NOT NULL DEFAULT false,
    "compliesWithSection40" BOOLEAN NOT NULL DEFAULT false,
    "courtApproved" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderReference" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inheritance_computations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_tax_compliance" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "kraPin" VARCHAR(20),
    "incomeTaxPaid" BOOLEAN NOT NULL DEFAULT false,
    "capitalGainsTaxPaid" BOOLEAN NOT NULL DEFAULT false,
    "stampDutyPaid" BOOLEAN NOT NULL DEFAULT false,
    "taxClearanceCertificateNumber" VARCHAR(100),
    "taxClearanceIssuedAt" TIMESTAMP(3),
    "lastKraSyncAt" TIMESTAMP(3),
    "kraSyncStatus" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_tax_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_liquidations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "liquidationType" VARCHAR(50) NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION,
    "buyerName" VARCHAR(200),
    "buyerIdNumber" VARCHAR(50),
    "approvedByCourt" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderReference" VARCHAR(100),
    "saleDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "succession_cases" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "caseNumber" VARCHAR(100) NOT NULL,
    "courtLevel" VARCHAR(50) NOT NULL,
    "courtStation" VARCHAR(100) NOT NULL,
    "courtCounty" "KenyanCounty" NOT NULL,
    "applicationType" "GrantType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT_FILING',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "filingDate" TIMESTAMP(3) NOT NULL,
    "gazettePublicationDate" TIMESTAMP(3),
    "objectionDeadline" TIMESTAMP(3),
    "grantIssuedDate" TIMESTAMP(3),
    "confirmationDate" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),
    "applicantUserId" UUID,
    "applicantName" VARCHAR(200),
    "applicantRelationship" VARCHAR(100),
    "applicantContact" VARCHAR(100),
    "applicantNationalId" VARCHAR(20),
    "lawyerName" VARCHAR(200),
    "lawyerFirm" VARCHAR(200),
    "lawyerContactInfo" VARCHAR(255),
    "lawyerLicenseNumber" VARCHAR(100),
    "estimatedEstateValue" DOUBLE PRECISION,
    "totalAssetsCount" INTEGER NOT NULL DEFAULT 0,
    "totalCreditorClaims" INTEGER NOT NULL DEFAULT 0,
    "totalBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "isExpedited" BOOLEAN NOT NULL DEFAULT false,
    "requiresConfirmationHearing" BOOLEAN NOT NULL DEFAULT false,
    "confirmationHearingDate" TIMESTAMP(3),
    "closureReason" TEXT,
    "closedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "succession_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "grantType" "GrantType" NOT NULL,
    "grantNumber" VARCHAR(100) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'ISSUED',
    "confirmationDate" TIMESTAMP(3),
    "confirmedByCourtOrderId" UUID,
    "administratorUserId" UUID,
    "administratorName" VARCHAR(200),
    "administratorNationalId" VARCHAR(20),
    "administratorKraPin" VARCHAR(20),
    "administratorContact" VARCHAR(100),
    "administratorAddress" TEXT,
    "requiresBond" BOOLEAN NOT NULL DEFAULT false,
    "bondAmount" DOUBLE PRECISION,
    "bondProvided" BOOLEAN NOT NULL DEFAULT false,
    "bondProvider" VARCHAR(100),
    "bondPolicyNumber" VARCHAR(100),
    "bondExpiryDate" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "revokedBy" UUID,
    "revocationCourtOrder" VARCHAR(100),
    "amendedAt" TIMESTAMP(3),
    "amendmentReason" TEXT,
    "amendmentHistory" JSONB,
    "replacedByGrantId" UUID,
    "replacementReason" TEXT,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gazette_notices" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "noticeType" "GazetteNoticeType" NOT NULL,
    "gazetteDate" TIMESTAMP(3) NOT NULL,
    "gazetteVolume" VARCHAR(50) NOT NULL,
    "gazetteIssue" VARCHAR(50) NOT NULL,
    "gazettePageNumber" VARCHAR(50),
    "objectionDeadline" TIMESTAMP(3) NOT NULL,
    "objectionPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "publicationReference" VARCHAR(100),
    "noticeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gazette_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objections" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "objectorUserId" UUID,
    "objectorName" VARCHAR(200) NOT NULL,
    "objectorContact" VARCHAR(100),
    "objectorNationalId" VARCHAR(20),
    "objectorRelationship" VARCHAR(100),
    "grounds" JSONB,
    "groundsDescription" TEXT NOT NULL,
    "supportingEvidence" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ObjectionStatus" NOT NULL DEFAULT 'PENDING',
    "filedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hearingDate" TIMESTAMP(3),
    "hearingOutcome" TEXT,
    "resolvedDate" TIMESTAMP(3),
    "resolutionDetails" TEXT,
    "objectorLawyerName" VARCHAR(200),
    "objectorLawyerFirm" VARCHAR(200),
    "objectorLawyerContact" VARCHAR(255),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissalReason" TEXT,
    "upheldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hearings" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "hearingNumber" VARCHAR(100) NOT NULL,
    "causeListNumber" VARCHAR(100),
    "courtStation" VARCHAR(100) NOT NULL,
    "courtroom" VARCHAR(50),
    "hearingDate" TIMESTAMP(3) NOT NULL,
    "startTime" VARCHAR(10) NOT NULL DEFAULT '09:00',
    "endTime" VARCHAR(10) NOT NULL DEFAULT '10:00',
    "hearingType" "HearingType" NOT NULL,
    "status" "HearingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "judgeName" VARCHAR(200),
    "presidedBy" VARCHAR(200),
    "clerkName" VARCHAR(200),
    "virtualLink" TEXT,
    "minutesTaken" BOOLEAN NOT NULL DEFAULT false,
    "ordersIssued" BOOLEAN NOT NULL DEFAULT false,
    "adjournmentCount" INTEGER NOT NULL DEFAULT 0,
    "adjournmentReasons" JSONB,
    "nextHearingDate" TIMESTAMP(3),
    "outcomeNotes" TEXT,
    "outcome" JSONB,
    "partiesPresent" JSONB,
    "complianceDeadline" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hearings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_orders" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "orderReference" VARCHAR(100) NOT NULL,
    "orderType" VARCHAR(100),
    "summary" TEXT NOT NULL,
    "fullText" TEXT,
    "fullDocumentUrl" TEXT,
    "issuedBy" VARCHAR(200),
    "courtStation" VARCHAR(100),
    "requiresCompliance" BOOLEAN NOT NULL DEFAULT false,
    "complianceDeadline" TIMESTAMP(3),
    "complianceStatus" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_filings" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "formType" VARCHAR(50) NOT NULL,
    "formTitle" VARCHAR(200),
    "filingDate" TIMESTAMP(3) NOT NULL,
    "filedBy" VARCHAR(200),
    "documentUrl" TEXT,
    "filingFee" DOUBLE PRECISION,
    "feeReceipt" VARCHAR(100),
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "court_filings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "disputantId" UUID NOT NULL,
    "type" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'FILED',
    "description" TEXT NOT NULL,
    "lawyerName" VARCHAR(200),
    "lawyerFirm" VARCHAR(200),
    "lawyerContact" VARCHAR(255),
    "caseNumber" VARCHAR(100),
    "supportingDocuments" JSONB,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditor_claims" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "creditorName" VARCHAR(200) NOT NULL,
    "creditorContact" VARCHAR(100),
    "creditorKraPin" VARCHAR(20),
    "creditorAccountNumber" VARCHAR(100),
    "creditorAddress" TEXT,
    "claimType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ClaimPriority" NOT NULL,
    "amountClaimed" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "interestRate" DOUBLE PRECISION,
    "interestType" VARCHAR(50),
    "compoundingFrequency" VARCHAR(50),
    "dueDate" TIMESTAMP(3),
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "statuteBarredDate" TIMESTAMP(3),
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securedAssetId" UUID,
    "securityDetails" TEXT,
    "collateralDescription" TEXT,
    "supportingDocuments" JSONB,
    "proofOfDebtDocument" TEXT,
    "courtCaseNumber" VARCHAR(100),
    "courtStation" VARCHAR(100),
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "filedByUserId" UUID,
    "filedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" VARCHAR(50),
    "transactionReference" VARCHAR(100),
    "paymentNotes" TEXT,
    "requiresCourtApproval" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalObtained" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalDate" TIMESTAMP(3),
    "courtOrderReference" VARCHAR(100),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditor_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_payments" (
    "id" UUID NOT NULL,
    "creditorClaimId" UUID NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "paymentMethod" VARCHAR(50) NOT NULL,
    "transactionReference" VARCHAR(100),
    "paidBy" UUID,
    "notes" TEXT,
    "bankName" VARCHAR(100),
    "accountNumber" VARCHAR(100),
    "branchName" VARCHAR(100),
    "chequeNumber" VARCHAR(100),
    "mpesaReference" VARCHAR(100),
    "receiptNumber" VARCHAR(100),
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_inventories" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "inventoryDate" TIMESTAMP(3) NOT NULL,
    "preparedBy" UUID,
    "assetId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDocuments" JSONB,
    "verificationMethod" VARCHAR(100),
    "submittedToCourtAt" TIMESTAMP(3),
    "courtFileReference" VARCHAR(100),
    "courtAccepted" BOOLEAN NOT NULL DEFAULT false,
    "courtRejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_accountings" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "totalAssets" DOUBLE PRECISION NOT NULL,
    "totalLiabilities" DOUBLE PRECISION NOT NULL,
    "netEstateValue" DOUBLE PRECISION NOT NULL,
    "assetBreakdown" JSONB NOT NULL,
    "liabilityBreakdown" JSONB NOT NULL,
    "executorFees" DOUBLE PRECISION,
    "legalFees" DOUBLE PRECISION,
    "valuationFees" DOUBLE PRECISION,
    "courtFees" DOUBLE PRECISION,
    "funeralExpenses" DOUBLE PRECISION,
    "totalAdministrationCosts" DOUBLE PRECISION,
    "totalDistributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingForDistribution" DOUBLE PRECISION NOT NULL,
    "preparedBy" UUID,
    "preparedAt" TIMESTAMP(3),
    "submittedToCourtAt" TIMESTAMP(3),
    "courtApprovedAt" TIMESTAMP(3),
    "courtFileReference" VARCHAR(100),
    "courtRejectionReason" TEXT,
    "auditedBy" VARCHAR(200),
    "auditedAt" TIMESTAMP(3),
    "auditReportUrl" TEXT,
    "auditFindings" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_accountings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_duties" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "executorUserId" UUID NOT NULL,
    "type" "ExecutorDutyType" NOT NULL,
    "description" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "DutyStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "PriorityLevel" NOT NULL DEFAULT 'MEDIUM',
    "legalBasis" "LegalBasis" NOT NULL DEFAULT 'SECTION_83',
    "startedAt" TIMESTAMP(3),
    "estimatedCompletion" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "supportingDocuments" JSONB,
    "courtOrderNumber" VARCHAR(100),
    "previousDeadline" TIMESTAMP(3),
    "extensionReason" TEXT,
    "extendedBy" UUID,
    "extensionDate" TIMESTAMP(3),
    "overdueNotificationsSent" INTEGER NOT NULL DEFAULT 0,
    "lastOverdueNotification" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_entitlements" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "entitlementBasis" "EntitlementBasis" NOT NULL,
    "sectionApplied" VARCHAR(50),
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "shareValueKES" DOUBLE PRECISION NOT NULL,
    "isLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "distributionMethod" VARCHAR(100),
    "heldInTrust" BOOLEAN NOT NULL DEFAULT false,
    "trusteeId" UUID,
    "trustConditions" TEXT,
    "trustValidUntil" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_schedules" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "dependsOnStep" INTEGER,
    "blockingReason" TEXT,
    "estimatedAmount" DOUBLE PRECISION,
    "actualAmount" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_transmissions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "grantId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "beneficiaryId" UUID NOT NULL,
    "status" "TransmissionStatus" NOT NULL DEFAULT 'PENDING',
    "transmissionDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "registryType" VARCHAR(100),
    "registryReference" VARCHAR(100),
    "previousReference" VARCHAR(100),
    "registryLocation" VARCHAR(200),
    "transmissionMethod" VARCHAR(100) NOT NULL,
    "transferDocumentUrl" TEXT,
    "transferCertificateNumber" VARCHAR(100),
    "stampDutyPaid" BOOLEAN NOT NULL DEFAULT false,
    "stampDutyAmount" DOUBLE PRECISION,
    "stampDutyReceipt" VARCHAR(100),
    "capitalGainsTaxPaid" BOOLEAN NOT NULL DEFAULT false,
    "cgtAmount" DOUBLE PRECISION,
    "cgtReceipt" VARCHAR(100),
    "transferFee" DOUBLE PRECISION,
    "transferFeeReceipt" VARCHAR(100),
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" UUID,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "blockingReason" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_transmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gazette_integrations" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "gazetteReference" VARCHAR(100),
    "publicationStatus" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "submissionDate" TIMESTAMP(3),
    "publicationDate" TIMESTAMP(3),
    "ecitizenReference" VARCHAR(100),
    "ardhisasaReference" VARCHAR(100),
    "paymentReference" VARCHAR(100),
    "gazettePdfUrl" TEXT,
    "newspaperCuttingUrl" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gazette_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_integration_queue" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "integrationType" VARCHAR(50) NOT NULL,
    "targetSystem" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "documentUrls" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "responseCode" VARCHAR(50),
    "responseMessage" TEXT,
    "externalReference" VARCHAR(100),
    "createdBy" UUID,
    "processedBy" VARCHAR(100),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_integration_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependant_provision_orders" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "courtOrderNumber" VARCHAR(100) NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "provisionAmount" DOUBLE PRECISION NOT NULL,
    "provisionType" VARCHAR(100) NOT NULL,
    "paymentSchedule" JSONB,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompliant" BOOLEAN NOT NULL DEFAULT false,
    "lastComplianceCheck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependant_provision_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_priority_schedules" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "priorityOrder" INTEGER NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courtApprovedSchedule" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderReference" VARCHAR(100),
    "scheduledPaymentDate" TIMESTAMP(3),
    "actualPaymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_priority_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_processing_metrics" (
    "id" UUID NOT NULL,
    "courtStation" VARCHAR(100) NOT NULL,
    "monthYear" VARCHAR(10) NOT NULL,
    "totalCases" INTEGER NOT NULL,
    "avgProcessingDays" DOUBLE PRECISION NOT NULL,
    "grantIssuanceRate" DOUBLE PRECISION NOT NULL,
    "confirmationRate" DOUBLE PRECISION NOT NULL,
    "objectionRate" DOUBLE PRECISION NOT NULL,
    "casesWithinSLA" INTEGER NOT NULL,
    "casesOutsideSLA" INTEGER NOT NULL,
    "avgDaysToFirstHearing" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_processing_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" VARCHAR(255),
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failReason" TEXT,
    "templateId" UUID NOT NULL,
    "recipientId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WitnessIdentityDocuments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_WitnessIdentityDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssetInventoryEntries" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssetInventoryEntries_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "documents_uploader_status_createdAt_idx" ON "documents"("uploaderId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "documents_category_status_createdAt_idx" ON "documents"("category", "status", "createdAt");

-- CreateIndex
CREATE INDEX "documents_cross_service_idx" ON "documents"("assetId", "willId", "identityForUserId");

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
CREATE UNIQUE INDEX "document_versions_document_version_unique" ON "document_versions"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "document_verification_attempts_documentId_idx" ON "document_verification_attempts"("documentId");

-- CreateIndex
CREATE INDEX "document_verification_attempts_verifierId_idx" ON "document_verification_attempts"("verifierId");

-- CreateIndex
CREATE INDEX "document_verification_attempts_createdAt_idx" ON "document_verification_attempts"("createdAt");

-- CreateIndex
CREATE INDEX "families_creatorId_idx" ON "families"("creatorId");

-- CreateIndex
CREATE INDEX "families_isPolygamous_idx" ON "families"("isPolygamous");

-- CreateIndex
CREATE INDEX "families_homeCounty_idx" ON "families"("homeCounty");

-- CreateIndex
CREATE INDEX "families_deletedAt_idx" ON "families"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_userId_unique" ON "family_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_nationalId_unique" ON "family_members"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_kraPin_unique" ON "family_members"("kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_deathCert_unique" ON "family_members"("deathCertificateNumber");

-- CreateIndex
CREATE INDEX "family_members_familyId_idx" ON "family_members"("familyId");

-- CreateIndex
CREATE INDEX "family_members_nationalId_idx" ON "family_members"("nationalId");

-- CreateIndex
CREATE INDEX "family_members_kraPin_idx" ON "family_members"("kraPin");

-- CreateIndex
CREATE INDEX "family_members_dateOfDeath_idx" ON "family_members"("dateOfDeath");

-- CreateIndex
CREATE INDEX "family_members_minor_deceased_idx" ON "family_members"("isMinor", "isDeceased");

-- CreateIndex
CREATE INDEX "family_members_phoneNumber_idx" ON "family_members"("phoneNumber");

-- CreateIndex
CREATE INDEX "family_members_email_idx" ON "family_members"("email");

-- CreateIndex
CREATE INDEX "family_members_dateOfBirth_idx" ON "family_members"("dateOfBirth");

-- CreateIndex
CREATE INDEX "family_members_deletedAt_idx" ON "family_members"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marriages_regNumber_unique" ON "marriages"("registrationNumber");

-- CreateIndex
CREATE INDEX "marriages_familyId_idx" ON "marriages"("familyId");

-- CreateIndex
CREATE INDEX "marriages_polygamousHouseId_idx" ON "marriages"("polygamousHouseId");

-- CreateIndex
CREATE INDEX "marriages_endReason_isActive_idx" ON "marriages"("endReason", "isActive");

-- CreateIndex
CREATE INDEX "marriages_marriageType_idx" ON "marriages"("marriageType");

-- CreateIndex
CREATE INDEX "marriages_startDate_idx" ON "marriages"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "marriages_spouses_startDate_unique" ON "marriages"("spouse1Id", "spouse2Id", "startDate");

-- CreateIndex
CREATE INDEX "family_relationships_familyId_idx" ON "family_relationships"("familyId");

-- CreateIndex
CREATE INDEX "family_relationships_type_idx" ON "family_relationships"("type");

-- CreateIndex
CREATE INDEX "family_relationships_isVerified_idx" ON "family_relationships"("isVerified");

-- CreateIndex
CREATE INDEX "family_relationships_inheritanceRights_idx" ON "family_relationships"("inheritanceRights");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_unique_relation" ON "family_relationships"("fromMemberId", "toMemberId", "type");

-- CreateIndex
CREATE INDEX "guardians_ward_isActive_idx" ON "guardians"("wardId", "isActive");

-- CreateIndex
CREATE INDEX "guardians_guardianId_idx" ON "guardians"("guardianId");

-- CreateIndex
CREATE INDEX "guardians_type_idx" ON "guardians"("type");

-- CreateIndex
CREATE INDEX "guardians_validUntil_idx" ON "guardians"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_ward_guardian_type_unique" ON "guardians"("wardId", "guardianId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_houseHeadId_unique" ON "polygamous_houses"("houseHeadId");

-- CreateIndex
CREATE INDEX "polygamous_houses_familyId_idx" ON "polygamous_houses"("familyId");

-- CreateIndex
CREATE INDEX "polygamous_houses_courtRecognized_idx" ON "polygamous_houses"("courtRecognized");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_family_houseName_unique" ON "polygamous_houses"("familyId", "houseName");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_family_houseOrder_unique" ON "polygamous_houses"("familyId", "houseOrder");

-- CreateIndex
CREATE INDEX "legal_dependants_deceasedId_idx" ON "legal_dependants"("deceasedId");

-- CreateIndex
CREATE INDEX "legal_dependants_dependantId_idx" ON "legal_dependants"("dependantId");

-- CreateIndex
CREATE INDEX "legal_dependants_isClaimant_idx" ON "legal_dependants"("isClaimant");

-- CreateIndex
CREATE INDEX "legal_dependants_dependencyLevel_idx" ON "legal_dependants"("dependencyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "legal_dependants_deceased_dependant_unique" ON "legal_dependants"("deceasedId", "dependantId");

-- CreateIndex
CREATE INDEX "dependant_evidence_dependantId_idx" ON "dependant_evidence"("dependantId");

-- CreateIndex
CREATE INDEX "family_legal_events_family_event_createdAt_idx" ON "family_legal_events"("familyId", "eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "estates_deceasedId_unique" ON "estates"("deceasedId");

-- CreateIndex
CREATE UNIQUE INDEX "estates_deceasedNatId_unique" ON "estates"("deceasedNationalId");

-- CreateIndex
CREATE UNIQUE INDEX "estates_deathCert_unique" ON "estates"("deceasedDeathCertNumber");

-- CreateIndex
CREATE UNIQUE INDEX "estates_successionCaseId_key" ON "estates"("successionCaseId");

-- CreateIndex
CREATE INDEX "estates_deceasedId_idx" ON "estates"("deceasedId");

-- CreateIndex
CREATE INDEX "estates_deceasedNationalId_idx" ON "estates"("deceasedNationalId");

-- CreateIndex
CREATE INDEX "estates_deathCertNumber_idx" ON "estates"("deceasedDeathCertNumber");

-- CreateIndex
CREATE INDEX "estates_isFrozen_idx" ON "estates"("isFrozen");

-- CreateIndex
CREATE INDEX "estates_testate_intestate_idx" ON "estates"("isTestate", "isIntestate");

-- CreateIndex
CREATE INDEX "estates_createdAt_idx" ON "estates"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wills_probateCase_unique" ON "wills"("probateCaseNumber");

-- CreateIndex
CREATE INDEX "wills_testator_status_idx" ON "wills"("testatorId", "status");

-- CreateIndex
CREATE INDEX "wills_active_revoked_idx" ON "wills"("isActive", "isRevoked");

-- CreateIndex
CREATE INDEX "wills_status_deletedAt_idx" ON "wills"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "wills_probateCaseNumber_idx" ON "wills"("probateCaseNumber");

-- CreateIndex
CREATE INDEX "wills_type_idx" ON "wills"("type");

-- CreateIndex
CREATE INDEX "wills_legalCapacityStatus_idx" ON "wills"("legalCapacityStatus");

-- CreateIndex
CREATE INDEX "wills_createdAt_idx" ON "wills"("createdAt");

-- CreateIndex
CREATE INDEX "codicils_willId_idx" ON "codicils"("willId");

-- CreateIndex
CREATE INDEX "codicils_codicilDate_idx" ON "codicils"("codicilDate");

-- CreateIndex
CREATE INDEX "will_executors_willId_idx" ON "will_executors"("willId");

-- CreateIndex
CREATE INDEX "will_executors_executorId_idx" ON "will_executors"("executorId");

-- CreateIndex
CREATE INDEX "will_executors_primary_status_idx" ON "will_executors"("isPrimary", "status");

-- CreateIndex
CREATE INDEX "will_executors_eligibilityStatus_idx" ON "will_executors"("eligibilityStatus");

-- CreateIndex
CREATE INDEX "will_executors_status_idx" ON "will_executors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "will_executors_will_executor_unique" ON "will_executors"("willId", "executorId");

-- CreateIndex
CREATE INDEX "will_witnesses_willId_idx" ON "will_witnesses"("willId");

-- CreateIndex
CREATE INDEX "will_witnesses_witnessId_idx" ON "will_witnesses"("witnessId");

-- CreateIndex
CREATE INDEX "will_witnesses_witnessType_idx" ON "will_witnesses"("witnessType");

-- CreateIndex
CREATE INDEX "will_witnesses_eligibilityStatus_idx" ON "will_witnesses"("eligibilityStatus");

-- CreateIndex
CREATE INDEX "will_witnesses_status_idx" ON "will_witnesses"("status");

-- CreateIndex
CREATE INDEX "will_witnesses_idNumber_idx" ON "will_witnesses"("idNumber");

-- CreateIndex
CREATE INDEX "assets_estate_type_idx" ON "assets"("estateId", "type");

-- CreateIndex
CREATE INDEX "assets_owner_verification_idx" ON "assets"("ownerId", "verificationStatus");

-- CreateIndex
CREATE INDEX "assets_isMatrimonialProperty_idx" ON "assets"("isMatrimonialProperty");

-- CreateIndex
CREATE INDEX "assets_hasLifeInterest_idx" ON "assets"("hasLifeInterest");

-- CreateIndex
CREATE INDEX "assets_requiresProbate_idx" ON "assets"("requiresProbate");

-- CreateIndex
CREATE INDEX "assets_type_isActive_idx" ON "assets"("type", "isActive");

-- CreateIndex
CREATE INDEX "assets_county_subCounty_idx" ON "assets"("county", "subCounty");

-- CreateIndex
CREATE INDEX "assets_titleDeedNumber_idx" ON "assets"("titleDeedNumber");

-- CreateIndex
CREATE INDEX "assets_registrationNumber_idx" ON "assets"("registrationNumber");

-- CreateIndex
CREATE INDEX "assets_currentValue_idx" ON "assets"("currentValue");

-- CreateIndex
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "land_asset_details_assetId_unique" ON "land_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "land_asset_details_titleDeed_unique" ON "land_asset_details"("titleDeedNumber");

-- CreateIndex
CREATE INDEX "land_asset_details_titleDeed_idx" ON "land_asset_details"("titleDeedNumber");

-- CreateIndex
CREATE INDEX "land_asset_details_parcelNumber_idx" ON "land_asset_details"("parcelNumber");

-- CreateIndex
CREATE UNIQUE INDEX "financial_asset_details_assetId_unique" ON "financial_asset_details"("assetId");

-- CreateIndex
CREATE INDEX "financial_asset_details_institutionName_idx" ON "financial_asset_details"("institutionName");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_asset_details_assetId_unique" ON "vehicle_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_asset_details_regNumber_unique" ON "vehicle_asset_details"("registrationNumber");

-- CreateIndex
CREATE INDEX "vehicle_asset_details_regNumber_idx" ON "vehicle_asset_details"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "business_asset_details_assetId_unique" ON "business_asset_details"("assetId");

-- CreateIndex
CREATE INDEX "business_asset_details_businessName_idx" ON "business_asset_details"("businessName");

-- CreateIndex
CREATE INDEX "business_asset_details_regNumber_idx" ON "business_asset_details"("registrationNumber");

-- CreateIndex
CREATE INDEX "asset_co_owners_assetId_idx" ON "asset_co_owners"("assetId");

-- CreateIndex
CREATE INDEX "asset_co_owners_userId_idx" ON "asset_co_owners"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_co_owners_asset_user_unique" ON "asset_co_owners"("assetId", "userId");

-- CreateIndex
CREATE INDEX "asset_valuations_asset_date_idx" ON "asset_valuations"("assetId", "valuationDate");

-- CreateIndex
CREATE INDEX "asset_valuations_date_purpose_idx" ON "asset_valuations"("valuationDate", "purpose");

-- CreateIndex
CREATE INDEX "debts_estate_status_idx" ON "debts"("estateId", "status");

-- CreateIndex
CREATE INDEX "debts_assetId_idx" ON "debts"("assetId");

-- CreateIndex
CREATE INDEX "debts_type_priority_idx" ON "debts"("type", "priority");

-- CreateIndex
CREATE INDEX "debts_dueDate_idx" ON "debts"("dueDate");

-- CreateIndex
CREATE INDEX "debts_isSecured_idx" ON "debts"("isSecured");

-- CreateIndex
CREATE INDEX "debts_isStatuteBarred_idx" ON "debts"("isStatuteBarred");

-- CreateIndex
CREATE INDEX "debts_creditorName_idx" ON "debts"("creditorName");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_will_asset_idx" ON "beneficiary_assignments"("willId", "assetId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_beneficiaryType_idx" ON "beneficiary_assignments"("beneficiaryType");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_userId_idx" ON "beneficiary_assignments"("userId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_familyMemberId_idx" ON "beneficiary_assignments"("familyMemberId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_isDependant_idx" ON "beneficiary_assignments"("isDependant");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_distributionStatus_idx" ON "beneficiary_assignments"("distributionStatus");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_priority_idx" ON "beneficiary_assignments"("priority");

-- CreateIndex
CREATE INDEX "disinheritance_records_willId_idx" ON "disinheritance_records"("willId");

-- CreateIndex
CREATE INDEX "disinheritance_records_memberId_idx" ON "disinheritance_records"("disinheritedMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "disinheritance_records_will_member_unique" ON "disinheritance_records"("willId", "disinheritedMemberId");

-- CreateIndex
CREATE INDEX "gifts_inter_vivos_estate_recipient_idx" ON "gifts_inter_vivos"("estateId", "recipientId");

-- CreateIndex
CREATE INDEX "gifts_inter_vivos_dateOfGift_idx" ON "gifts_inter_vivos"("dateOfGift");

-- CreateIndex
CREATE INDEX "gifts_inter_vivos_isAdvancement_idx" ON "gifts_inter_vivos"("isAdvancement");

-- CreateIndex
CREATE INDEX "heir_shares_estateId_idx" ON "heir_shares"("estateId");

-- CreateIndex
CREATE INDEX "heir_shares_heirId_idx" ON "heir_shares"("heirId");

-- CreateIndex
CREATE INDEX "heir_shares_sectionApplied_idx" ON "heir_shares"("sectionApplied");

-- CreateIndex
CREATE INDEX "heir_shares_distributionStatus_idx" ON "heir_shares"("distributionStatus");

-- CreateIndex
CREATE INDEX "heir_shares_shareValue_idx" ON "heir_shares"("computedShareValueKES");

-- CreateIndex
CREATE UNIQUE INDEX "heir_shares_estate_heir_unique" ON "heir_shares"("estateId", "heirId");

-- CreateIndex
CREATE UNIQUE INDEX "inheritance_computations_estateId_unique" ON "inheritance_computations"("estateId");

-- CreateIndex
CREATE INDEX "inheritance_computations_estate_date_idx" ON "inheritance_computations"("estateId", "computationDate");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_estateId_unique" ON "estate_tax_compliance"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_kraPin_unique" ON "estate_tax_compliance"("kraPin");

-- CreateIndex
CREATE INDEX "asset_liquidations_assetId_idx" ON "asset_liquidations"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "succession_cases_estateId_unique" ON "succession_cases"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "succession_cases_caseNumber_unique" ON "succession_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "succession_cases_court_workload_idx" ON "succession_cases"("courtStation", "status", "filingDate");

-- CreateIndex
CREATE INDEX "succession_cases_applicant_status_idx" ON "succession_cases"("applicantUserId", "status");

-- CreateIndex
CREATE INDEX "succession_cases_county_status_idx" ON "succession_cases"("courtCounty", "status");

-- CreateIndex
CREATE INDEX "succession_cases_status_priority_idx" ON "succession_cases"("status", "priority");

-- CreateIndex
CREATE INDEX "succession_cases_court_filingDate_idx" ON "succession_cases"("courtStation", "filingDate");

-- CreateIndex
CREATE INDEX "succession_cases_applicantUserId_idx" ON "succession_cases"("applicantUserId");

-- CreateIndex
CREATE INDEX "succession_cases_caseNumber_idx" ON "succession_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "succession_cases_estateId_idx" ON "succession_cases"("estateId");

-- CreateIndex
CREATE INDEX "succession_cases_filingDate_idx" ON "succession_cases"("filingDate");

-- CreateIndex
CREATE INDEX "succession_cases_status_createdAt_idx" ON "succession_cases"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "grants_caseId_unique" ON "grants"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "grants_grantNumber_unique" ON "grants"("grantNumber");

-- CreateIndex
CREATE INDEX "grants_grantNumber_idx" ON "grants"("grantNumber");

-- CreateIndex
CREATE INDEX "grants_status_issueDate_idx" ON "grants"("status", "issueDate");

-- CreateIndex
CREATE INDEX "grants_caseId_idx" ON "grants"("caseId");

-- CreateIndex
CREATE INDEX "grants_administratorUserId_idx" ON "grants"("administratorUserId");

-- CreateIndex
CREATE INDEX "gazette_notices_deadline_case_idx" ON "gazette_notices"("objectionDeadline", "caseId");

-- CreateIndex
CREATE INDEX "gazette_notices_date_type_idx" ON "gazette_notices"("gazetteDate", "noticeType");

-- CreateIndex
CREATE INDEX "gazette_notices_case_date_idx" ON "gazette_notices"("caseId", "gazetteDate");

-- CreateIndex
CREATE INDEX "gazette_notices_objectionDeadline_idx" ON "gazette_notices"("objectionDeadline");

-- CreateIndex
CREATE INDEX "objections_case_status_idx" ON "objections"("caseId", "status");

-- CreateIndex
CREATE INDEX "objections_filedDate_idx" ON "objections"("filedDate");

-- CreateIndex
CREATE INDEX "objections_objectorName_idx" ON "objections"("objectorName");

-- CreateIndex
CREATE INDEX "objections_status_filedDate_idx" ON "objections"("status", "filedDate");

-- CreateIndex
CREATE UNIQUE INDEX "hearings_hearingNumber_unique" ON "hearings"("hearingNumber");

-- CreateIndex
CREATE INDEX "hearings_case_date_idx" ON "hearings"("caseId", "hearingDate");

-- CreateIndex
CREATE INDEX "hearings_date_status_idx" ON "hearings"("hearingDate", "status");

-- CreateIndex
CREATE INDEX "hearings_court_date_idx" ON "hearings"("courtStation", "hearingDate");

-- CreateIndex
CREATE INDEX "hearings_hearingNumber_idx" ON "hearings"("hearingNumber");

-- CreateIndex
CREATE INDEX "hearings_complianceDeadline_idx" ON "hearings"("complianceDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "court_orders_orderReference_unique" ON "court_orders"("orderReference");

-- CreateIndex
CREATE INDEX "court_orders_caseId_idx" ON "court_orders"("caseId");

-- CreateIndex
CREATE INDEX "court_orders_orderReference_idx" ON "court_orders"("orderReference");

-- CreateIndex
CREATE INDEX "court_orders_orderDate_idx" ON "court_orders"("orderDate");

-- CreateIndex
CREATE INDEX "court_filings_case_formType_idx" ON "court_filings"("caseId", "formType");

-- CreateIndex
CREATE INDEX "court_filings_filingDate_idx" ON "court_filings"("filingDate");

-- CreateIndex
CREATE INDEX "disputes_case_status_idx" ON "disputes"("caseId", "status");

-- CreateIndex
CREATE INDEX "disputes_disputantId_idx" ON "disputes"("disputantId");

-- CreateIndex
CREATE INDEX "disputes_type_status_idx" ON "disputes"("type", "status");

-- CreateIndex
CREATE INDEX "creditor_claims_case_status_idx" ON "creditor_claims"("caseId", "status");

-- CreateIndex
CREATE INDEX "creditor_claims_priority_status_idx" ON "creditor_claims"("priority", "status");

-- CreateIndex
CREATE INDEX "creditor_claims_isStatuteBarred_idx" ON "creditor_claims"("isStatuteBarred");

-- CreateIndex
CREATE INDEX "creditor_claims_creditorName_idx" ON "creditor_claims"("creditorName");

-- CreateIndex
CREATE INDEX "creditor_claims_filedDate_idx" ON "creditor_claims"("filedDate");

-- CreateIndex
CREATE INDEX "creditor_claims_isSecured_idx" ON "creditor_claims"("isSecured");

-- CreateIndex
CREATE INDEX "claim_payments_claim_date_idx" ON "claim_payments"("creditorClaimId", "paymentDate");

-- CreateIndex
CREATE INDEX "claim_payments_paymentDate_idx" ON "claim_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "estate_inventories_case_date_idx" ON "estate_inventories"("caseId", "inventoryDate");

-- CreateIndex
CREATE INDEX "estate_inventories_assetId_idx" ON "estate_inventories"("assetId");

-- CreateIndex
CREATE INDEX "estate_inventories_submitted_idx" ON "estate_inventories"("submittedToCourtAt");

-- CreateIndex
CREATE UNIQUE INDEX "estate_accounting_caseId_unique" ON "estate_accountings"("caseId");

-- CreateIndex
CREATE INDEX "executor_duties_case_status_idx" ON "executor_duties"("caseId", "status");

-- CreateIndex
CREATE INDEX "executor_duties_executor_deadline_idx" ON "executor_duties"("executorUserId", "deadline");

-- CreateIndex
CREATE INDEX "executor_duties_status_priority_idx" ON "executor_duties"("status", "priority");

-- CreateIndex
CREATE INDEX "executor_duties_deadline_idx" ON "executor_duties"("deadline");

-- CreateIndex
CREATE INDEX "executor_duties_type_idx" ON "executor_duties"("type");

-- CreateIndex
CREATE INDEX "beneficiary_entitlements_case_status_idx" ON "beneficiary_entitlements"("caseId", "distributionStatus");

-- CreateIndex
CREATE INDEX "beneficiary_entitlements_entitlementBasis_idx" ON "beneficiary_entitlements"("entitlementBasis");

-- CreateIndex
CREATE INDEX "beneficiary_entitlements_distributionStatus_idx" ON "beneficiary_entitlements"("distributionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_entitlements_case_beneficiary_unique" ON "beneficiary_entitlements"("caseId", "beneficiaryId");

-- CreateIndex
CREATE INDEX "distribution_schedules_case_completed_idx" ON "distribution_schedules"("caseId", "isCompleted");

-- CreateIndex
CREATE INDEX "distribution_schedules_status_dueDate_idx" ON "distribution_schedules"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_schedules_case_step_unique" ON "distribution_schedules"("caseId", "stepOrder");

-- CreateIndex
CREATE INDEX "asset_transmissions_case_status_idx" ON "asset_transmissions"("caseId", "status");

-- CreateIndex
CREATE INDEX "asset_transmissions_status_scheduled_idx" ON "asset_transmissions"("status", "scheduledDate");

-- CreateIndex
CREATE INDEX "asset_transmissions_grantId_idx" ON "asset_transmissions"("grantId");

-- CreateIndex
CREATE INDEX "asset_transmissions_assetId_idx" ON "asset_transmissions"("assetId");

-- CreateIndex
CREATE INDEX "asset_transmissions_beneficiaryId_idx" ON "asset_transmissions"("beneficiaryId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_transmissions_unique_transfer" ON "asset_transmissions"("assetId", "beneficiaryId", "grantId");

-- CreateIndex
CREATE UNIQUE INDEX "gazette_integrations_gazetteReference_unique" ON "gazette_integrations"("gazetteReference");

-- CreateIndex
CREATE INDEX "gazette_integrations_case_status_idx" ON "gazette_integrations"("caseId", "publicationStatus");

-- CreateIndex
CREATE INDEX "court_integration_queue_case_status_type_idx" ON "court_integration_queue"("caseId", "status", "integrationType");

-- CreateIndex
CREATE INDEX "court_integration_queue_status_retry_idx" ON "court_integration_queue"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "dependant_provision_orders_orderNumber_unique" ON "dependant_provision_orders"("courtOrderNumber");

-- CreateIndex
CREATE INDEX "dependant_provision_orders_case_dependant_idx" ON "dependant_provision_orders"("caseId", "dependantId");

-- CreateIndex
CREATE INDEX "debt_priority_schedules_case_priority_idx" ON "debt_priority_schedules"("caseId", "priorityOrder");

-- CreateIndex
CREATE UNIQUE INDEX "court_processing_metrics_station_month_unique" ON "court_processing_metrics"("courtStation", "monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_unique" ON "notification_templates"("name");

-- CreateIndex
CREATE INDEX "notifications_recipient_status_idx" ON "notifications"("recipientId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "_WitnessIdentityDocuments_B_index" ON "_WitnessIdentityDocuments"("B");

-- CreateIndex
CREATE INDEX "_AssetInventoryEntries_B_index" ON "_AssetInventoryEntries"("B");

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
ALTER TABLE "families" ADD CONSTRAINT "families_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse1Id_fkey" FOREIGN KEY ("spouse1Id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse2Id_fkey" FOREIGN KEY ("spouse2Id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polygamous_houses" ADD CONSTRAINT "polygamous_houses_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polygamous_houses" ADD CONSTRAINT "polygamous_houses_houseHeadId_fkey" FOREIGN KEY ("houseHeadId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependant_evidence" ADD CONSTRAINT "dependant_evidence_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "legal_dependants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_legal_events" ADD CONSTRAINT "family_legal_events_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_testatorId_fkey" FOREIGN KEY ("testatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "wills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codicils" ADD CONSTRAINT "codicils_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_lifeInterestHolderId_fkey" FOREIGN KEY ("lifeInterestHolderId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_asset_details" ADD CONSTRAINT "land_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_asset_details" ADD CONSTRAINT "financial_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_asset_details" ADD CONSTRAINT "vehicle_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_asset_details" ADD CONSTRAINT "business_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_alternateAssignmentId_fkey" FOREIGN KEY ("alternateAssignmentId") REFERENCES "beneficiary_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_disinheritedMemberId_fkey" FOREIGN KEY ("disinheritedMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts_inter_vivos" ADD CONSTRAINT "gifts_inter_vivos_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts_inter_vivos" ADD CONSTRAINT "gifts_inter_vivos_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heir_shares" ADD CONSTRAINT "heir_shares_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heir_shares" ADD CONSTRAINT "heir_shares_heirId_fkey" FOREIGN KEY ("heirId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inheritance_computations" ADD CONSTRAINT "inheritance_computations_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_tax_compliance" ADD CONSTRAINT "estate_tax_compliance_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_liquidations" ADD CONSTRAINT "asset_liquidations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "succession_cases" ADD CONSTRAINT "succession_cases_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_confirmedByCourtOrderId_fkey" FOREIGN KEY ("confirmedByCourtOrderId") REFERENCES "court_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gazette_notices" ADD CONSTRAINT "gazette_notices_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_orders" ADD CONSTRAINT "court_orders_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_filings" ADD CONSTRAINT "court_filings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_disputantId_fkey" FOREIGN KEY ("disputantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_securedAssetId_fkey" FOREIGN KEY ("securedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_filedByUserId_fkey" FOREIGN KEY ("filedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_payments" ADD CONSTRAINT "claim_payments_creditorClaimId_fkey" FOREIGN KEY ("creditorClaimId") REFERENCES "creditor_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_inventories" ADD CONSTRAINT "estate_inventories_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_inventories" ADD CONSTRAINT "estate_inventories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_accountings" ADD CONSTRAINT "estate_accountings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_duties" ADD CONSTRAINT "executor_duties_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_duties" ADD CONSTRAINT "executor_duties_executorUserId_fkey" FOREIGN KEY ("executorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_entitlements" ADD CONSTRAINT "beneficiary_entitlements_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_entitlements" ADD CONSTRAINT "beneficiary_entitlements_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_schedules" ADD CONSTRAINT "distribution_schedules_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transmissions" ADD CONSTRAINT "asset_transmissions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transmissions" ADD CONSTRAINT "asset_transmissions_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transmissions" ADD CONSTRAINT "asset_transmissions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transmissions" ADD CONSTRAINT "asset_transmissions_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gazette_integrations" ADD CONSTRAINT "gazette_integrations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_integration_queue" ADD CONSTRAINT "court_integration_queue_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependant_provision_orders" ADD CONSTRAINT "dependant_provision_orders_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_priority_schedules" ADD CONSTRAINT "debt_priority_schedules_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "succession_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "will_witnesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetInventoryEntries" ADD CONSTRAINT "_AssetInventoryEntries_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetInventoryEntries" ADD CONSTRAINT "_AssetInventoryEntries_B_fkey" FOREIGN KEY ("B") REFERENCES "estate_inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
