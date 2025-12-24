-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHERS');

-- CreateEnum
CREATE TYPE "RoadmapPhase" AS ENUM ('PRE_FILING', 'FILING_AND_GAZETTE', 'CONFIRMATION', 'DISTRIBUTION', 'CLOSED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('LOCKED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ProbateApplicationType" AS ENUM ('GRANT_OF_PROBATE', 'LETTERS_OF_ADMINISTRATION', 'SUMMARY_ADMINISTRATION', 'LIMITED_GRANT');

-- CreateEnum
CREATE TYPE "KenyanFormType" AS ENUM ('PA1_PETITION', 'PA5_PETITION_SUMMARY', 'PA80_PETITION_INTESTATE', 'PA12_AFFIDAVIT_MEANS', 'PA38_CONSENT', 'PA57_GUARANTEE', 'CHIEFS_LETTER_TEMPLATE');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DECLINED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "SuccessionRegime" AS ENUM ('TESTATE', 'INTESTATE', 'PARTIALLY_INTESTATE', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "SuccessionMarriageType" AS ENUM ('MONOGAMOUS', 'POLYGAMOUS', 'COHABITATION', 'SINGLE');

-- CreateEnum
CREATE TYPE "SuccessionReligion" AS ENUM ('STATUTORY', 'ISLAMIC', 'HINDU', 'AFRICAN_CUSTOMARY', 'CHRISTIAN');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "RiskSource" AS ENUM ('FAMILY_SERVICE', 'ESTATE_SERVICE', 'WILL_SERVICE', 'DOCUMENT_SERVICE', 'EXTERNAL_REGISTRY');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('IN_PROGRESS', 'READY_TO_FILE', 'BLOCKED');

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
CREATE TYPE "MarriageType" AS ENUM ('CIVIL', 'CHRISTIAN', 'CUSTOMARY', 'ISLAMIC', 'HINDU', 'OTHER');

-- CreateEnum
CREATE TYPE "MarriageEndReason" AS ENUM ('DEATH_OF_SPOUSE', 'DIVORCE', 'ANNULMENT', 'CUSTOMARY_DISSOLUTION', 'STILL_ACTIVE');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "KenyanRelationshipCategory" AS ENUM ('SPOUSE', 'CHILDREN', 'PARENTS', 'SIBLINGS', 'EXTENDED_FAMILY', 'NON_FAMILY');

-- CreateEnum
CREATE TYPE "DependencyLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "KenyanLawSection" AS ENUM ('S26_DEPENDANT_PROVISION', 'S29_DEPENDANTS', 'S35_SPOUSAL_CHILDS_SHARE', 'S40_POLY_GAMY', 'S45_DEBT_PRIORITY', 'S70_TESTAMENTARY_GUARDIAN', 'S71_COURT_GUARDIAN', 'S72_GUARDIAN_BOND', 'S73_GUARDIAN_ACCOUNTS', 'S83_EXECUTOR_DUTIES');

-- CreateEnum
CREATE TYPE "GuardianReportStatus" AS ENUM ('PENDING', 'DUE', 'SUBMITTED', 'APPROVED', 'OVERDUE', 'REJECTED');

-- CreateEnum
CREATE TYPE "GuardianshipStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'REVOKED', 'EXPIRED', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BondStatus" AS ENUM ('NOT_REQUIRED', 'REQUIRED_PENDING', 'POSTED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "GuardianRole" AS ENUM ('CARETAKER', 'PROPERTY_MANAGER', 'EDUCATIONAL_GUARDIAN', 'MEDICAL_CONSENT', 'LEGAL_REPRESENTATIVE', 'EMERGENCY', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "GuardianAssignmentStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'REVOKED', 'DECEASED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "GuardianshipJurisdiction" AS ENUM ('STATUTORY', 'ISLAMIC', 'CUSTOMARY', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "CompliancePeriod" AS ENUM ('QUARTER_1', 'QUARTER_2', 'QUARTER_3', 'QUARTER_4', 'ANNUAL', 'BIANNUAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "ComplianceCheckStatus" AS ENUM ('DRAFT', 'PENDING_SUBMISSION', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'AMENDMENT_REQUESTED', 'OVERDUE', 'EXTENSION_GRANTED', 'WAIVED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('ANNUAL_WELFARE', 'QUARTERLY_FINANCIAL', 'MEDICAL_UPDATE', 'EDUCATIONAL_PROGRESS', 'PROPERTY_MANAGEMENT', 'COURT_MANDATED', 'EMERGENCY_REPORT', 'CLOSING_REPORT');

-- CreateEnum
CREATE TYPE "GuardianAppointmentSource" AS ENUM ('WILL', 'COURT', 'FAMILY_AGREEMENT', 'CUSTOMARY_COUNCIL', 'EMERGENCY', 'MUTUAL');

-- CreateEnum
CREATE TYPE "GuardianshipTerminationReason" AS ENUM ('WARD_REACHED_MAJORITY', 'WARD_DECEASED', 'GUARDIAN_DECEASED', 'GUARDIAN_INCAPACITATED', 'COURT_REMOVAL', 'VOLUNTARY_RESIGNATION', 'WARD_REGAINED_CAPACITY', 'ADOPTION_FINALIZED', 'CUSTOMARY_TRANSFER');

-- CreateEnum
CREATE TYPE "AdoptionType" AS ENUM ('STATUTORY', 'CUSTOMARY', 'INTERNATIONAL', 'KINSHIP', 'FOSTER_TO_ADOPT', 'STEP_PARENT', 'RELATIVE');

-- CreateEnum
CREATE TYPE "AdoptionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'FINALIZED', 'REVOKED', 'ANNULED', 'APPEALED');

-- CreateEnum
CREATE TYPE "CohabitationType" AS ENUM ('COME_WE_STAY', 'LONG_TERM_PARTNERSHIP', 'DATING', 'ENGAGED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ParentalConsentStatus" AS ENUM ('CONSENTED', 'WITHHELD', 'UNKNOWN', 'DECEASED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CohabitationStability" AS ENUM ('STABLE', 'VOLATILE', 'ON_OFF', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RelationshipVerificationLevel" AS ENUM ('UNVERIFIED', 'PARTIALLY_VERIFIED', 'FULLY_VERIFIED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ConflictResolutionStatus" AS ENUM ('RESOLVED', 'PENDING', 'MEDIATION', 'COURT');

-- CreateEnum
CREATE TYPE "HouseEstablishmentType" AS ENUM ('CUSTOMARY', 'ISLAMIC', 'TRADITIONAL', 'COURT_RECOGNIZED');

-- CreateEnum
CREATE TYPE "HouseDissolutionReason" AS ENUM ('WIFE_DECEASED', 'WIFE_DIVORCED', 'HOUSE_MERGED', 'COURT_ORDER');

-- CreateEnum
CREATE TYPE "RelationshipVerificationMethod" AS ENUM ('DNA', 'DOCUMENT', 'FAMILY_CONSENSUS', 'COURT_ORDER', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "InheritanceRightLevel" AS ENUM ('FULL', 'LIMITED', 'NONE', 'DISPUTED');

-- CreateEnum
CREATE TYPE "RelationshipSupportType" AS ENUM ('FINANCIAL', 'HOUSING', 'MEDICAL', 'EDUCATIONAL', 'FULL_CARE');

-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('TESTAMENTARY', 'COURT_APPOINTED', 'CUSTOMARY', 'NATURAL_PARENT');

-- CreateEnum
CREATE TYPE "InheritanceRights" AS ENUM ('FULL', 'PARTIAL', 'CUSTOMARY', 'NONE', 'PENDING');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'FILED', 'OVERDUE', 'REJECTED');

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
CREATE TYPE "DebtTier" AS ENUM ('FUNERAL_EXPENSES', 'TESTAMENTARY_EXPENSES', 'SECURED_DEBTS', 'TAXES_RATES_WAGES', 'UNSECURED_GENERAL');

-- CreateEnum
CREATE TYPE "DebtPriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OUTSTANDING', 'PARTIALLY_PAID', 'SETTLED', 'WRITTEN_OFF', 'DISPUTED', 'STATUTE_BARRED');

-- CreateEnum
CREATE TYPE "ExecutorAppointmentType" AS ENUM ('TESTAMENTARY', 'COURT_APPOINTED', 'ADMINISTRATOR', 'SPECIAL_EXECUTOR');

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
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
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
    "nationalId" VARCHAR(20),
    "nationalIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "kraPin" VARCHAR(20),
    "passportNumber" VARCHAR(50),
    "birthCertNumber" VARCHAR(50),
    "hudumaNumber" VARCHAR(50),
    "dateOfBirth" TIMESTAMP(3),
    "dateOfBirthEstimated" BOOLEAN NOT NULL DEFAULT false,
    "gender" "Gender",
    "placeOfBirth" VARCHAR(100),
    "religion" VARCHAR(50),
    "tribe" VARCHAR(50),
    "languages" TEXT[],
    "isAlive" BOOLEAN NOT NULL DEFAULT true,
    "dateOfDeath" TIMESTAMP(3),
    "deathCertNo" VARCHAR(50),
    "causeOfDeath" VARCHAR(255),
    "burialLocation" VARCHAR(255),
    "isMissing" BOOLEAN NOT NULL DEFAULT false,
    "missingSince" TIMESTAMP(3),
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityType" TEXT,
    "disabilityPercentage" INTEGER,
    "isMentallyIncapacitated" BOOLEAN NOT NULL DEFAULT false,
    "medicalConditions" TEXT[],
    "lastMedicalCheck" TIMESTAMP(3),
    "educationLevel" TEXT,
    "occupation" TEXT,
    "employer" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "currentResidence" TEXT,
    "initiationRitesCompleted" BOOLEAN NOT NULL DEFAULT false,
    "clanRole" TEXT,
    "traditionalTitles" TEXT[],
    "profilePictureUrl" TEXT,
    "biometricData" JSONB,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationNotes" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "polygamousHouseId" UUID,
    "createdBy" UUID,
    "lastUpdatedBy" UUID,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polygamous_houses" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "houseName" VARCHAR(100) NOT NULL,
    "houseCode" VARCHAR(50) NOT NULL,
    "houseOrder" INTEGER NOT NULL,
    "houseHeadId" UUID,
    "originalWifeId" UUID NOT NULL,
    "currentWifeId" UUID,
    "establishedDate" TIMESTAMP(3) NOT NULL,
    "establishmentType" "HouseEstablishmentType" NOT NULL,
    "courtRecognized" BOOLEAN NOT NULL DEFAULT false,
    "recognitionDocumentId" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "houseAssets" JSONB,
    "distributionWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "specialAllocation" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dissolutionDate" TIMESTAMP(3),
    "dissolutionReason" "HouseDissolutionReason",
    "houseColor" TEXT,
    "houseSymbol" TEXT,
    "primaryResidence" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationNotes" TEXT,
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polygamous_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marriages" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "spouse1Id" UUID NOT NULL,
    "spouse2Id" UUID NOT NULL,
    "marriageType" "MarriageType" NOT NULL,
    "marriageStatus" "MarriageStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "endReason" "MarriageEndReason" NOT NULL DEFAULT 'STILL_ACTIVE',
    "registrationNumber" VARCHAR(100),
    "registrationDistrict" TEXT,
    "registeredBy" TEXT,
    "ceremonyLocation" TEXT,
    "ceremonyCounty" "KenyanCounty",
    "witnesses" TEXT[],
    "bridePricePaid" BOOLEAN NOT NULL DEFAULT false,
    "bridePriceAmount" DOUBLE PRECISION,
    "bridePaidInFull" BOOLEAN NOT NULL DEFAULT false,
    "customaryDetails" JSONB,
    "isPolygamous" BOOLEAN NOT NULL DEFAULT false,
    "polygamousHouseId" UUID,
    "marriageOrder" INTEGER,
    "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
    "marriageCertificateId" TEXT,
    "cohabitationAffidavitId" TEXT,
    "divorceDecreeId" TEXT,
    "prenuptialAgreement" BOOLEAN NOT NULL DEFAULT false,
    "jointProperty" BOOLEAN NOT NULL DEFAULT false,
    "isMarriageDissolved" BOOLEAN NOT NULL DEFAULT false,
    "dissolutionDate" TIMESTAMP(3),
    "dissolutionReason" TEXT,
    "waitingPeriodCompleted" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedBy" UUID,
    "verificationNotes" TEXT,
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
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
    "inverseType" "RelationshipType" NOT NULL,
    "isBiological" BOOLEAN NOT NULL DEFAULT true,
    "isLegal" BOOLEAN NOT NULL DEFAULT false,
    "isCustomary" BOOLEAN NOT NULL DEFAULT false,
    "isSpiritual" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verificationLevel" "RelationshipVerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationMethod" "RelationshipVerificationMethod",
    "verificationScore" INTEGER NOT NULL DEFAULT 0,
    "verifiedBy" UUID,
    "lastVerifiedAt" TIMESTAMP(3),
    "legalDocuments" TEXT[],
    "dnaTestId" TEXT,
    "dnaMatchPercentage" DOUBLE PRECISION,
    "courtOrderId" TEXT,
    "adoptionOrderId" TEXT,
    "guardianshipOrderId" TEXT,
    "customaryRecognition" BOOLEAN NOT NULL DEFAULT false,
    "clanRecognized" BOOLEAN NOT NULL DEFAULT false,
    "elderWitnesses" TEXT[],
    "traditionalRite" TEXT,
    "relationshipStrength" INTEGER NOT NULL DEFAULT 50,
    "closenessIndex" INTEGER NOT NULL DEFAULT 50,
    "contactFrequency" TEXT,
    "isFinancialDependent" BOOLEAN NOT NULL DEFAULT false,
    "isCareDependent" BOOLEAN NOT NULL DEFAULT false,
    "dependencyLevel" TEXT,
    "supportProvided" JSONB,
    "inheritanceRights" TEXT,
    "inheritancePercentage" DOUBLE PRECISION,
    "disinherited" BOOLEAN NOT NULL DEFAULT false,
    "disinheritanceReason" TEXT,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictResolutionStatus" "ConflictResolutionStatus",
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohabitation_records" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "partner1Id" UUID NOT NULL,
    "partner2Id" UUID NOT NULL,
    "relationshipType" "CohabitationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "relationshipStability" "CohabitationStability" NOT NULL DEFAULT 'UNKNOWN',
    "durationDays" INTEGER NOT NULL DEFAULT 0,
    "qualifiesForS29" BOOLEAN NOT NULL DEFAULT false,
    "minimumPeriodMet" BOOLEAN NOT NULL DEFAULT false,
    "sharedResidence" TEXT,
    "residenceCounty" "KenyanCounty",
    "isSeparateHousehold" BOOLEAN NOT NULL DEFAULT false,
    "affidavitId" UUID,
    "witnesses" TEXT[],
    "communityAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "familyAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "supportEvidence" JSONB,
    "jointFinancialAccounts" BOOLEAN NOT NULL DEFAULT false,
    "jointPropertyOwnership" BOOLEAN NOT NULL DEFAULT false,
    "financialSupportProvided" BOOLEAN NOT NULL DEFAULT false,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "childrenBornDuring" BOOLEAN NOT NULL DEFAULT false,
    "hasCourtRecognition" BOOLEAN NOT NULL DEFAULT false,
    "courtCaseNumber" TEXT,
    "dependencyClaimFiled" BOOLEAN NOT NULL DEFAULT false,
    "dependencyClaimId" UUID,
    "dependencyClaimStatus" TEXT,
    "customaryElements" BOOLEAN NOT NULL DEFAULT false,
    "clanInvolved" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verificationNotes" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cohabitation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_records" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "adopteeId" UUID NOT NULL,
    "adoptiveParentId" UUID NOT NULL,
    "adoptionType" "AdoptionType" NOT NULL,
    "adoptionStatus" "AdoptionStatus" NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "hearingDate" TIMESTAMP(3),
    "finalizationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "legalBasis" JSONB,
    "courtOrderNumber" VARCHAR(100),
    "courtStation" TEXT,
    "presidingJudge" TEXT,
    "parentalConsentStatus" JSONB NOT NULL,
    "consentDocuments" TEXT[],
    "clanInvolved" BOOLEAN NOT NULL DEFAULT false,
    "clanElders" JSONB,
    "customaryRites" TEXT[],
    "bridePriceConsideration" BOOLEAN NOT NULL DEFAULT false,
    "socialWorkerInfo" JSONB,
    "adoptionAgencyInfo" JSONB,
    "adoptionExpenses" DOUBLE PRECISION,
    "postAdoptionMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "monitoringPeriodMonths" INTEGER,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verificationNotes" TEXT,
    "verifiedBy" UUID,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "lastUpdatedBy" UUID NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardianships" (
    "id" UUID NOT NULL,
    "wardId" UUID NOT NULL,
    "wardFullName" VARCHAR(200) NOT NULL,
    "wardDateOfBirth" TIMESTAMP(3) NOT NULL,
    "status" "GuardianshipStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "type" TEXT NOT NULL,
    "jurisdiction" "GuardianshipJurisdiction" NOT NULL DEFAULT 'STATUTORY',
    "governingLaw" TEXT NOT NULL DEFAULT 'Children Act Cap 141',
    "caseNumber" VARCHAR(100),
    "courtOrder" JSONB,
    "requiresPropertyManagement" BOOLEAN NOT NULL DEFAULT false,
    "bondStatus" "BondStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "establishedDate" TIMESTAMP(3) NOT NULL,
    "terminatedDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "complianceSchedule" JSONB NOT NULL,
    "history" JSONB[],
    "legalNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardianships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_assignments" (
    "id" UUID NOT NULL,
    "guardianshipId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "guardianUserId" UUID,
    "role" "GuardianRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isAlternate" BOOLEAN NOT NULL DEFAULT false,
    "appointmentSource" "GuardianAppointmentSource" NOT NULL,
    "status" "GuardianAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "activationDate" TIMESTAMP(3),
    "deactivationDate" TIMESTAMP(3),
    "deactivationReason" TEXT,
    "powers" JSONB NOT NULL,
    "bond" JSONB,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "complianceScore" INTEGER NOT NULL DEFAULT 100,
    "lastActivityDate" TIMESTAMP(3),
    "conflicts" JSONB[],
    "contactInfo" JSONB NOT NULL,
    "digitalSignatureUrl" TEXT,
    "verificationMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardian_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" UUID NOT NULL,
    "guardianshipId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "reportingPeriod" "CompliancePeriod" NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "reportTitle" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "submissionDate" TIMESTAMP(3),
    "reviewedDate" TIMESTAMP(3),
    "acceptedDate" TIMESTAMP(3),
    "status" "ComplianceCheckStatus" NOT NULL DEFAULT 'DRAFT',
    "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "qualityScore" INTEGER NOT NULL DEFAULT 0,
    "validationErrors" JSONB,
    "sections" JSONB NOT NULL,
    "attachments" JSONB,
    "generatedSections" JSONB,
    "submissionMethods" JSONB,
    "submissionReferences" JSONB,
    "financialStatement" JSONB,
    "wardStatus" JSONB,
    "bankReconciliation" JSONB,
    "courtFeedback" JSONB,
    "recommendations" JSONB,
    "reminderHistory" JSONB,
    "followUpActions" JSONB,
    "submittedBy" UUID,
    "reviewedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_legal_events" (
    "id" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "eventType" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" UUID,

    CONSTRAINT "family_legal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" UUID NOT NULL,
    "deceasedId" UUID NOT NULL,
    "deceasedFullName" VARCHAR(200) NOT NULL,
    "deceasedDateOfDeath" TIMESTAMP(3),
    "isTestate" BOOLEAN NOT NULL DEFAULT false,
    "isIntestate" BOOLEAN NOT NULL DEFAULT false,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "frozenAt" TIMESTAMP(3),
    "grossValueKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiabilitiesKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netEstateValueKES" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hotchpotAdjustedValueKES" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
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
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceDetails" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "land_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "titleDeedNumber" VARCHAR(100) NOT NULL,
    "parcelNumber" VARCHAR(100),
    "county" "KenyanCounty" NOT NULL,
    "subCounty" TEXT,
    "acreage" DOUBLE PRECISION NOT NULL,
    "landUse" TEXT,

    CONSTRAINT "land_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "institutionName" VARCHAR(200) NOT NULL,
    "accountNumber" VARCHAR(100) NOT NULL,
    "accountType" VARCHAR(100) NOT NULL,
    "branchName" TEXT,

    CONSTRAINT "financial_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "registrationNumber" VARCHAR(20) NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "chassisNumber" TEXT,

    CONSTRAINT "vehicle_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_asset_details" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "businessName" VARCHAR(200) NOT NULL,
    "registrationNumber" TEXT,
    "sharePercentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "business_asset_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "source" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_co_owners" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "userId" UUID,
    "externalName" VARCHAR(200),
    "sharePercent" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "asset_co_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_liquidations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "liquidationType" VARCHAR(50) NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "actualAmount" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'KES',
    "buyerName" VARCHAR(200),
    "buyerIdNumber" VARCHAR(50),
    "saleDate" TIMESTAMP(3),
    "approvedByCourt" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderRef" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_tax_compliance" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "kraPin" VARCHAR(20),
    "incomeTaxPaid" BOOLEAN NOT NULL DEFAULT false,
    "capitalGainsTaxPaid" BOOLEAN NOT NULL DEFAULT false,
    "stampDutyPaid" BOOLEAN NOT NULL DEFAULT false,
    "taxClearanceCertificateNo" VARCHAR(100),
    "taxClearanceIssuedAt" TIMESTAMP(3),
    "lastKraSyncAt" TIMESTAMP(3),
    "kraSyncStatus" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estate_tax_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "priority" "DebtPriority" NOT NULL DEFAULT 'MEDIUM',
    "tier" "DebtTier" NOT NULL,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securedAssetId" UUID,
    "dueDate" TIMESTAMP(3),
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "status" "DebtStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "creditorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts_inter_vivos" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "valueAtGiftTimeKES" DOUBLE PRECISION NOT NULL,
    "dateOfGift" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "isSubjectToHotchpot" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_inter_vivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_dependants" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "deceasedId" UUID NOT NULL,
    "basisSection" "KenyanLawSection" NOT NULL,
    "dependencyLevel" "DependencyLevel" NOT NULL,
    "monthlyNeeds" DOUBLE PRECISION,
    "dependencyPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "custodialParentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependant_evidence" (
    "id" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "documentId" UUID,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dependant_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" UUID NOT NULL,
    "testatorId" UUID NOT NULL,
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "WillType" NOT NULL DEFAULT 'STANDARD',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revocationMethod" "RevocationMethod",
    "revokedAt" TIMESTAMP(3),
    "supersedesId" UUID,
    "funeralWishes" TEXT,
    "burialLocation" TEXT,
    "residuaryClause" TEXT,
    "probateCaseNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_executors" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "executorId" UUID,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "appointmentType" "ExecutorAppointmentType" NOT NULL DEFAULT 'TESTAMENTARY',

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_witnesses" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "witnessId" UUID,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "status" "WitnessStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "will_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_assignments" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "assetId" UUID,
    "isResiduary" BOOLEAN NOT NULL DEFAULT false,
    "sharePercentage" DOUBLE PRECISION,
    "specificAmount" DOUBLE PRECISION,
    "beneficiaryType" "BeneficiaryType" NOT NULL,
    "userId" UUID,
    "familyMemberId" UUID,
    "externalName" TEXT,
    "conditionType" "BequestConditionType" NOT NULL DEFAULT 'NONE',
    "conditionDetails" TEXT,
    "alternateAssignmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codicils" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "codicilDate" TIMESTAMP(3) NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codicils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disinheritance_records" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "disinheritedMemberId" UUID NOT NULL,
    "reason" TEXT,

    CONSTRAINT "disinheritance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_scenarios" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "scenarioName" VARCHAR(100) NOT NULL,
    "scenarioType" TEXT NOT NULL DEFAULT 'INTESTATE',
    "description" TEXT,
    "appliedLawSection" "KenyanLawSection" NOT NULL,
    "polygamousHouseCount" INTEGER NOT NULL DEFAULT 0,
    "totalNetValueKES" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribution_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "computed_share_details" (
    "id" UUID NOT NULL,
    "scenarioId" UUID NOT NULL,
    "heirId" UUID,
    "heirName" TEXT NOT NULL,
    "heirRelationship" TEXT NOT NULL,
    "finalSharePercent" DOUBLE PRECISION NOT NULL,
    "finalShareValueKES" DOUBLE PRECISION NOT NULL,
    "shareType" TEXT NOT NULL,
    "polygamousHouseId" UUID,

    CONSTRAINT "computed_share_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_assessments" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "contextRegime" "SuccessionRegime" NOT NULL,
    "contextMarriage" "SuccessionMarriageType" NOT NULL,
    "contextReligion" "SuccessionReligion" NOT NULL,
    "missingDocuments" JSONB,
    "blockingIssues" JSONB,
    "recommendedStrategy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readiness_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flags" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'HIGH',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mitigationSteps" TEXT,
    "source" "RiskSource" NOT NULL,
    "sourceId" UUID,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probate_applications" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "applicationType" "ProbateApplicationType" NOT NULL,
    "applicantUserId" UUID NOT NULL,
    "courtStation" VARCHAR(100) NOT NULL,
    "caseNumber" VARCHAR(100),
    "filingDate" TIMESTAMP(3),
    "formsGenerated" BOOLEAN NOT NULL DEFAULT false,
    "allConsentsReceived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_forms" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "formType" "KenyanFormType" NOT NULL,
    "s3Url" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "generated_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_consents" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "familyMemberId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "consentGivenAt" TIMESTAMP(3),
    "digitalSignatureId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_roadmaps" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "currentPhase" "RoadmapPhase" NOT NULL DEFAULT 'PRE_FILING',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" UUID NOT NULL,
    "roadmapId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dependsOnTaskId" UUID,
    "proofDocumentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "_FamilyCreator" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FamilyCreator_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FamilyMemberUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FamilyMemberUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CohabitationChildren" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CohabitationChildren_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE UNIQUE INDEX "family_members_userId_key" ON "family_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_nationalId_key" ON "family_members"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_kraPin_key" ON "family_members"("kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_houseCode_key" ON "polygamous_houses"("houseCode");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_houseHeadId_key" ON "polygamous_houses"("houseHeadId");

-- CreateIndex
CREATE UNIQUE INDEX "polygamous_houses_familyId_houseOrder_key" ON "polygamous_houses"("familyId", "houseOrder");

-- CreateIndex
CREATE UNIQUE INDEX "marriages_registrationNumber_key" ON "marriages"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_fromMemberId_toMemberId_type_key" ON "family_relationships"("fromMemberId", "toMemberId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_records_courtOrderNumber_key" ON "adoption_records"("courtOrderNumber");

-- CreateIndex
CREATE INDEX "adoption_records_familyId_idx" ON "adoption_records"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_checks_guardianshipId_year_reportingPeriod_key" ON "compliance_checks"("guardianshipId", "year", "reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "estates_deceasedId_unique" ON "estates"("deceasedId");

-- CreateIndex
CREATE INDEX "estates_deceasedId_idx" ON "estates"("deceasedId");

-- CreateIndex
CREATE INDEX "assets_estateId_type_idx" ON "assets"("estateId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "land_asset_details_assetId_key" ON "land_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_asset_details_assetId_key" ON "financial_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_asset_details_assetId_key" ON "vehicle_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_asset_details_registrationNumber_key" ON "vehicle_asset_details"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "business_asset_details_assetId_key" ON "business_asset_details"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_co_owners_assetId_userId_key" ON "asset_co_owners"("assetId", "userId");

-- CreateIndex
CREATE INDEX "asset_liquidations_assetId_idx" ON "asset_liquidations"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_estateId_key" ON "estate_tax_compliance"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_kraPin_key" ON "estate_tax_compliance"("kraPin");

-- CreateIndex
CREATE INDEX "debts_estateId_tier_idx" ON "debts"("estateId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "legal_dependants_estateId_dependantId_key" ON "legal_dependants"("estateId", "dependantId");

-- CreateIndex
CREATE INDEX "wills_testatorId_status_idx" ON "wills"("testatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_scenarios_estateId_scenarioName_key" ON "distribution_scenarios"("estateId", "scenarioName");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_assessments_estateId_key" ON "readiness_assessments"("estateId");

-- CreateIndex
CREATE INDEX "probate_applications_estateId_idx" ON "probate_applications"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "executor_roadmaps_estateId_key" ON "executor_roadmaps"("estateId");

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
CREATE INDEX "_FamilyCreator_B_index" ON "_FamilyCreator"("B");

-- CreateIndex
CREATE INDEX "_FamilyMemberUser_B_index" ON "_FamilyMemberUser"("B");

-- CreateIndex
CREATE INDEX "_CohabitationChildren_B_index" ON "_CohabitationChildren"("B");

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
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polygamous_houses" ADD CONSTRAINT "polygamous_houses_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polygamous_houses" ADD CONSTRAINT "polygamous_houses_houseHeadId_fkey" FOREIGN KEY ("houseHeadId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse1Id_fkey" FOREIGN KEY ("spouse1Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_spouse2Id_fkey" FOREIGN KEY ("spouse2Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marriages" ADD CONSTRAINT "marriages_polygamousHouseId_fkey" FOREIGN KEY ("polygamousHouseId") REFERENCES "polygamous_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohabitation_records" ADD CONSTRAINT "cohabitation_records_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohabitation_records" ADD CONSTRAINT "cohabitation_records_partner1Id_fkey" FOREIGN KEY ("partner1Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohabitation_records" ADD CONSTRAINT "cohabitation_records_partner2Id_fkey" FOREIGN KEY ("partner2Id") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_records" ADD CONSTRAINT "adoption_records_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_records" ADD CONSTRAINT "adoption_records_adopteeId_fkey" FOREIGN KEY ("adopteeId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_records" ADD CONSTRAINT "adoption_records_adoptiveParentId_fkey" FOREIGN KEY ("adoptiveParentId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardianships" ADD CONSTRAINT "guardianships_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_assignments" ADD CONSTRAINT "guardian_assignments_guardianshipId_fkey" FOREIGN KEY ("guardianshipId") REFERENCES "guardianships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_assignments" ADD CONSTRAINT "guardian_assignments_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_guardianshipId_fkey" FOREIGN KEY ("guardianshipId") REFERENCES "guardianships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_legal_events" ADD CONSTRAINT "family_legal_events_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "land_asset_details" ADD CONSTRAINT "land_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_asset_details" ADD CONSTRAINT "financial_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_asset_details" ADD CONSTRAINT "vehicle_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_asset_details" ADD CONSTRAINT "business_asset_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_liquidations" ADD CONSTRAINT "asset_liquidations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_tax_compliance" ADD CONSTRAINT "estate_tax_compliance_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_securedAssetId_fkey" FOREIGN KEY ("securedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts_inter_vivos" ADD CONSTRAINT "gifts_inter_vivos_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts_inter_vivos" ADD CONSTRAINT "gifts_inter_vivos_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_custodialParentId_fkey" FOREIGN KEY ("custodialParentId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependant_evidence" ADD CONSTRAINT "dependant_evidence_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "legal_dependants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_testatorId_fkey" FOREIGN KEY ("testatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "wills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_alternateAssignmentId_fkey" FOREIGN KEY ("alternateAssignmentId") REFERENCES "beneficiary_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codicils" ADD CONSTRAINT "codicils_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_disinheritedMemberId_fkey" FOREIGN KEY ("disinheritedMemberId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_scenarios" ADD CONSTRAINT "distribution_scenarios_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "computed_share_details" ADD CONSTRAINT "computed_share_details_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "distribution_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "readiness_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_forms" ADD CONSTRAINT "generated_forms_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "probate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_consents" ADD CONSTRAINT "family_consents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "probate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "executor_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "_FamilyCreator" ADD CONSTRAINT "_FamilyCreator_A_fkey" FOREIGN KEY ("A") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyCreator" ADD CONSTRAINT "_FamilyCreator_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberUser" ADD CONSTRAINT "_FamilyMemberUser_A_fkey" FOREIGN KEY ("A") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberUser" ADD CONSTRAINT "_FamilyMemberUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CohabitationChildren" ADD CONSTRAINT "_CohabitationChildren_A_fkey" FOREIGN KEY ("A") REFERENCES "cohabitation_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CohabitationChildren" ADD CONSTRAINT "_CohabitationChildren_B_fkey" FOREIGN KEY ("B") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_B_fkey" FOREIGN KEY ("B") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
