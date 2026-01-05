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
CREATE TYPE "BequestConditionType" AS ENUM ('AGE_REQUIREMENT', 'SURVIVAL', 'EDUCATION', 'MARRIAGE', 'ALTERNATE', 'NONE');

-- CreateEnum
CREATE TYPE "BequestPriority" AS ENUM ('PRIMARY', 'ALTERNATE', 'CONTINGENT');

-- CreateEnum
CREATE TYPE "DebtType" AS ENUM ('MORTGAGE', 'PERSONAL_LOAN', 'CREDIT_CARD', 'BUSINESS_DEBT', 'TAX_OBLIGATION', 'FUNERAL_EXPENSE', 'MEDICAL_BILL', 'OTHER');

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
CREATE INDEX "_TestatorWills_B_index" ON "_TestatorWills"("B");

-- CreateIndex
CREATE INDEX "_DocumentToWill_B_index" ON "_DocumentToWill"("B");

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
ALTER TABLE "_TestatorWills" ADD CONSTRAINT "_TestatorWills_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestatorWills" ADD CONSTRAINT "_TestatorWills_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToWill" ADD CONSTRAINT "_DocumentToWill_B_fkey" FOREIGN KEY ("B") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
