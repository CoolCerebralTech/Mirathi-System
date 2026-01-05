-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VERIFIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHERS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_UPLOAD', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('TITLE_DEED', 'NATIONAL_ID', 'DEATH_CERTIFICATE', 'BIRTH_CERTIFICATE', 'MARRIAGE_CERTIFICATE', 'KRA_PIN', 'OTHER');

-- CreateEnum
CREATE TYPE "RoadmapPhase" AS ENUM ('PRE_FILING', 'FILING', 'CONFIRMATION', 'DISTRIBUTION', 'CLOSURE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('LOCKED', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'WAIVED', 'BLOCKED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProbateApplicationType" AS ENUM ('GRANT_OF_PROBATE', 'LETTERS_OF_ADMINISTRATION', 'LETTERS_OF_ADMIN_WILL_ANNEXED', 'SUMMARY_ADMINISTRATION', 'LIMITED_GRANT_AD_LITEM', 'LIMITED_GRANT_COLLECTION', 'ISLAMIC_GRANT', 'CUSTOMARY_GRANT');

-- CreateEnum
CREATE TYPE "CourtJurisdiction" AS ENUM ('HIGH_COURT', 'MAGISTRATE_COURT', 'KADHIS_COURT', 'CUSTOMARY_COURT', 'FAMILY_DIVISION', 'COMMERCIAL_COURT');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "FilingConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'VERY_LOW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "RoadmapStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'BLOCKED', 'COMPLETED', 'ABANDONED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskTrigger" AS ENUM ('MANUAL', 'AUTOMATIC', 'EVENT_DRIVEN', 'SCHEDULED', 'READINESS_BASED');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('DOCUMENT_UPLOAD', 'DIGITAL_SIGNATURE', 'SMS_VERIFICATION', 'EMAIL_VERIFICATION', 'COURT_RECEIPT', 'BANK_SLIP', 'WITNESS_SIGNATURE', 'AFFIDAVIT');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('IDENTITY_VERIFICATION', 'FAMILY_STRUCTURE', 'GUARDIANSHIP', 'ASSET_DISCOVERY', 'DEBT_SETTLEMENT', 'DOCUMENT_COLLECTION', 'DOCUMENT_VALIDATION', 'CUSTOMARY_DOCUMENTS', 'FORM_GENERATION', 'FORM_REVIEW', 'SIGNATURE_COLLECTION', 'COURT_SELECTION', 'FEE_PAYMENT', 'LODGEMENT', 'GAZETTE_PUBLICATION', 'COURT_ATTENDANCE', 'GRANT_ISSUANCE', 'GRANT_CONFIRMATION', 'ASSET_TRANSFER', 'DEBT_PAYMENT', 'TAX_CLEARANCE', 'FINAL_ACCOUNTS', 'ESTATE_CLOSURE', 'BENEFICIARY_NOTIFICATION', 'WILL_SPECIFIC', 'ISLAMIC_SPECIFIC', 'POLYGAMOUS_SPECIFIC', 'MINOR_SPECIFIC', 'DISPUTE_RESOLUTION');

-- CreateEnum
CREATE TYPE "RiskSourceType" AS ENUM ('FAMILY_SERVICE', 'GUARDIANSHIP_SERVICE', 'MARRIAGE_SERVICE', 'ESTATE_SERVICE', 'WILL_SERVICE', 'ASSET_SERVICE', 'DEBT_SERVICE', 'COMPLIANCE_ENGINE', 'READINESS_ASSESSMENT', 'FORM_STRATEGY', 'DOCUMENT_SERVICE', 'KRA_SERVICE', 'LANDS_REGISTRY', 'NTSA_SERVICE', 'USER_INPUT', 'SYSTEM_VALIDATION', 'THIRD_PARTY_API');

-- CreateEnum
CREATE TYPE "DetectionMethod" AS ENUM ('RULE_ENGINE', 'API_VALIDATION', 'MANUAL_REVIEW', 'SYSTEM_SCAN', 'EVENT_DRIVEN', 'CROSS_CONTEXT_CHECK', 'LEGAL_ANALYSIS', 'DATA_INTEGRITY_CHECK');

-- CreateEnum
CREATE TYPE "ResolutionTrigger" AS ENUM ('EVENT_BASED', 'MANUAL_ACTION', 'SYSTEM_AUTO', 'COURT_ORDER', 'TIME_BASED');

-- CreateEnum
CREATE TYPE "KenyanFormType" AS ENUM ('PA1_PETITION', 'PA5_PETITION_SUMMARY', 'PA80_PETITION_INTESTATE', 'PA81_PETITION_ADMINISTRATION', 'ISLAMIC_PETITION', 'PA12_AFFIDAVIT_MEANS', 'AFFIDAVIT_DUE_EXECUTION', 'AFFIDAVIT_OF_SEARCH', 'AFFIDAVIT_OF_IDENTIFICATION', 'AFFIDAVIT_SUPPORTING_POLYGAMY', 'ISLAMIC_AFFIDAVIT', 'PA38_CONSENT', 'PA57_GUARANTEE', 'ISLAMIC_CONSENT', 'CONSENT_MINOR', 'CONSENT_CREDITOR', 'CHIEFS_LETTER_TEMPLATE', 'ELDERS_AFFIDAVIT', 'GRANT_OF_PROBATE', 'GRANT_LETTERS_ADMINISTRATION', 'CONFIRMATION_GRANT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'PENDING_FORMS', 'UNDER_REVIEW', 'PENDING_SIGNATURES', 'PENDING_CONSENTS', 'PENDING_FEE', 'READY_TO_FILE', 'FILED', 'COURT_REVIEW', 'GAZETTE_PUBLISHED', 'GRANTED', 'REJECTED', 'AMENDMENT_REQUIRED', 'WITHDRAWN', 'ABANDONED');

-- CreateEnum
CREATE TYPE "FilingPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('PENDING_GENERATION', 'GENERATED', 'UNDER_REVIEW', 'APPROVED', 'SIGNATURE_PENDING', 'SIGNED', 'FILED', 'COURT_ACCEPTED', 'COURT_REJECTED', 'AMENDED', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormCategory" AS ENUM ('PRIMARY_PETITION', 'SUPPORTING_AFFIDAVIT', 'CONSENT', 'GUARANTEE', 'NOTICE', 'SCHEDULE', 'COURT_ORDER', 'CUSTOMARY', 'ISLAMIC', 'DISTRIBUTION');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('AWS_S3', 'AZURE_BLOB', 'GOOGLE_CLOUD_STORAGE', 'LOCAL_FILE_SYSTEM', 'COURT_E_FILING');

-- CreateEnum
CREATE TYPE "FileFormat" AS ENUM ('PDF', 'DOCX', 'XML', 'HTML', 'JSON');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'DECLINED', 'NOT_REQUIRED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('MISSING_DOCUMENT', 'INVALID_DOCUMENT', 'EXPIRED_DOCUMENT', 'FORGED_DOCUMENT', 'MINOR_WITHOUT_GUARDIAN', 'UNDEFINED_POLYGAMOUS_STRUCTURE', 'DISPUTED_RELATIONSHIP', 'COHABITATION_CLAIM', 'ILLEGITIMATE_CHILD_CLAIM', 'ASSET_VERIFICATION_FAILED', 'INSOLVENT_ESTATE', 'MISSING_ASSET_VALUATION', 'ENCUMBERED_ASSET', 'FRAUDULENT_ASSET_TRANSFER', 'INVALID_WILL_SIGNATURE', 'MINOR_EXECUTOR', 'BENEFICIARY_AS_WITNESS', 'CONTESTED_WILL', 'UNDUE_INFLUENCE', 'WRONG_COURT', 'NON_RESIDENT_APPLICANT', 'FORUM_NON_CONVENIENS', 'TAX_CLEARANCE_MISSING', 'KRA_PIN_MISSING', 'CAPITAL_GAINS_TAX_UNPAID', 'STATUTE_BARRED_DEBT', 'DELAYED_FILING', 'FAMILY_DISPUTE', 'CRIMINAL_INVESTIGATION', 'BANKRUPTCY_PENDING', 'DATA_INCONSISTENCY', 'EXTERNAL_API_FAILURE');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'SUPERSEDED', 'EXPIRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('SMS_OTP', 'EMAIL_LINK', 'DIGITAL_SIGNATURE', 'WET_SIGNATURE', 'BIOMETRIC', 'WITNESS_MARK', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('SURVIVING_SPOUSE', 'ADULT_CHILD', 'MINOR_CHILD', 'GUARDIAN_OF_MINOR', 'BENEFICIARY', 'EXECUTOR', 'ADMINISTRATOR', 'PARENT', 'SIBLING', 'OTHER_RELATIVE');

-- CreateEnum
CREATE TYPE "ResolutionMethod" AS ENUM ('EVENT_DRIVEN', 'MANUAL_RESOLUTION', 'SYSTEM_AUTO_RESOLVE', 'COURT_ORDER', 'TIME_BASED', 'ADMIN_OVERRIDE');

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
CREATE TYPE "RelationshipType" AS ENUM ('SELF', 'FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'SIBLING', 'HALF_SIBLING');

-- CreateEnum
CREATE TYPE "RelationshipGuardianshipType" AS ENUM ('TEMPORARY', 'PERMANENT', 'TESTAMENTARY', 'CUSTOMARY');

-- CreateEnum
CREATE TYPE "MarriageType" AS ENUM ('CIVIL', 'CHRISTIAN', 'CUSTOMARY', 'ISLAMIC', 'HINDU', 'OTHER');

-- CreateEnum
CREATE TYPE "MarriageStatus" AS ENUM ('ACTIVE', 'DIVORCED', 'ANNULLED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "KenyanRelationshipCategory" AS ENUM ('SPOUSE', 'CHILDREN', 'PARENTS', 'SIBLINGS', 'EXTENDED_FAMILY', 'NON_FAMILY');

-- CreateEnum
CREATE TYPE "DependencyLevel" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- CreateEnum
CREATE TYPE "KenyanLawSection" AS ENUM ('S26_DEPENDANT_PROVISION', 'S29_DEPENDANTS', 'S35_SPOUSAL_CHILDS_SHARE', 'S40_POLY_GAMY', 'S45_DEBT_PRIORITY', 'S70_TESTAMENTARY_GUARDIAN', 'S71_COURT_GUARDIAN', 'S72_GUARDIAN_BOND', 'S73_GUARDIAN_ACCOUNTS', 'S83_EXECUTOR_DUTIES');

-- CreateEnum
CREATE TYPE "GuardianReportStatus" AS ENUM ('PENDING', 'DUE', 'SUBMITTED', 'APPROVED', 'OVERDUE', 'REJECTED');

-- CreateEnum
CREATE TYPE "GuardianshipStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ELIGIBLE', 'CONDITIONAL', 'INELIGIBLE', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED');

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
CREATE TYPE "EstateStatus" AS ENUM ('SETUP', 'ACTIVE', 'FROZEN', 'LIQUIDATING', 'READY_FOR_DISTRIBUTION', 'DISTRIBUTING', 'CLOSED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'VERIFIED', 'FROZEN', 'LIQUIDATING', 'LIQUIDATED', 'TRANSFERRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "LiquidationType" AS ENUM ('PRIVATE_TREATY', 'PUBLIC_AUCTION', 'SALE_TO_BENEFICIARY', 'BUYBACK', 'MARKET_SALE');

-- CreateEnum
CREATE TYPE "LiquidationStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LISTED_FOR_SALE', 'AUCTION_SCHEDULED', 'AUCTION_IN_PROGRESS', 'SALE_PENDING', 'SALE_COMPLETED', 'PROCEEDS_RECEIVED', 'DISTRIBUTED', 'CLOSED', 'CANCELLED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('PENDING', 'ASSESSED', 'PARTIALLY_PAID', 'CLEARED', 'EXEMPT', 'DISPUTED');

-- CreateEnum
CREATE TYPE "CoOwnershipType" AS ENUM ('JOINT_TENANCY', 'TENANCY_IN_COMMON');

-- CreateEnum
CREATE TYPE "ValuationSource" AS ENUM ('MARKET_ESTIMATE', 'REGISTERED_VALUER', 'GOVERNMENT_VALUER', 'CHARTERED_SURVEYOR', 'INSURANCE_VALUATION', 'AGREEMENT_BY_HEIRS', 'COURT_DETERMINATION');

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE', 'REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE');

-- CreateEnum
CREATE TYPE "WillType" AS ENUM ('STANDARD', 'JOINT_WILL', 'MUTUAL_WILL', 'HOLOGRAPHIC', 'INTERNATIONAL', 'TESTAMENTARY_TRUST_WILL');

-- CreateEnum
CREATE TYPE "RevocationMethod" AS ENUM ('NEW_WILL', 'CODICIL', 'DESTRUCTION', 'COURT_ORDER', 'MARRIAGE', 'DIVORCE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExecutorType" AS ENUM ('USER', 'FAMILY_MEMBER', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('TESTAMENTARY', 'SPECIAL_EXECUTOR');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'BIRTH_CERTIFICATE', 'ALIEN_CARD', 'MILITARY_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "CodicilAmendmentType" AS ENUM ('ADDITION', 'MODIFICATION', 'REVOCATION');

-- CreateEnum
CREATE TYPE "DisinheritanceReasonCategory" AS ENUM ('ESTRANGEMENT', 'PROVIDED_FOR_DURING_LIFE', 'MORAL_UNWORTHINESS', 'CONFLICT_OF_INTEREST', 'FINANCIAL_INDEPENDENCE', 'OTHER_DISPOSITION', 'TESTATOR_DISCRETION');

-- CreateEnum
CREATE TYPE "DisinheritanceEvidenceType" AS ENUM ('AFFIDAVIT', 'WILL_CLARIFICATION', 'PRIOR_GIFT_DOCUMENTATION', 'FAMILY_AGREEMENT', 'COURT_ORDER', 'MEDICAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "WillStorageLocation" AS ENUM ('SAFE_DEPOSIT_BOX', 'LAWYER_OFFICE', 'HOME_SAFE', 'DIGITAL_VAULT', 'COURT_REGISTRY', 'WITH_EXECUTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "LegalCapacityStatus" AS ENUM ('ASSESSED_COMPETENT', 'ASSESSED_INCOMPETENT', 'PENDING_ASSESSMENT', 'MEDICAL_CERTIFICATION', 'COURT_DETERMINATION', 'SELF_DECLARATION');

-- CreateEnum
CREATE TYPE "WitnessType" AS ENUM ('REGISTERED_USER', 'EXTERNAL_INDIVIDUAL', 'PROFESSIONAL_WITNESS', 'COURT_OFFICER', 'NOTARY_PUBLIC');

-- CreateEnum
CREATE TYPE "WitnessEligibilityStatus" AS ENUM ('ELIGIBLE', 'INELIGIBLE_MINOR', 'INELIGIBLE_BENEFICIARY', 'INELIGIBLE_SPOUSE', 'INELIGIBLE_EXECUTOR', 'INELIGIBLE_RELATIONSHIP', 'INELIGIBLE_MENTAL_CAPACITY', 'INELIGIBLE_CRIMINAL_RECORD', 'PENDING_ELIGIBILITY_CHECK');

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
CREATE TYPE "BequestType" AS ENUM ('SPECIFIC', 'RESIDUARY', 'CONDITIONAL', 'TRUST', 'PERCENTAGE', 'FIXED_AMOUNT', 'LIFE_INTEREST', 'ALTERNATE');

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
CREATE TYPE "GiftStatus" AS ENUM ('CONFIRMED', 'CONTESTED', 'EXCLUDED', 'RECLASSIFIED_AS_LOAN', 'VOID');

-- CreateEnum
CREATE TYPE "DependantRelationship" AS ENUM ('SPOUSE', 'CHILD', 'ADOPTED_CHILD', 'STEP_CHILD', 'PARENT', 'SIBLING', 'GRANDCHILD', 'NIECE_NEPHEW', 'OTHER');

-- CreateEnum
CREATE TYPE "DependantStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'APPEALED', 'SETTLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('MARRIAGE_CERTIFICATE', 'BIRTH_CERTIFICATE', 'AFFIDAVIT', 'COURT_ORDER', 'MEDICAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

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
    "deceasedId" UUID NOT NULL,
    "deceasedName" VARCHAR(200) NOT NULL,
    "DateOfDeath" TIMESTAMP(3),
    "status" "EstateStatus" NOT NULL,
    "kraPin" TEXT NOT NULL,
    "executorId" TEXT,
    "courtCaseNumber" TEXT,
    "createdBy" TEXT NOT NULL,
    "cashOnHandAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "cashOnHandCurrency" TEXT NOT NULL DEFAULT 'KES',
    "cashReservedDebtsAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "cashReservedDebtsCurrency" TEXT NOT NULL DEFAULT 'KES',
    "cashReservedTaxesAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "cashReservedTaxesCurrency" TEXT NOT NULL DEFAULT 'KES',
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "freezeReason" TEXT,
    "frozenBy" TEXT,
    "frozenAt" TIMESTAMP(3),
    "hasActiveDisputes" BOOLEAN NOT NULL DEFAULT false,
    "requiresCourtSupervision" BOOLEAN NOT NULL DEFAULT false,
    "isInsolvent" BOOLEAN NOT NULL DEFAULT false,
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
    "location" TEXT,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL,
    "currentValueAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "currentValueCurrency" TEXT NOT NULL DEFAULT 'KES',
    "isEncumbered" BOOLEAN NOT NULL DEFAULT false,
    "encumbranceDetails" TEXT,
    "coOwnershipType" "CoOwnershipType",
    "totalSharePercentage" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "sourceOfFunds" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

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
    "valueAmount" DECIMAL(19,4) NOT NULL,
    "valueCurrency" TEXT NOT NULL DEFAULT 'KES',
    "previousValueAmount" DECIMAL(19,4),
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "source" "ValuationSource" NOT NULL,
    "reason" TEXT,
    "isProfessionalValuation" BOOLEAN NOT NULL DEFAULT false,
    "isTaxAcceptable" BOOLEAN NOT NULL DEFAULT false,
    "isCourtAcceptable" BOOLEAN NOT NULL DEFAULT false,
    "credibilityScore" INTEGER NOT NULL DEFAULT 0,
    "valuerName" TEXT,
    "valuerLicenseNumber" TEXT,
    "valuerInstitution" TEXT,
    "methodology" TEXT,
    "notes" TEXT,
    "supportingDocuments" TEXT[],
    "conductedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_co_owners" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "familyMemberId" UUID,
    "sharePercentage" DOUBLE PRECISION NOT NULL,
    "ownershipType" "CoOwnershipType" NOT NULL,
    "evidenceOfOwnership" TEXT,
    "ownershipDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(19,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "asset_co_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_liquidations" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "liquidationType" "LiquidationType" NOT NULL,
    "status" "LiquidationStatus" NOT NULL,
    "approvedByCourt" BOOLEAN NOT NULL DEFAULT false,
    "courtOrderRef" TEXT,
    "targetAmountAmount" DECIMAL(19,4) NOT NULL,
    "targetAmountCurrency" TEXT NOT NULL DEFAULT 'KES',
    "actualAmountAmount" DECIMAL(19,4),
    "actualAmountCurrency" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "commissionRate" DOUBLE PRECISION,
    "commissionAmountAmount" DECIMAL(19,4),
    "netProceedsAmount" DECIMAL(19,4),
    "buyerName" TEXT,
    "buyerIdNumber" TEXT,
    "saleDate" TIMESTAMP(3),
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "liquidationNotes" TEXT,
    "liquidatedBy" TEXT,

    CONSTRAINT "asset_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estate_tax_compliance" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "kraPin" VARCHAR(20),
    "status" "TaxStatus" NOT NULL,
    "incomeTaxLiabilityAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "capitalGainsTaxLiabilityAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "stampDutyLiabilityAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "otherLeviesLiabilityAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalPaidAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "lastPaymentDate" TIMESTAMP(3),
    "paymentHistory" JSONB[],
    "clearanceCertificateNo" TEXT,
    "clearanceDate" TIMESTAMP(3),
    "clearanceIssuedBy" TEXT,
    "assessmentDate" TIMESTAMP(3),
    "assessmentReference" TEXT,
    "assessedBy" TEXT,
    "exemptionReason" TEXT,
    "exemptionCertificateNo" TEXT,
    "exemptedBy" TEXT,
    "exemptionDate" TIMESTAMP(3),
    "requiresProfessionalValuation" BOOLEAN NOT NULL DEFAULT false,
    "isUnderInvestigation" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "estate_tax_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "creditorName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "initialAmountAmount" DECIMAL(19,4) NOT NULL,
    "initialAmountCurrency" TEXT NOT NULL DEFAULT 'KES',
    "outstandingBalanceAmount" DECIMAL(19,4) NOT NULL,
    "outstandingBalanceCurrency" TEXT NOT NULL DEFAULT 'KES',
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "priorityTier" "DebtTier" NOT NULL,
    "type" "DebtType" NOT NULL,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securedAssetId" TEXT,
    "status" "DebtStatus" NOT NULL,
    "isStatuteBarred" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "disputeReason" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "totalPaidAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "creditorContact" TEXT,
    "referenceNumber" TEXT,
    "evidenceDocumentId" TEXT,
    "requiresCourtApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts_inter_vivos" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT,
    "description" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "valueAtTimeOfGiftAmount" DECIMAL(19,4) NOT NULL,
    "valueAtTimeOfGiftCurrency" TEXT NOT NULL DEFAULT 'KES',
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "isFormalGift" BOOLEAN NOT NULL DEFAULT false,
    "deedOfGiftRef" TEXT,
    "witnesses" TEXT[],
    "isSubjectToHotchpot" BOOLEAN NOT NULL DEFAULT true,
    "hotchpotMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "GiftStatus" NOT NULL,
    "contestReason" TEXT,
    "contestedBy" TEXT,
    "contestedAt" TIMESTAMP(3),
    "courtOrderRef" TEXT,
    "givenDuringLifetime" BOOLEAN NOT NULL DEFAULT true,
    "relationshipToDeceased" TEXT,
    "notes" TEXT,
    "requiresReconciliation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gifts_inter_vivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_dependants" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "deceasedId" UUID NOT NULL,
    "dependantName" TEXT NOT NULL,
    "relationship" "DependantRelationship" NOT NULL,
    "lawSection" "KenyanLawSection" NOT NULL,
    "dependencyLevel" "DependencyLevel" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "isIncapacitated" BOOLEAN NOT NULL DEFAULT false,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "disabilityPercentage" DOUBLE PRECISION,
    "monthlyMaintenanceNeedsAmount" DECIMAL(19,4) NOT NULL,
    "monthlyMaintenanceNeedsCurrency" TEXT NOT NULL DEFAULT 'KES',
    "annualSupportProvidedAmount" DECIMAL(19,4),
    "proposedAllocationAmount" DECIMAL(19,4),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" "DependantStatus" NOT NULL,
    "rejectionReason" TEXT,
    "appealedReason" TEXT,
    "custodialParentId" TEXT,
    "guardianId" TEXT,
    "courtCaseNumber" TEXT,
    "courtOrderRef" TEXT,
    "requiresCourtDetermination" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "riskLevel" "RiskLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependant_evidence" (
    "id" UUID NOT NULL,
    "dependantId" UUID NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "validationNotes" TEXT,
    "validationScore" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,

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
    "supersedesWillId" UUID,
    "supersededByWillId" UUID,
    "executionDate" TIMESTAMP(3),
    "funeralWishes" TEXT,
    "burialLocation" TEXT,
    "residuaryClause" TEXT,
    "storageLocation" TEXT,
    "probateCaseNumber" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" TEXT[],
    "capacityDeclaration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_executors" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "identityType" "ExecutorType" NOT NULL,
    "identityUserId" TEXT,
    "identityFamilyMemberId" TEXT,
    "identityExternalDetails" JSONB,
    "priorityLevel" TEXT NOT NULL,
    "priorityOrder" INTEGER NOT NULL,
    "appointmentType" "AppointmentType" NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "consentStatus" "ConsentStatus" NOT NULL,
    "consentDate" TIMESTAMP(3),
    "consentNotes" TEXT,
    "isQualified" BOOLEAN NOT NULL DEFAULT false,
    "qualificationReasons" TEXT[],
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "isMentallyIncapacitated" BOOLEAN NOT NULL DEFAULT false,
    "hasCriminalRecord" BOOLEAN NOT NULL DEFAULT false,
    "isBankrupt" BOOLEAN NOT NULL DEFAULT false,
    "contactInfo" JSONB,
    "powers" TEXT[],
    "restrictions" TEXT[],
    "compensation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_witnesses" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "identityType" "WitnessType" NOT NULL,
    "identityUserId" TEXT,
    "identityExternalDetails" JSONB,
    "status" TEXT NOT NULL,
    "eligibility" JSONB NOT NULL,
    "verificationMethod" "VerificationMethod",
    "verificationDocumentId" TEXT,
    "signatureType" "SignatureType",
    "signedAt" TIMESTAMP(3),
    "signatureLocation" TEXT,
    "executionDate" TIMESTAMP(3),
    "presenceType" TEXT NOT NULL,
    "declarations" JSONB NOT NULL,
    "contactInfo" JSONB,
    "notes" TEXT,
    "evidenceIds" TEXT[],
    "invitedAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3)[],
    "lastContactAttempt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_bequest" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "assetId" UUID,
    "beneficiary" JSONB NOT NULL,
    "bequestType" "BequestType" NOT NULL,
    "specificAssetId" TEXT,
    "percentage" DOUBLE PRECISION,
    "fixedAmountAmount" DECIMAL(19,4),
    "fixedAmountCurrency" TEXT,
    "residuaryShare" DOUBLE PRECISION,
    "lifeInterestDetails" JSONB,
    "trustDetails" JSONB,
    "conditions" JSONB[],
    "priority" "BequestPriority" NOT NULL,
    "executionOrder" INTEGER NOT NULL,
    "alternateBeneficiary" JSONB,
    "alternateConditions" JSONB[],
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "isVested" BOOLEAN NOT NULL DEFAULT false,
    "isSubjectToHotchpot" BOOLEAN NOT NULL DEFAULT false,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "will_bequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codicils" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "codicilDate" TIMESTAMP(3) NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "executionDate" TIMESTAMP(3),
    "witnesses" TEXT[],
    "amendmentType" "CodicilAmendmentType" NOT NULL,
    "affectedClauses" TEXT[],
    "legalBasis" TEXT,
    "isDependent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codicils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disinheritance_records" (
    "id" UUID NOT NULL,
    "willId" UUID NOT NULL,
    "disinheritedPerson" JSONB NOT NULL,
    "reasonCategory" "DisinheritanceReasonCategory" NOT NULL,
    "reasonDescription" TEXT NOT NULL,
    "legalBasis" TEXT,
    "evidence" JSONB[],
    "appliesToBequests" TEXT[],
    "isCompleteDisinheritance" BOOLEAN NOT NULL,
    "reinstatementConditions" TEXT[],
    "isAcknowledgedByDisinherited" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgmentDate" TIMESTAMP(3),
    "acknowledgmentMethod" TEXT,
    "legalRiskLevel" "RiskLevel" NOT NULL,
    "riskMitigationSteps" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedReason" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "familyId" UUID,
    "contextRegime" "SuccessionRegime" NOT NULL,
    "contextMarriage" "SuccessionMarriageType" NOT NULL,
    "contextReligion" "SuccessionReligion" NOT NULL,
    "isMinorInvolved" BOOLEAN NOT NULL DEFAULT false,
    "hasDisputedAssets" BOOLEAN NOT NULL DEFAULT false,
    "isBusinessAssetsInvolved" BOOLEAN NOT NULL DEFAULT false,
    "isForeignAssetsInvolved" BOOLEAN NOT NULL DEFAULT false,
    "isEstateInsolvent" BOOLEAN NOT NULL DEFAULT false,
    "hasDependantsWithDisabilities" BOOLEAN NOT NULL DEFAULT false,
    "targetCourtJurisdiction" "CourtJurisdiction" NOT NULL,
    "estimatedComplexityScore" INTEGER NOT NULL DEFAULT 1,
    "readinessScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "filingConfidence" "FilingConfidence" NOT NULL DEFAULT 'LOW',
    "riskBreakdown" JSONB NOT NULL,
    "nextMilestone" TEXT,
    "estimatedDaysToReady" INTEGER,
    "missingDocuments" JSONB,
    "blockingIssues" TEXT[],
    "recommendedStrategy" TEXT,
    "lastAssessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRecalculationTrigger" VARCHAR(100),
    "totalRecalculations" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
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
    "riskStatus" "RiskStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "mitigationSteps" TEXT[],
    "sourceType" "RiskSourceType" NOT NULL,
    "serviceName" TEXT NOT NULL,
    "detectionMethod" "DetectionMethod" NOT NULL,
    "detectionRuleId" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "sourceEntityType" TEXT,
    "sourceAggregateId" TEXT,
    "sourceDetails" JSONB,
    "isBlocking" BOOLEAN NOT NULL DEFAULT false,
    "impactScore" INTEGER NOT NULL DEFAULT 0,
    "affectedEntityIds" TEXT[],
    "affectedAggregateIds" TEXT[],
    "documentGap" JSONB,
    "expectedResolutionEvents" TEXT[],
    "autoResolveTimeout" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolutionMethod" "ResolutionMethod",
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "lastReviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probate_applications" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "readinessAssessmentId" UUID NOT NULL,
    "successionContext" JSONB NOT NULL,
    "readinessScore" JSONB,
    "applicationType" "ProbateApplicationType" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "FilingPriority" NOT NULL DEFAULT 'NORMAL',
    "applicantUserId" UUID NOT NULL,
    "applicantFullName" TEXT NOT NULL,
    "applicantRelationship" TEXT NOT NULL,
    "applicantContact" JSONB NOT NULL,
    "targetCourtJurisdiction" "CourtJurisdiction" NOT NULL,
    "targetCourtName" VARCHAR(150) NOT NULL,
    "courtStation" VARCHAR(100) NOT NULL,
    "courtRegistry" TEXT,
    "estimatedProcessingDays" INTEGER,
    "filingFeeAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "filingFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "filingFeePaidAt" TIMESTAMP(3),
    "estimatedFilingDate" TIMESTAMP(3),
    "estimatedGrantDate" TIMESTAMP(3),
    "filedAt" TIMESTAMP(3),
    "filingMethod" TEXT,
    "courtCaseNumber" VARCHAR(100),
    "courtFileNumber" TEXT,
    "courtReceiptNumber" TEXT,
    "courtReviewDate" TIMESTAMP(3),
    "gazettePublishedDate" TIMESTAMP(3),
    "gazetteNoticeId" TEXT,
    "objectionDeadline" TIMESTAMP(3),
    "grantedDate" TIMESTAMP(3),
    "grantNumber" TEXT,
    "grantType" TEXT,
    "grantIssuedBy" TEXT,
    "rejectionReason" TEXT,
    "rejectionDate" TIMESTAMP(3),
    "amendmentsRequired" TEXT[],
    "amendmentDeadline" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "totalFormsGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalConsentsRequired" INTEGER NOT NULL DEFAULT 0,
    "lastStatusChangeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "internalNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "probate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_forms" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "formType" "KenyanFormType" NOT NULL,
    "formCode" VARCHAR(50) NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'PENDING_GENERATION',
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'AWS_S3',
    "storageUrl" TEXT NOT NULL,
    "fileFormat" "FileFormat" NOT NULL DEFAULT 'PDF',
    "fileSizeBytes" INTEGER NOT NULL DEFAULT 0,
    "checksum" TEXT,
    "templateVersion" TEXT,
    "dataSource" TEXT,
    "dataHash" TEXT,
    "signatures" JSONB,
    "requiredSignatories" INTEGER NOT NULL DEFAULT 0,
    "isFullySigned" BOOLEAN NOT NULL DEFAULT false,
    "courtCaseNumber" TEXT,
    "filingDate" TIMESTAMP(3),
    "filingReference" TEXT,
    "courtStampNumber" TEXT,
    "rejectionReason" TEXT,
    "courtQueries" TEXT[],
    "amendmentsRequired" TEXT[],
    "versions" JSONB,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "isNotarizationRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCommissionerOathsRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCourtStampRequired" BOOLEAN NOT NULL DEFAULT false,
    "relatedFormIds" TEXT[],
    "dependsOnFormIds" TEXT[],
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_consents" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "familyMemberId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "role" "FamilyRole" NOT NULL,
    "relationshipToDeceased" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "ConsentMethod",
    "requestSentAt" TIMESTAMP(3),
    "requestSentVia" TEXT,
    "requestExpiresAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "consentGivenAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "digitalSignatureId" TEXT,
    "signatureMethod" "ConsentMethod",
    "verificationCode" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "declineReason" TEXT,
    "declineCategory" TEXT,
    "withdrawalReason" TEXT,
    "hasLegalRepresentative" BOOLEAN NOT NULL DEFAULT false,
    "legalRepresentativeName" TEXT,
    "legalRepresentativeContact" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executor_roadmaps" (
    "id" UUID NOT NULL,
    "estateId" UUID NOT NULL,
    "readinessAssessmentId" UUID NOT NULL,
    "successionContext" JSONB NOT NULL,
    "readinessScore" JSONB,
    "currentPhase" "RoadmapPhase" NOT NULL DEFAULT 'PRE_FILING',
    "status" "RoadmapStatus" NOT NULL DEFAULT 'DRAFT',
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "phases" JSONB NOT NULL,
    "phaseHistory" JSONB NOT NULL,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "skippedTasks" INTEGER NOT NULL DEFAULT 0,
    "overdueTasks" INTEGER NOT NULL DEFAULT 0,
    "blockedTasks" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimatedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "totalTimeSpentHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blockedByRiskIds" TEXT[],
    "resolvesRiskIds" TEXT[],
    "linkedDocumentGaps" TEXT[],
    "analytics" JSONB NOT NULL,
    "userId" UUID NOT NULL,
    "executorName" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysInactive" INTEGER NOT NULL DEFAULT 0,
    "autoTransitionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoTaskGenerationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "escalationThresholdDays" INTEGER NOT NULL DEFAULT 14,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastOptimizedAt" TIMESTAMP(3),
    "optimizationCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executor_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" UUID NOT NULL,
    "roadmapId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortCode" VARCHAR(50) NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "phase" "RoadmapPhase" NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "dependsOnTaskIds" TEXT[],
    "blocksTaskIds" TEXT[],
    "applicableContexts" TEXT[],
    "triggers" "TaskTrigger"[],
    "legalReferences" JSONB NOT NULL,
    "detailedInstructions" TEXT[],
    "quickTips" TEXT[],
    "commonMistakes" TEXT[],
    "externalLinks" JSONB NOT NULL,
    "courtSpecificInstructions" JSONB,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,
    "proofTypes" "ProofType"[],
    "proofDocumentType" TEXT,
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "lastRemindedAt" TIMESTAMP(3),
    "estimatedTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedBy" TEXT,
    "completionNotes" TEXT,
    "skipReason" TEXT,
    "waiverReason" TEXT,
    "failureReason" TEXT,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptedAt" TIMESTAMP(3),
    "reminderIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "autoEscalateAfterDays" INTEGER NOT NULL DEFAULT 14,
    "relatedRiskFlagIds" TEXT[],
    "relatedDocumentGapIds" TEXT[],
    "externalServiceId" TEXT,
    "externalTaskId" TEXT,
    "history" JSONB NOT NULL,
    "templateVersion" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExecutorUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ExecutorUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WitnessUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_WitnessUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssignmentBeneficiaryUser" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssignmentBeneficiaryUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserIdentityDocuments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_UserIdentityDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToWill" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DocumentToWill_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_WitnessIdentityDocuments" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_WitnessIdentityDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CustodialParent" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CustodialParent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BeneficiaryFamilyMember" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_BeneficiaryFamilyMember_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FamilyMemberLifeInterest" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_FamilyMemberLifeInterest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SecuredDebtAsset" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_SecuredDebtAsset_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AssetToDocument" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AssetToDocument_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DisinheritedMember" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DisinheritedMember_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE UNIQUE INDEX "asset_co_owners_assetId_familyMemberId_key" ON "asset_co_owners"("assetId", "familyMemberId");

-- CreateIndex
CREATE INDEX "asset_liquidations_assetId_idx" ON "asset_liquidations"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_estateId_key" ON "estate_tax_compliance"("estateId");

-- CreateIndex
CREATE UNIQUE INDEX "estate_tax_compliance_kraPin_key" ON "estate_tax_compliance"("kraPin");

-- CreateIndex
CREATE INDEX "debts_estateId_priorityTier_idx" ON "debts"("estateId", "priorityTier");

-- CreateIndex
CREATE UNIQUE INDEX "legal_dependants_estateId_dependantId_key" ON "legal_dependants"("estateId", "dependantId");

-- CreateIndex
CREATE UNIQUE INDEX "wills_supersedesWillId_key" ON "wills"("supersedesWillId");

-- CreateIndex
CREATE UNIQUE INDEX "wills_supersededByWillId_key" ON "wills"("supersededByWillId");

-- CreateIndex
CREATE INDEX "wills_testatorId_status_idx" ON "wills"("testatorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_scenarios_estateId_scenarioName_key" ON "distribution_scenarios"("estateId", "scenarioName");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_assessments_estateId_key" ON "readiness_assessments"("estateId");

-- CreateIndex
CREATE INDEX "risk_flags_sourceEntityId_sourceType_idx" ON "risk_flags"("sourceEntityId", "sourceType");

-- CreateIndex
CREATE INDEX "risk_flags_category_riskStatus_idx" ON "risk_flags"("category", "riskStatus");

-- CreateIndex
CREATE INDEX "probate_applications_estateId_status_idx" ON "probate_applications"("estateId", "status");

-- CreateIndex
CREATE INDEX "probate_applications_courtCaseNumber_idx" ON "probate_applications"("courtCaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "family_consents_applicationId_familyMemberId_key" ON "family_consents"("applicationId", "familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "executor_roadmaps_estateId_key" ON "executor_roadmaps"("estateId");

-- CreateIndex
CREATE INDEX "roadmap_tasks_roadmapId_status_idx" ON "roadmap_tasks"("roadmapId", "status");

-- CreateIndex
CREATE INDEX "roadmap_tasks_category_idx" ON "roadmap_tasks"("category");

-- CreateIndex
CREATE INDEX "roadmap_tasks_priority_isOverdue_idx" ON "roadmap_tasks"("priority", "isOverdue");

-- CreateIndex
CREATE INDEX "_ExecutorUser_B_index" ON "_ExecutorUser"("B");

-- CreateIndex
CREATE INDEX "_WitnessUser_B_index" ON "_WitnessUser"("B");

-- CreateIndex
CREATE INDEX "_AssignmentBeneficiaryUser_B_index" ON "_AssignmentBeneficiaryUser"("B");

-- CreateIndex
CREATE INDEX "_UserIdentityDocuments_B_index" ON "_UserIdentityDocuments"("B");

-- CreateIndex
CREATE INDEX "_DocumentToWill_B_index" ON "_DocumentToWill"("B");

-- CreateIndex
CREATE INDEX "_WitnessIdentityDocuments_B_index" ON "_WitnessIdentityDocuments"("B");

-- CreateIndex
CREATE INDEX "_CustodialParent_B_index" ON "_CustodialParent"("B");

-- CreateIndex
CREATE INDEX "_BeneficiaryFamilyMember_B_index" ON "_BeneficiaryFamilyMember"("B");

-- CreateIndex
CREATE INDEX "_FamilyMemberLifeInterest_B_index" ON "_FamilyMemberLifeInterest"("B");

-- CreateIndex
CREATE INDEX "_SecuredDebtAsset_B_index" ON "_SecuredDebtAsset"("B");

-- CreateIndex
CREATE INDEX "_AssetToDocument_B_index" ON "_AssetToDocument"("B");

-- CreateIndex
CREATE INDEX "_DisinheritedMember_B_index" ON "_DisinheritedMember"("B");

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
ALTER TABLE "asset_co_owners" ADD CONSTRAINT "asset_co_owners_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_liquidations" ADD CONSTRAINT "asset_liquidations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estate_tax_compliance" ADD CONSTRAINT "estate_tax_compliance_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts_inter_vivos" ADD CONSTRAINT "gifts_inter_vivos_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_dependants" ADD CONSTRAINT "legal_dependants_deceasedId_fkey" FOREIGN KEY ("deceasedId") REFERENCES "family_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependant_evidence" ADD CONSTRAINT "dependant_evidence_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "legal_dependants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_testatorId_fkey" FOREIGN KEY ("testatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_supersedesWillId_fkey" FOREIGN KEY ("supersedesWillId") REFERENCES "wills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_executors" ADD CONSTRAINT "will_executors_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_witnesses" ADD CONSTRAINT "will_witnesses_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_bequest" ADD CONSTRAINT "will_bequest_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_bequest" ADD CONSTRAINT "will_bequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codicils" ADD CONSTRAINT "codicils_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disinheritance_records" ADD CONSTRAINT "disinheritance_records_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_scenarios" ADD CONSTRAINT "distribution_scenarios_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "computed_share_details" ADD CONSTRAINT "computed_share_details_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "distribution_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_assessments" ADD CONSTRAINT "readiness_assessments_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_flags" ADD CONSTRAINT "risk_flags_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "readiness_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_forms" ADD CONSTRAINT "generated_forms_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "probate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_consents" ADD CONSTRAINT "family_consents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "probate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "executor_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExecutorUser" ADD CONSTRAINT "_ExecutorUser_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExecutorUser" ADD CONSTRAINT "_ExecutorUser_B_fkey" FOREIGN KEY ("B") REFERENCES "will_executors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessUser" ADD CONSTRAINT "_WitnessUser_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessUser" ADD CONSTRAINT "_WitnessUser_B_fkey" FOREIGN KEY ("B") REFERENCES "will_witnesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignmentBeneficiaryUser" ADD CONSTRAINT "_AssignmentBeneficiaryUser_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignmentBeneficiaryUser" ADD CONSTRAINT "_AssignmentBeneficiaryUser_B_fkey" FOREIGN KEY ("B") REFERENCES "will_bequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserIdentityDocuments" ADD CONSTRAINT "_UserIdentityDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserIdentityDocuments" ADD CONSTRAINT "_UserIdentityDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WitnessIdentityDocuments" ADD CONSTRAINT "_WitnessIdentityDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "will_witnesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustodialParent" ADD CONSTRAINT "_CustodialParent_A_fkey" FOREIGN KEY ("A") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustodialParent" ADD CONSTRAINT "_CustodialParent_B_fkey" FOREIGN KEY ("B") REFERENCES "legal_dependants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BeneficiaryFamilyMember" ADD CONSTRAINT "_BeneficiaryFamilyMember_A_fkey" FOREIGN KEY ("A") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BeneficiaryFamilyMember" ADD CONSTRAINT "_BeneficiaryFamilyMember_B_fkey" FOREIGN KEY ("B") REFERENCES "will_bequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FamilyMemberLifeInterest" ADD CONSTRAINT "_FamilyMemberLifeInterest_B_fkey" FOREIGN KEY ("B") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecuredDebtAsset" ADD CONSTRAINT "_SecuredDebtAsset_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecuredDebtAsset" ADD CONSTRAINT "_SecuredDebtAsset_B_fkey" FOREIGN KEY ("B") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToDocument" ADD CONSTRAINT "_AssetToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssetToDocument" ADD CONSTRAINT "_AssetToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisinheritedMember" ADD CONSTRAINT "_DisinheritedMember_A_fkey" FOREIGN KEY ("A") REFERENCES "disinheritance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DisinheritedMember" ADD CONSTRAINT "_DisinheritedMember_B_fkey" FOREIGN KEY ("B") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
