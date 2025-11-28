-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('ISSUED', 'CONFIRMED', 'REVOKED', 'EXPIRED', 'AMENDED', 'REPLACED');

-- CreateEnum
CREATE TYPE "ExecutorDutyType" AS ENUM ('FILE_INVENTORY', 'PAY_DEBTS', 'DISTRIBUTE_ASSETS', 'FILE_ACCOUNTS', 'OBTAIN_GRANT', 'NOTIFY_BENEFICIARIES', 'MANAGE_PROPERTY', 'SETTLE_TAXES', 'CLOSE_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED', 'EXTENDED');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('SECTION_83', 'SECTION_79', 'COURT_ORDER', 'WILL_PROVISION', 'CUSTOMARY_LAW');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SPOUSE', 'EX_SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEPCHILD', 'PARENT', 'SIBLING', 'HALF_SIBLING', 'GRANDCHILD', 'GRANDPARENT', 'NIECE_NEPHEW', 'AUNT_UNCLE', 'COUSIN', 'GUARDIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "MarriageType" AS ENUM ('CUSTOMARY', 'CHRISTIAN', 'CIVIL', 'ISLAMIC', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "GuardianAppointmentSource" AS ENUM ('FAMILY', 'COURT', 'WILL', 'CUSTOMARY_LAW');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE');

-- CreateEnum
CREATE TYPE "WillType" AS ENUM ('STANDARD', 'JOINT_WILL', 'MUTUAL_WILL', 'HOLOGRAPHIC', 'INTERNATIONAL', 'TESTAMENTARY_TRUST_WILL');

-- CreateEnum
CREATE TYPE "RevocationMethod" AS ENUM ('NEW_WILL', 'CODICIL', 'DESTRUCTION', 'COURT_ORDER', 'MARRIAGE', 'DIVORCE', 'OTHER');

-- CreateEnum
CREATE TYPE "WillStorageLocation" AS ENUM ('SAFE_DEPOSIT_BOX', 'LAWYER_OFFICE', 'HOME_SAFE', 'DIGITAL_VAULT', 'COURT_REGISTRY', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalCapacityStatus" AS ENUM ('ASSESSED_COMPETENT', 'ASSESSED_INCOMPETENT', 'PENDING_ASSESSMENT', 'MEDICAL_CERTIFICATION', 'COURT_DETERMINATION', 'SELF_DECLARATION');

-- CreateEnum
CREATE TYPE "WitnessType" AS ENUM ('REGISTERED_USER', 'EXTERNAL_INDIVIDUAL', 'PROFESSIONAL_WITNESS', 'COURT_OFFICER', 'NOTARY_PUBLIC');

-- CreateEnum
CREATE TYPE "WitnessVerificationMethod" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'BIRTH_CERTIFICATE', 'ALIEN_CARD', 'MILITARY_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "WitnessEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE_MINOR', 'INELIGIBLE_BENEFICIARY', 'INELIGIBLE_SPOUSE', 'INELIGIBLE_EXECUTOR', 'INELIGIBLE_RELATIONSHIP', 'INELIGIBLE_MENTAL_CAPACITY', 'INELIGIBLE_CRIMINAL_RECORD', 'PENDING_ELIGIBILITY_CHECK');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DIGITAL_SIGNATURE', 'WET_SIGNATURE', 'E_SIGNATURE', 'BIOMETRIC_SIGNATURE', 'WITNESS_MARK');

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
CREATE TYPE "GrantType" AS ENUM ('PROBATE', 'LETTERS_OF_ADMINISTRATION', 'LETTERS_OF_ADMINISTRATION_WITH_WILL', 'LIMITED_GRANT', 'SPECIAL_GRANT');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'CUSTOMARY_MARRIAGE', 'CIVIL_UNION');

-- CreateEnum
CREATE TYPE "KenyanCounty" AS ENUM ('BARINGO', 'BOMET', 'BUNGOMA', 'BUSIA', 'ELGEYO_MARAKWET', 'EMBU', 'GARISSA', 'HOMA_BAY', 'ISIOLO', 'KAJIADO', 'KAKAMEGA', 'KERICHO', 'KIAMBU', 'KILIFI', 'KIRINYAGA', 'KISII', 'KISUMU', 'KITUI', 'KWALE', 'LAIKIPIA', 'LAMU', 'MACHAKOS', 'MAKUENI', 'MANDERA', 'MARSABIT', 'MERU', 'MIGORI', 'MOMBASA', 'MURANGA', 'NAIROBI', 'NAKURU', 'NANDI', 'NAROK', 'NYAMIRA', 'NYANDARUA', 'NYERI', 'SAMBURU', 'SIAYA', 'TAITA_TAVETA', 'TANA_RIVER', 'THARAKA_NITHI', 'TRANS_NZOIA', 'TURKANA', 'UASIN_GISHU', 'VIHIGA', 'WAJIR', 'WEST_POKOT');

