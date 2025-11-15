import { registerAs } from '@nestjs/config';

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
    maxWitnesses: parseInt(process.env.WILL_MAX_WITNESSES || '2', 10), // Kenya law requires minimum 2
    maxExecutors: parseInt(process.env.WILL_MAX_EXECUTORS || '4', 10),

    allowDigitalSignatures: process.env.WILL_ALLOW_DIGITAL_SIGNATURES === 'true',
    requireWitnesses: process.env.WILL_REQUIRE_WITNESSES !== 'false',
    requireAdvocateSeal: process.env.WILL_REQUIRE_ADVOCATE_SEAL === 'true',

    // workflow
    maxVersions: parseInt(process.env.WILL_MAX_VERSIONS || '10', 10),
    draftExpiryDays: parseInt(process.env.WILL_DRAFT_EXPIRY_DAYS || '365', 10),
  },

  // ---------------------------------------------------------------------------
  // Family & Dependency Rules (Law of Succession Act – Sections 29 & 35-42)
  // ---------------------------------------------------------------------------
  family: {
    dependantAgeLimit: parseInt(process.env.FAMILY_DEPENDANT_AGE_LIMIT || '18', 10),
    maxMembers: parseInt(process.env.FAMILY_MAX_MEMBERS || '200', 10),
    maxGenerations: parseInt(process.env.FAMILY_MAX_GENERATIONS || '6', 10),
    autoRelationshipDetection: process.env.FAMILY_AUTO_RELATIONSHIP_DETECTION === 'true',

    requireProofOfDependency: process.env.FAMILY_REQUIRE_PROOF_OF_DEPENDENCY !== 'false',

    // Default statutory distribution ratios (editable to match firm interpretation)
    spouseShareRatio: parseFloat(process.env.FAMILY_SPOUSE_SHARE_RATIO || '0.5'),
    childrenShareRatio: parseFloat(process.env.FAMILY_CHILDREN_SHARE_RATIO || '0.5'),

    // polygamous families (Section 40)
    allowPolygamousDistribution: process.env.FAMILY_ALLOW_POLYGAMOUS_DISTRIBUTION !== 'false',
  },

  // ---------------------------------------------------------------------------
  // Probate Workflow (Kenyan Court Rules)
  // ---------------------------------------------------------------------------
  probate: {
    // Time allowed before filing (Section 51)
    applicationDeadlineDays: parseInt(process.env.PROBATE_APPLICATION_DEADLINE_DAYS || '180', 10),

    // Gazette notice + objection period (minimum 30 days under Kenyan law)
    objectionPeriodDays: parseInt(process.env.PROBATE_OBJECTION_PERIOD_DAYS || '30', 10),

    // Distribution timeline (commonly 1 year)
    distributionDeadlineDays: parseInt(process.env.PROBATE_DISTRIBUTION_DEADLINE_DAYS || '365', 10),

    // Jurisdiction thresholds
    highCourtThreshold: parseInt(process.env.PROBATE_HIGH_COURT_THRESHOLD || '5000000', 10),
    magistrateCourtThreshold: parseInt(
      process.env.PROBATE_MAGISTRATE_COURT_THRESHOLD || '2000000',
      10,
    ),

    // Fees (standard practice: 0.5%)
    courtFeePercentage: parseFloat(process.env.PROBATE_COURT_FEE_PERCENTAGE || '0.005'),
  },

  // ---------------------------------------------------------------------------
  // Executor Responsibilities (Law of Succession §83)
  // ---------------------------------------------------------------------------
  executor: {
    maxCompensationPercentage: parseFloat(
      process.env.EXECUTOR_MAX_COMPENSATION_PERCENTAGE || '0.05',
    ),
    minCompensationPercentage: parseFloat(
      process.env.EXECUTOR_MIN_COMPENSATION_PERCENTAGE || '0.01',
    ),
    defaultCompensationPercentage: parseFloat(
      process.env.EXECUTOR_DEFAULT_COMPENSATION_PERCENTAGE || '0.03',
    ),

    dutyCompletionDays: parseInt(process.env.EXECUTOR_DUTY_COMPLETION_DAYS || '365', 10),

    inventorySubmissionDays: parseInt(process.env.EXECUTOR_INVENTORY_SUBMISSION_DAYS || '180', 10),
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
