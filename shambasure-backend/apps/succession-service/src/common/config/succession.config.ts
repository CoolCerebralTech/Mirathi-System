import { registerAs } from '@nestjs/config';

import {
  KENYAN_LEGAL_REQUIREMENTS,
  SUCCESSION_TIMEFRAMES,
} from '../constants/kenyan-law.constants';
import { MINOR_PROTECTION } from '../constants/distribution-rules.constants';

export default registerAs('succession', () => ({
  // ---------------------------------------------------------------------------
  // Succession Domain Configuration (Kenya Succession Law)
  // ---------------------------------------------------------------------------

  estate: {
    requireDeathCertificate: process.env.ESTATE_REQUIRE_DEATH_CERTIFICATE !== 'false',
    maxSupportDocuments: parseInt(process.env.ESTATE_MAX_SUPPORT_DOCUMENTS || '20', 10),
    maxValuationHistory: parseInt(process.env.ESTATE_MAX_VALUATION_HISTORY || '10', 10),
    defaultCurrency: process.env.ESTATE_DEFAULT_CURRENCY || 'KES',
    supportedCurrencies: (process.env.ESTATE_SUPPORTED_CURRENCIES || 'KES,USD,EUR')
      .split(',')
      .map((c) => c.trim()),
  },

  // ---------------------------------------------------------------------------
  // Will Configuration
  // ---------------------------------------------------------------------------
  will: {
    maxAssets: parseInt(process.env.WILL_MAX_ASSETS || '100', 10),
    maxBeneficiaries: parseInt(process.env.WILL_MAX_BENEFICIARIES || '50', 10),
    minWitnesses: parseInt(
      process.env.WILL_MIN_WITNESSES || `${KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES}`,
      10,
    ),
    maxExecutors: parseInt(
      process.env.WILL_MAX_EXECUTORS ||
        `${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS}`,
      10,
    ),
    draftExpiryDays: parseInt(
      process.env.WILL_DRAFT_EXPIRY_DAYS || '365', // This is a business rule, not a legal one
      10,
    ),
    allowDigitalSignatures: process.env.WILL_ALLOW_DIGITAL_SIGNATURES === 'true',
    requireAdvocateSeal: process.env.WILL_REQUIRE_ADVOCATE_SEAL === 'true',
    maxVersions: parseInt(process.env.WILL_MAX_VERSIONS || '10', 10),
  },

  // ---------------------------------------------------------------------------
  // Family & Dependency Rules (Law of Succession Act – Sections 29 & 35-42)
  // ---------------------------------------------------------------------------
  family: {
    dependantAgeLimit: parseInt(
      process.env.FAMILY_DEPENDANT_AGE_LIMIT || `${MINOR_PROTECTION.MINORS.ageLimit}`,
      10,
    ),
    maxMembers: parseInt(process.env.FAMILY_MAX_MEMBERS || '200', 10),
    maxGenerations: parseInt(process.env.FAMILY_MAX_GENERATIONS || '6', 10),
    requireProofOfDependency: process.env.FAMILY_REQUIRE_PROOF_OF_DEPENDENCY !== 'false',
    allowPolygamousDistribution: process.env.FAMILY_ALLOW_POLYGAMOUS_DISTRIBUTION !== 'false',
  },

  // ---------------------------------------------------------------------------
  // Probate Workflow (Kenyan Court Rules)
  // ---------------------------------------------------------------------------
  probate: {
    // Time allowed before filing (Section 51)
    family: {
      // --- REFACTORED: Using legal constants as fallbacks ---
      dependantAgeLimit: parseInt(
        process.env.FAMILY_DEPENDANT_AGE_LIMIT || `${MINOR_PROTECTION.MINORS.ageLimit}`,
        10,
      ),
      maxMembers: parseInt(process.env.FAMILY_MAX_MEMBERS || '200', 10),
      maxGenerations: parseInt(process.env.FAMILY_MAX_GENERATIONS || '6', 10),
      requireProofOfDependency: process.env.FAMILY_REQUIRE_PROOF_OF_DEPENDENCY !== 'false',
      allowPolygamousDistribution: process.env.FAMILY_ALLOW_POLYGAMOUS_DISTRIBUTION !== 'false',
    },
    // Fees (standard practice: 0.5%)
    courtFeePercentage: parseFloat(process.env.PROBATE_COURT_FEE_PERCENTAGE || '0.005'),
  },

  // ---------------------------------------------------------------------------
  // Executor Responsibilities (Law of Succession §83)
  // ---------------------------------------------------------------------------
  executor: {
    maxCompensationPercentage: parseFloat(
      process.env.EXECUTOR_MAX_COMPENSATION_PERCENTAGE ||
        `${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.FEE_PERCENTAGE.MAX}`,
    ),
    minCompensationPercentage: parseFloat(
      process.env.EXECUTOR_MIN_COMPENSATION_PERCENTAGE ||
        `${KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.FEE_PERCENTAGE.MIN}`,
    ),
    inventorySubmissionDays: parseInt(
      process.env.EXECUTOR_INVENTORY_SUBMISSION_DAYS ||
        `${SUCCESSION_TIMEFRAMES.WILL_EXECUTION.INVENTORY_SUBMISSION}`,
      10,
    ),
  },
  // ---------------------------------------------------------------------------
  // Validation Parameters
  // ---------------------------------------------------------------------------
  validation: {
    maxAssetValuation: parseInt(
      process.env.VALIDATION_MAX_ASSET_VALUATION || '10000000000000', // 10 Trillion KES
      10,
    ),
    // We can add other validation parameters here in the future
  },

  // ---------------------------------------------------------------------------
  // Audit & Compliance (internal only)
  // ---------------------------------------------------------------------------
  audit: {
    enabled: process.env.AUDIT_ENABLED !== 'false',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '365', 10),
    logSensitiveData: process.env.AUDIT_LOG_SENSITIVE_DATA === 'true',
    compressionEnabled: process.env.AUDIT_COMPRESSION_ENABLED !== 'false',
  },

  // ---------------------------------------------------------------------------
  // Feature Flags (succession-specific)
  // ---------------------------------------------------------------------------
  features: {
    aiRecommendations: process.env.FEATURE_AI_RECOMMENDATIONS === 'true',
    documentAutomation: process.env.FEATURE_DOCUMENT_AUTOMATION === 'true',
    realTimeCollaboration: process.env.FEATURE_REAL_TIME_COLLABORATION === 'true',
  },
}));

export type SuccessionConfig = ReturnType<typeof import('./succession.config').default>;