-- CreateEnum
CREATE TYPE "AssetVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "AssetEncumbranceType" AS ENUM ('MORTGAGE', 'CHARGE', 'LIEN', 'COURT_ORDER', 'FAMILY_CLAIM', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BeneficiaryType" AS ENUM ('USER', 'FAMILY_MEMBER', 'EXTERNAL', 'CHARITY', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "BequestPriority" AS ENUM ('PRIMARY', 'ALTERNATE', 'CONTINGENT');

-- CreateEnum
CREATE TYPE "KenyanRelationshipCategory" AS ENUM ('SPOUSE', 'CHILDREN', 'PARENTS', 'SIBLINGS', 'EXTENDED_FAMILY', 'NON_FAMILY');

-- CreateEnum
CREATE TYPE "DebtPriority" AS ENUM ('HIGHEST', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OUTSTANDING', 'PARTIALLY_PAID', 'SETTLED', 'WRITTEN_OFF', 'DISPUTED', 'STATUTE_BARRED');

-- CreateEnum
CREATE TYPE "KenyanTaxType" AS ENUM ('INCOME_TAX', 'CAPITAL_GAINS_TAX', 'STAMP_DUTY', 'WITHHOLDING_TAX', 'VALUE_ADDED_TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "ExecutorEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE_MINOR', 'INELIGIBLE_BANKRUPT', 'INELIGIBLE_CRIMINAL_RECORD', 'INELIGIBLE_NON_RESIDENT', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "ExecutorAppointmentType" AS ENUM ('TESTAMENTARY', 'COURT_APPOINTED', 'ADMINISTRATOR', 'SPECIAL_EXECUTOR');

-- CreateEnum
CREATE TYPE "ExecutorCompensationType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE_OF_ESTATE', 'HOURLY_RATE', 'STATUTORY_SCALE', 'NONE');

-- CreateEnum
CREATE TYPE "DependencyLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "InheritanceRights" AS ENUM ('FULL', 'PARTIAL', 'CUSTOMARY', 'NONE');

-- CreateEnum
CREATE TYPE "RelationshipGuardianshipType" AS ENUM ('TEMPORARY', 'PERMANENT', 'TESTAMENTARY', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "HearingType" AS ENUM ('MENTION', 'DIRECTIONS', 'HEARING', 'RULING', 'JUDGMENT', 'APPEAL', 'REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "HearingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ADJOURNED', 'CANCELLED', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT_FILING', 'FILED', 'GAZETTED', 'OBJECTION_PERIOD', 'OBJECTION_RECEIVED', 'HEARING_SCHEDULED', 'HEARING_COMPLETED', 'GRANT_ISSUED', 'CONFIRMATION_HEARING', 'CONFIRMED', 'APPEALED', 'CLOSED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('NORMAL', 'URGENT', 'EXPEDITED');

-- CreateEnum
CREATE TYPE "GazetteNoticeType" AS ENUM ('PROBATE', 'LETTERS_OF_ADMINISTRATION');

-- CreateEnum
CREATE TYPE "ObjectionStatus" AS ENUM ('PENDING', 'WITHDRAWN', 'DISMISSED', 'UPHELD');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'DISPUTED', 'PAID', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "ClaimPriority" AS ENUM ('PREFERRED', 'ORDINARY', 'SECURED', 'UNSECURED');

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
    "phoneNumber" TEXT,
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
    "ipAddress" TEXT,
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
    "ipAddress" TEXT,
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
    "clanName" TEXT,
    "subClan" TEXT,
    "ancestralHome" TEXT,
    "familyTotem" TEXT,
    "familyHeadId" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "livingMemberCount" INTEGER NOT NULL DEFAULT 0,
    "minorCount" INTEGER NOT NULL DEFAULT 0,
    "customaryMarriageCount" INTEGER NOT NULL DEFAULT 0,
    "polygamousMarriageCount" INTEGER NOT NULL DEFAULT 0,
    "hasCustomaryMarriage" BOOLEAN NOT NULL DEFAULT false,
    "hasPolygamousMarriage" BOOLEAN NOT NULL DEFAULT false,

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
CREATE TABLE "family_relationships" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "isAdopted" BOOLEAN NOT NULL DEFAULT false,
    "adoptionOrderNumber" TEXT,
    "isBiological" BOOLEAN NOT NULL DEFAULT true,
    "bornOutOfWedlock" BOOLEAN NOT NULL DEFAULT false,
    "clanRelationship" TEXT,
    "traditionalRole" TEXT,
    "isCustomaryAdoption" BOOLEAN NOT NULL DEFAULT false,
    "adoptionDate" TIMESTAMP(3),
    "guardianshipType" "RelationshipGuardianshipType",
    "courtOrderNumber" TEXT,
    "dependencyLevel" "DependencyLevel" NOT NULL DEFAULT 'NONE',
    "inheritanceRights" "InheritanceRights" NOT NULL DEFAULT 'FULL',
    "traditionalInheritanceWeight" DOUBLE PRECISION DEFAULT 1.0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationMethod" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "verificationDocuments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marriages" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "spouse1Id" TEXT NOT NULL,
    "spouse2Id" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "issuingAuthority" TEXT,
    "certificateIssueDate" TIMESTAMP(3),
    "registrationDistrict" TEXT,
    "divorceType" TEXT,
    "bridePricePaid" BOOLEAN NOT NULL DEFAULT false,
    "bridePriceAmount" DOUBLE PRECISION,
    "bridePriceCurrency" TEXT DEFAULT 'KES',
    "elderWitnesses" JSONB,
    "ceremonyLocation" TEXT,
    "traditionalCeremonyType" TEXT,
    "lobolaReceiptNumber" TEXT,
    "marriageElderContact" TEXT,
    "clanApproval" BOOLEAN NOT NULL DEFAULT false,
    "familyConsent" BOOLEAN NOT NULL DEFAULT false,
    "traditionalRitesPerformed" JSONB,
    "marriageOfficerName" TEXT,
    "marriageOfficerTitle" TEXT,
    "marriageOfficerRegistrationNumber" TEXT,
    "marriageOfficerReligiousDenomination" TEXT,
    "marriageOfficerLicenseNumber" TEXT,
    "marriageVenue" TEXT,
    "marriageCounty" TEXT,
    "marriageSubCounty" TEXT,
    "marriageDistrict" TEXT,
    "marriageGpsCoordinates" TEXT,
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
    "courtOrderNumber" TEXT,
    "courtName" TEXT,
    "caseNumber" TEXT,
    "issuingJudge" TEXT,
    "courtStation" TEXT,
    "conditions" JSONB,
    "reportingRequirements" JSONB,
    "restrictedPowers" JSONB,
    "specialInstructions" JSONB,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "reviewDate" TIMESTAMP(3),
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
    "ownershipShare" DOUBLE PRECISION NOT NULL,
    "county" "KenyanCounty",
    "subCounty" TEXT,
    "ward" TEXT,
    "village" TEXT,
    "landReferenceNumber" TEXT,
    "gpsCoordinates" JSONB,
    "titleDeedNumber" TEXT,
    "registrationNumber" TEXT,
    "kraPin" TEXT,
    "identificationDetails" JSONB,
    "currentValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3),
    "valuationSource" TEXT,
    "verificationStatus" "AssetVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceType" "AssetEncumbranceType",
    "encumbranceDetails" TEXT,
    "encumbranceAmount" DOUBLE PRECISION,
    "isMatrimonialProperty" BOOLEAN NOT NULL DEFAULT false,
    "acquiredDuringMarriage" BOOLEAN NOT NULL DEFAULT false,
    "spouseConsentRequired" BOOLEAN NOT NULL DEFAULT false,
    "hasLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestHolderId" TEXT,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresProbate" BOOLEAN NOT NULL DEFAULT true,
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
    "sharePercent" DOUBLE PRECISION NOT NULL,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_co_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_valuations" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "valuedBy" TEXT,
    "method" TEXT,
    "purpose" TEXT,
    "isRegisteredValuer" BOOLEAN NOT NULL DEFAULT false,
    "valuerRegistrationNumber" TEXT,
    "reportUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "DebtType" NOT NULL,
    "description" TEXT NOT NULL,
    "assetId" TEXT,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "outstandingBalance" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "taxType" "KenyanTaxType",
    "kraPin" TEXT,
    "taxPeriod" TEXT,
    "creditorName" TEXT NOT NULL,
    "creditorContact" TEXT,
    "creditorAddress" JSONB,
    "creditorAccountNumber" TEXT,
    "creditorKraPin" TEXT,
    "dueDate" TIMESTAMP(3),
    "interestRate" DOUBLE PRECISION,
    "interestType" TEXT,
    "compoundingFrequency" TEXT,
    "priority" "DebtPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DebtStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "statuteBarredDate" TIMESTAMP(3),
    "requiresCourtApproval" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalObtained" BOOLEAN NOT NULL DEFAULT false,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securityDetails" TEXT,
    "collateralDescription" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DOUBLE PRECISION,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "settlementMethod" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "incurredDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "paidBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "testatorId" TEXT NOT NULL,
    "type" "WillType" NOT NULL DEFAULT 'STANDARD',
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "legalCapacityStatus" "LegalCapacityStatus" NOT NULL DEFAULT 'PENDING_ASSESSMENT',
    "legalCapacityAssessment" JSONB,
    "legalCapacityAssessedBy" TEXT,
    "legalCapacityAssessedAt" TIMESTAMP(3),
    "medicalCertificationId" TEXT,
    "willDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "supersedes" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revocationMethod" "RevocationMethod",
    "revocationReason" TEXT,
    "funeralWishes" JSONB,
    "burialLocation" TEXT,
    "cremationInstructions" TEXT,
    "organDonation" BOOLEAN NOT NULL DEFAULT false,
    "organDonationDetails" TEXT,
    "residuaryClause" TEXT,
    "digitalAssetInstructions" JSONB,
    "specialInstructions" TEXT,
    "requiresWitnesses" BOOLEAN NOT NULL DEFAULT true,
    "witnessCount" INTEGER NOT NULL DEFAULT 0,
    "hasAllWitnesses" BOOLEAN NOT NULL DEFAULT false,
    "minimumWitnessesRequired" INTEGER NOT NULL DEFAULT 2,
    "isHolographic" BOOLEAN NOT NULL DEFAULT false,
    "isWrittenInTestatorsHand" BOOLEAN NOT NULL DEFAULT false,
    "hasTestatorSignature" BOOLEAN NOT NULL DEFAULT false,
    "signatureWitnessed" BOOLEAN NOT NULL DEFAULT false,
    "meetsKenyanFormalities" BOOLEAN NOT NULL DEFAULT false,
    "storageLocation" "WillStorageLocation",
    "storageDetails" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKeyId" TEXT,
    "probateCaseNumber" TEXT,
    "courtRegistry" TEXT,
    "grantOfProbateIssued" BOOLEAN NOT NULL DEFAULT false,
    "grantOfProbateDate" TIMESTAMP(3),
    "hasDependantProvision" BOOLEAN NOT NULL DEFAULT false,
    "dependantProvisionDetails" TEXT,
    "courtApprovedProvision" BOOLEAN NOT NULL DEFAULT false,
    "isActiveRecord" BOOLEAN NOT NULL DEFAULT true,
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
    "changeType" TEXT,
    "changedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isLegallySignificant" BOOLEAN NOT NULL DEFAULT false,
    "legalEvent" TEXT,
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
    "idNumber" TEXT,
    "kraPin" TEXT,
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "professionalQualification" TEXT,
    "practicingCertificateNumber" TEXT,
    "relationship" TEXT,
    "relationshipDuration" TEXT,
    "physicalAddress" JSONB,
    "postalAddress" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "orderOfPriority" INTEGER NOT NULL DEFAULT 1,
    "appointmentType" "ExecutorAppointmentType" NOT NULL DEFAULT 'TESTAMENTARY',
    "eligibilityStatus" "ExecutorEligibilityStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "eligibilityVerifiedAt" TIMESTAMP(3),
    "eligibilityVerifiedBy" TEXT,
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
    "isCompensated" BOOLEAN NOT NULL DEFAULT false,
    "compensationType" "ExecutorCompensationType" NOT NULL,
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
    "preferredContactMethod" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'English',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_duties" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
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
    "courtOrderNumber" TEXT,
    "previousDeadline" TIMESTAMP(3),
    "extensionReason" TEXT,
    "extendedBy" TEXT,
    "extensionDate" TIMESTAMP(3),
    "overdueNotificationsSent" INTEGER NOT NULL DEFAULT 0,
    "lastOverdueNotification" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_witnesses" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "witnessType" "WitnessType" NOT NULL,
    "witnessId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "idNumber" TEXT,
    "idType" "WitnessVerificationMethod",
    "idDocumentId" TEXT,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "isProfessionalWitness" BOOLEAN NOT NULL DEFAULT false,
    "professionalCapacity" TEXT,
    "professionalLicense" TEXT,
    "relationship" TEXT,
    "relationshipDuration" TEXT,
    "knowsTestatorWell" BOOLEAN NOT NULL DEFAULT true,
    "physicalAddress" JSONB,
    "residentialCounty" TEXT,
    "eligibilityStatus" "WitnessEligibilityStatus" NOT NULL DEFAULT 'PENDING_ELIGIBILITY_CHECK',
    "eligibilityVerifiedAt" TIMESTAMP(3),
    "eligibilityVerifiedBy" TEXT,
    "ineligibilityReason" TEXT,
    "status" "WitnessStatus" NOT NULL DEFAULT 'PENDING',
    "signedAt" TIMESTAMP(3),
    "signatureType" "SignatureType",
    "signatureData" TEXT,
    "signatureLocation" TEXT,
    "witnessingMethod" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationMethod" "WitnessVerificationMethod",
    "verificationNotes" TEXT,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "hasConflictOfInterest" BOOLEAN NOT NULL DEFAULT false,
    "conflictDetails" TEXT,
    "understandsObligation" BOOLEAN NOT NULL DEFAULT false,
    "obligationAcknowledgedAt" TIMESTAMP(3),
    "invitationSentAt" TIMESTAMP(3),
    "invitationMethod" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "responseReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_assignments" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "beneficiaryType" "BeneficiaryType" NOT NULL,
    "userId" TEXT,
    "familyMemberId" TEXT,
    "externalName" TEXT,
    "externalContact" TEXT,
    "externalIdentification" TEXT,
    "externalAddress" JSONB,
    "relationshipCategory" "KenyanRelationshipCategory" NOT NULL,
    "specificRelationship" TEXT,
    "isDependant" BOOLEAN NOT NULL DEFAULT false,
    "bequestType" "BequestType" NOT NULL DEFAULT 'SPECIFIC',
    "sharePercent" DOUBLE PRECISION,
    "specificAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "conditionType" "BequestConditionType" NOT NULL DEFAULT 'NONE',
    "conditionDetails" TEXT,
    "conditionMet" BOOLEAN,
    "conditionDeadline" TIMESTAMP(3),
    "hasLifeInterest" BOOLEAN NOT NULL DEFAULT false,
    "lifeInterestDuration" INTEGER,
    "lifeInterestEndsAt" TIMESTAMP(3),
    "alternateAssignmentId" TEXT,
    "alternateAssignmentid" TEXT,
    "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "distributionNotes" TEXT,
    "distributionMethod" TEXT,
    "isSubjectToDependantsProvision" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalObtained" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "bequestPriority" "BequestPriority" NOT NULL DEFAULT 'PRIMARY',
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
    "evidenceUrls" JSONB,
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
    "estateValue" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "administrationType" "GrantType",
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
    "estimatedValue" DOUBLE PRECISION,
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
    "grantType" "GrantType" NOT NULL,
    "issuedBy" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "caseNumber" TEXT,
    "fileReference" TEXT,
    "notes" TEXT,
    "status" "GrantStatus" NOT NULL DEFAULT 'ISSUED',
    "grantNumber" TEXT,
    "courtStation" TEXT,
    "confirmedBy" TEXT,
    "confirmationDate" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revocationDate" TIMESTAMP(3),
    "revocationReason" TEXT,
    "courtOrderNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "amendmentHistory" JSONB,
    "replacedByGrantId" TEXT,
    "replacementReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "probateCaseId" TEXT,

    CONSTRAINT "grants_of_administration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probate_cases" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "caseNumber" TEXT,
    "courtLevel" TEXT NOT NULL,
    "courtStation" TEXT NOT NULL,
    "courtCounty" "KenyanCounty" NOT NULL,
    "applicationType" "GrantType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'DRAFT_FILING',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "gazetteNoticeNumber" TEXT,
    "gazettePublicationDate" TIMESTAMP(3),
    "gazetteObjectionPeriodDays" INTEGER,
    "gazetteNoticeType" "GazetteNoticeType",
    "filingDate" TIMESTAMP(3),
    "filingFee" DOUBLE PRECISION,
    "filedBy" TEXT,
    "applicantId" TEXT,
    "applicantName" TEXT,
    "applicantRelationship" TEXT,
    "applicantContactInfo" TEXT,
    "lawyerName" TEXT,
    "lawyerFirm" TEXT,
    "lawyerContactInfo" TEXT,
    "grantId" TEXT,
    "inventoryId" TEXT,
    "closureDate" TIMESTAMP(3),
    "closureReason" TEXT,
    "closedBy" TEXT,
    "isExpedited" BOOLEAN NOT NULL DEFAULT false,
    "requiresConfirmationHearing" BOOLEAN NOT NULL DEFAULT false,
    "confirmationHearingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probate_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objections" (
    "id" TEXT NOT NULL,
    "probateCaseId" TEXT NOT NULL,
    "objectorName" TEXT NOT NULL,
    "objectorContact" TEXT,
    "objectorRelationship" TEXT,
    "grounds" JSONB,
    "supportingEvidence" TEXT,
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ObjectionStatus" NOT NULL DEFAULT 'PENDING',
    "hearingDate" TIMESTAMP(3),
    "outcomeNotes" TEXT,
    "objectorLawyerName" TEXT,
    "objectorLawyerFirm" TEXT,
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
CREATE TABLE "creditor_claims" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "creditorName" TEXT NOT NULL,
    "creditorContact" TEXT,
    "creditorKraPin" TEXT,
    "creditorAccountNumber" TEXT,
    "claimType" "DebtType" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ClaimPriority" NOT NULL,
    "amountClaimed" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "interestRate" DOUBLE PRECISION,
    "interestType" TEXT,
    "compoundingFrequency" TEXT,
    "dueDate" TIMESTAMP(3),
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "statuteBarredDate" TIMESTAMP(3),
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securityDetails" TEXT,
    "collateralDescription" TEXT,
    "securedAssetId" TEXT,
    "supportingDocumentId" TEXT,
    "supportingDocuments" JSONB,
    "courtCaseNumber" TEXT,
    "courtStation" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "filedByUserId" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "disputeResolvedAt" TIMESTAMP(3),
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "transactionReference" TEXT,
    "paymentNotes" TEXT,
    "requiresCourtApproval" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalObtained" BOOLEAN NOT NULL DEFAULT false,
    "courtApprovalDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creditor_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_payments" (
    "id" TEXT NOT NULL,
    "creditorClaimId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT,
    "paidBy" TEXT,
    "notes" TEXT,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "chequeNumber" TEXT,
    "mpesaReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_accountings" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "totalAssets" DOUBLE PRECISION NOT NULL,
    "totalLiabilities" DOUBLE PRECISION NOT NULL,
    "netEstateValue" DOUBLE PRECISION NOT NULL,
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
    "sharePercent" DOUBLE PRECISION,
    "fixedAmount" DOUBLE PRECISION,
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
    "fundsHeld" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testamentary_trusts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_hearings" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "hearingNumber" TEXT NOT NULL,
    "causeListNumber" TEXT,
    "courtStation" TEXT NOT NULL,
    "courtroom" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '10:00',
    "type" "HearingType" NOT NULL,
    "judgeName" TEXT,
    "presidedBy" TEXT,
    "status" "HearingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "virtualLink" TEXT,
    "minutesTaken" BOOLEAN NOT NULL DEFAULT false,
    "ordersIssued" BOOLEAN NOT NULL DEFAULT false,
    "adjournmentCount" INTEGER NOT NULL DEFAULT 0,
    "adjournmentReasons" JSONB,
    "outcomeNotes" TEXT,
    "outcome" JSONB,
    "complianceDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_hearings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
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
    "allowedViewers" JSONB,
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
    "mimeType" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "_EstateToWillExecutor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EstateToWillExecutor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WitnessIdentityDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WitnessIdentityDocuments_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "family_relationships_familyId_idx" ON "family_relationships"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_fromMemberId_toMemberId_type_key" ON "family_relationships"("fromMemberId", "toMemberId", "type");

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
CREATE INDEX "assets_type_verificationStatus_idx" ON "assets"("type", "verificationStatus");

-- CreateIndex
CREATE INDEX "assets_county_subCounty_idx" ON "assets"("county", "subCounty");

-- CreateIndex
CREATE INDEX "assets_titleDeedNumber_idx" ON "assets"("titleDeedNumber");

-- CreateIndex
CREATE INDEX "assets_isMatrimonialProperty_idx" ON "assets"("isMatrimonialProperty");

-- CreateIndex
CREATE INDEX "assets_hasLifeInterest_idx" ON "assets"("hasLifeInterest");

-- CreateIndex
CREATE INDEX "assets_requiresProbate_idx" ON "assets"("requiresProbate");

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
CREATE INDEX "asset_valuations_valuationDate_purpose_idx" ON "asset_valuations"("valuationDate", "purpose");

-- CreateIndex
CREATE INDEX "debts_ownerId_status_idx" ON "debts"("ownerId", "status");

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
CREATE INDEX "debt_payments_debtId_paymentDate_idx" ON "debt_payments"("debtId", "paymentDate");

-- CreateIndex
CREATE INDEX "debt_payments_paymentDate_idx" ON "debt_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "wills_testatorId_status_idx" ON "wills"("testatorId", "status");

-- CreateIndex
CREATE INDEX "wills_status_activatedAt_idx" ON "wills"("status", "activatedAt");

-- CreateIndex
CREATE INDEX "wills_type_idx" ON "wills"("type");

-- CreateIndex
CREATE INDEX "wills_legalCapacityStatus_idx" ON "wills"("legalCapacityStatus");

-- CreateIndex
CREATE INDEX "wills_isRevoked_idx" ON "wills"("isRevoked");

-- CreateIndex
CREATE INDEX "wills_deletedAt_idx" ON "wills"("deletedAt");

-- CreateIndex
CREATE INDEX "will_versions_willId_idx" ON "will_versions"("willId");

-- CreateIndex
CREATE INDEX "will_versions_createdAt_idx" ON "will_versions"("createdAt");

-- CreateIndex
CREATE INDEX "will_versions_isLegallySignificant_idx" ON "will_versions"("isLegallySignificant");

-- CreateIndex
CREATE UNIQUE INDEX "will_versions_willId_versionNumber_key" ON "will_versions"("willId", "versionNumber");

-- CreateIndex
CREATE INDEX "will_executors_willId_idx" ON "will_executors"("willId");

-- CreateIndex
CREATE INDEX "will_executors_executorId_idx" ON "will_executors"("executorId");

-- CreateIndex
CREATE INDEX "will_executors_isPrimary_status_idx" ON "will_executors"("isPrimary", "status");

-- CreateIndex
CREATE INDEX "will_executors_eligibilityStatus_idx" ON "will_executors"("eligibilityStatus");

-- CreateIndex
CREATE INDEX "will_executors_appointmentType_idx" ON "will_executors"("appointmentType");

-- CreateIndex
CREATE INDEX "executor_duties_estateId_status_idx" ON "executor_duties"("estateId", "status");

-- CreateIndex
CREATE INDEX "executor_duties_executorId_deadline_idx" ON "executor_duties"("executorId", "deadline");

-- CreateIndex
CREATE INDEX "executor_duties_status_priority_idx" ON "executor_duties"("status", "priority");

-- CreateIndex
CREATE INDEX "executor_duties_deadline_idx" ON "executor_duties"("deadline");

-- CreateIndex
CREATE INDEX "executor_duties_type_idx" ON "executor_duties"("type");

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
CREATE INDEX "beneficiary_assignments_willId_idx" ON "beneficiary_assignments"("willId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_assetId_idx" ON "beneficiary_assignments"("assetId");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_beneficiaryType_idx" ON "beneficiary_assignments"("beneficiaryType");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_isDependant_idx" ON "beneficiary_assignments"("isDependant");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_distributionStatus_idx" ON "beneficiary_assignments"("distributionStatus");

-- CreateIndex
CREATE INDEX "beneficiary_assignments_priority_idx" ON "beneficiary_assignments"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_assignments_willId_assetId_userId_key" ON "beneficiary_assignments"("willId", "assetId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_assignments_willId_assetId_familyMemberId_key" ON "beneficiary_assignments"("willId", "assetId", "familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_assignments_willId_assetId_externalName_key" ON "beneficiary_assignments"("willId", "assetId", "externalName");

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
CREATE UNIQUE INDEX "grants_of_administration_grantNumber_key" ON "grants_of_administration"("grantNumber");

-- CreateIndex
CREATE INDEX "grants_of_administration_estateId_applicantId_idx" ON "grants_of_administration"("estateId", "applicantId");

-- CreateIndex
CREATE INDEX "grants_of_administration_grantNumber_idx" ON "grants_of_administration"("grantNumber");

-- CreateIndex
CREATE INDEX "grants_of_administration_courtStation_idx" ON "grants_of_administration"("courtStation");

-- CreateIndex
CREATE INDEX "grants_of_administration_status_isActive_idx" ON "grants_of_administration"("status", "isActive");

-- CreateIndex
CREATE INDEX "grants_of_administration_issuedAt_idx" ON "grants_of_administration"("issuedAt");

-- CreateIndex
CREATE INDEX "grants_of_administration_expiresAt_idx" ON "grants_of_administration"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "probate_cases_caseNumber_key" ON "probate_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "probate_cases_estateId_status_idx" ON "probate_cases"("estateId", "status");

-- CreateIndex
CREATE INDEX "probate_cases_caseNumber_idx" ON "probate_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "probate_cases_courtStation_filingDate_idx" ON "probate_cases"("courtStation", "filingDate");

-- CreateIndex
CREATE INDEX "probate_cases_status_createdAt_idx" ON "probate_cases"("status", "createdAt");

-- CreateIndex
CREATE INDEX "probate_cases_applicantId_idx" ON "probate_cases"("applicantId");

-- CreateIndex
CREATE INDEX "probate_cases_filingDate_idx" ON "probate_cases"("filingDate");

-- CreateIndex
CREATE INDEX "objections_probateCaseId_status_idx" ON "objections"("probateCaseId", "status");

-- CreateIndex
CREATE INDEX "objections_filingDate_idx" ON "objections"("filingDate");

-- CreateIndex
CREATE INDEX "objections_objectorName_idx" ON "objections"("objectorName");

-- CreateIndex
CREATE INDEX "creditor_claims_estateId_status_idx" ON "creditor_claims"("estateId", "status");

-- CreateIndex
CREATE INDEX "creditor_claims_creditorName_idx" ON "creditor_claims"("creditorName");

-- CreateIndex
CREATE INDEX "creditor_claims_claimType_priority_idx" ON "creditor_claims"("claimType", "priority");

-- CreateIndex
CREATE INDEX "creditor_claims_dueDate_idx" ON "creditor_claims"("dueDate");

-- CreateIndex
CREATE INDEX "creditor_claims_isStatuteBarred_idx" ON "creditor_claims"("isStatuteBarred");

-- CreateIndex
CREATE INDEX "creditor_claims_isSecured_idx" ON "creditor_claims"("isSecured");

-- CreateIndex
CREATE INDEX "creditor_claims_filedByUserId_idx" ON "creditor_claims"("filedByUserId");

-- CreateIndex
CREATE INDEX "claim_payments_creditorClaimId_paymentDate_idx" ON "claim_payments"("creditorClaimId", "paymentDate");

-- CreateIndex
CREATE INDEX "claim_payments_paymentDate_idx" ON "claim_payments"("paymentDate");

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
CREATE UNIQUE INDEX "court_hearings_hearingNumber_key" ON "court_hearings"("hearingNumber");

-- CreateIndex
CREATE INDEX "court_hearings_caseId_date_idx" ON "court_hearings"("caseId", "date");

-- CreateIndex
CREATE INDEX "court_hearings_date_status_idx" ON "court_hearings"("date", "status");

-- CreateIndex
CREATE INDEX "court_hearings_courtStation_date_idx" ON "court_hearings"("courtStation", "date");

-- CreateIndex
CREATE INDEX "court_hearings_hearingNumber_idx" ON "court_hearings"("hearingNumber");

-- CreateIndex
CREATE INDEX "court_hearings_complianceDeadline_idx" ON "court_hearings"("complianceDeadline");

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

-- CreateIndex
CREATE INDEX "_EstateToWillExecutor_B_index" ON "_EstateToWillExecutor"("B");

-- CreateIndex
CREATE INDEX "_WitnessIdentityDocuments_B_index" ON "_WitnessIdentityDocuments"("B");

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
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "assets" ADD CONSTRAINT "assets_lifeInterestHolderId_fkey" FOREIGN KEY ("lifeInterestHolderId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_valuations" ADD CONSTRAINT "asset_valuations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_testatorId_fkey" FOREIGN KEY ("testatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_versions" ADD CONSTRAINT "will_versions_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_duties" ADD CONSTRAINT "executor_duties_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executor_duties" ADD CONSTRAINT "executor_duties_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_assignments" ADD CONSTRAINT "beneficiary_assignments_alternateAssignmentid_fkey" FOREIGN KEY ("alternateAssignmentid") REFERENCES "beneficiary_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "grants_of_administration" ADD CONSTRAINT "grants_of_administration_probateCaseId_fkey" FOREIGN KEY ("probateCaseId") REFERENCES "probate_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probate_cases" ADD CONSTRAINT "probate_cases_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probate_cases" ADD CONSTRAINT "probate_cases_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants_of_administration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probate_cases" ADD CONSTRAINT "probate_cases_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "estate_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objections" ADD CONSTRAINT "objections_probateCaseId_fkey" FOREIGN KEY ("probateCaseId") REFERENCES "probate_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_securedAssetId_fkey" FOREIGN KEY ("securedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_filedByUserId_fkey" FOREIGN KEY ("filedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_claims" ADD CONSTRAINT "creditor_claims_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_payments" ADD CONSTRAINT "claim_payments_creditorClaimId_fkey" FOREIGN KEY ("creditorClaimId") REFERENCES "creditor_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "court_hearings" ADD CONSTRAINT "court_hearings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "probate_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "_EstateToWillExecutor" ADD CONSTRAINT "_EstateToWillExecutor_A_fkey" FOREIGN KEY ("A") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EstateToWillExecutor" ADD CONSTRAINT "_EstateToWillExecutor_B_fkey" FOREIGN KEY ("B") REFERENCES "will_executors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "will_witnesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
