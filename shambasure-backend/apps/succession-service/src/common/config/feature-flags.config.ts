import { registerAs } from '@nestjs/config';

/**
 * Feature Flags Configuration
 * Cleaned, simplified, and aligned to Kenya Succession workflows
 */
export const featureFlagsConfig = registerAs('featureFlags', () => ({
  // ---------------------------------------------------------------------------
  // Will Features
  // ---------------------------------------------------------------------------
  will: {
    templates: process.env.FEATURE_WILL_TEMPLATES === 'true',
    collaboration: process.env.FEATURE_WILL_COLLABORATION === 'true',
    aiReview: process.env.FEATURE_WILL_AI_REVIEW === 'true',
    digitalSigning: process.env.FEATURE_WILL_DIGITAL_SIGNING === 'true',
    cloudStorage: process.env.FEATURE_WILL_CLOUD_STORAGE === 'true',
  },

  // ---------------------------------------------------------------------------
  // Asset Features
  // ---------------------------------------------------------------------------
  assets: {
    autoValuation: process.env.FEATURE_ASSETS_AUTO_VALUATION === 'true',
    digitalAssets: process.env.FEATURE_ASSETS_DIGITAL === 'true',
    insuranceTracking: process.env.FEATURE_ASSETS_INSURANCE === 'true',
    multiCurrency: process.env.FEATURE_ASSETS_MULTI_CURRENCY === 'true',

    // Kenya-specific
    ardhisasaIntegration: process.env.FEATURE_ASSETS_ARDHISASA === 'true',
  },

  // ---------------------------------------------------------------------------
  // Family Features
  // ---------------------------------------------------------------------------
  family: {
    autoTree: process.env.FEATURE_FAMILY_AUTO_TREE === 'true',
    relationshipValidation: process.env.FEATURE_FAMILY_VALIDATION === 'true',
    conflictDetection: process.env.FEATURE_FAMILY_CONFLICT_DETECTION === 'true',

    // Reflect Kenya customary law
    customaryMarriage: process.env.FEATURE_FAMILY_CUSTOMARY_MARRIAGE === 'true',
    polygamousFamilies: process.env.FEATURE_FAMILY_POLYGAMOUS === 'true',
  },

  // ---------------------------------------------------------------------------
  // Succession Analysis
  // ---------------------------------------------------------------------------
  analysis: {
    risk: process.env.FEATURE_ANALYSIS_RISK === 'true',
    taxOptimization: process.env.FEATURE_ANALYSIS_TAX === 'true',
    scenarioComparison: process.env.FEATURE_ANALYSIS_SCENARIOS === 'true',
    dependantAdequacy: process.env.FEATURE_ANALYSIS_DEPENDANTS === 'true',
    complianceScore: process.env.FEATURE_ANALYSIS_COMPLIANCE === 'true',
  },

  // ---------------------------------------------------------------------------
  // Probate Features
  // ---------------------------------------------------------------------------
  probate: {
    eFiling: process.env.FEATURE_PROBATE_E_FILING === 'true',
    caseTracking: process.env.FEATURE_PROBATE_CASE_TRACKING === 'true',
    documentAutomation: process.env.FEATURE_PROBATE_DOCUMENT_AUTOMATION === 'true',
    executorWorkflow: process.env.FEATURE_PROBATE_EXECUTOR_WORKFLOW === 'true',
    debtSettlement: process.env.FEATURE_PROBATE_DEBT_SETTLEMENT === 'true',
  },

  // ---------------------------------------------------------------------------
  // Disputes
  // ---------------------------------------------------------------------------
  disputes: {
    onlineFiling: process.env.FEATURE_DISPUTES_ONLINE_FILING === 'true',
    alternativeResolution: process.env.FEATURE_DISPUTES_ALTERNATIVE_RESOLUTION === 'true',
    documentAutomation: process.env.FEATURE_DISPUTES_DOCUMENT_AUTOMATION === 'true',
    caseTimeline: process.env.FEATURE_DISPUTES_CASE_TIMELINE === 'true',
  },

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  notifications: {
    multiChannel: process.env.FEATURE_NOTIFICATIONS_MULTI_CHANNEL === 'true',
    smartScheduling: process.env.FEATURE_NOTIFICATIONS_SMART_SCHEDULING === 'true',
    templated: process.env.FEATURE_NOTIFICATIONS_TEMPLATES === 'true',
    twoWay: process.env.FEATURE_NOTIFICATIONS_TWO_WAY === 'true',
  },

  // ---------------------------------------------------------------------------
  // Integrations (Only those legally relevant)
  // ---------------------------------------------------------------------------
  integrations: {
    government: process.env.FEATURE_INTEGRATIONS_GOVERNMENT === 'true',
    courts: process.env.FEATURE_INTEGRATIONS_COURTS === 'true',
  },

  // ---------------------------------------------------------------------------
  // A/B Testing (realistic for production)
  // ---------------------------------------------------------------------------
  abTesting: {
    enabled: process.env.FEATURE_AB_TESTING_ENABLED === 'true',

    experiments: {
      willFlow: {
        enabled: process.env.FEATURE_AB_WILL_FLOW === 'true',
        variants: ['SIMPLE', 'GUIDED', 'ADVANCED'],
        allocation: {
          SIMPLE: 0.33,
          GUIDED: 0.33,
          ADVANCED: 0.34,
        },
      },

      probateNotifications: {
        enabled: process.env.FEATURE_AB_PROBATE_NOTIFICATIONS === 'true',
        variants: ['IMMEDIATE', 'DAILY', 'WEEKLY'],
        allocation: {
          IMMEDIATE: 0.4,
          DAILY: 0.3,
          WEEKLY: 0.3,
        },
      },

      assetValuationMode: {
        enabled: process.env.FEATURE_AB_ASSET_VALUATION === 'true',
        variants: ['STATIC', 'LIVE_MARKET'],
        allocation: {
          STATIC: 0.5,
          LIVE_MARKET: 0.5,
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Rollout (percentage + segments)
  // ---------------------------------------------------------------------------
  rollout: {
    percentages: {
      aiReview: parseInt(process.env.ROLLOUT_AI_REVIEW || '20', 10),
      digitalSigning: parseInt(process.env.ROLLOUT_DIGITAL_SIGNING || '50', 10),
      autoValuation: parseInt(process.env.ROLLOUT_AUTO_VALUATION || '40', 10),
    },

    segments: {
      beta: {
        features: ['AI_REVIEW', 'DIGITAL_SIGNING', 'AUTO_VALUATION'],
        criteria: ['IS_BETA'],
      },
      premium: {
        features: ['SCENARIO_COMPARISON', 'COMPLIANCE_SCORE'],
        criteria: ['TIER_PREMIUM'],
      },
    },

    geographic: {
      kenya: {
        enabled: true,
        features: ['ARDHISASA_INTEGRATION', 'CUSTOMARY_MARRIAGE', 'POLYGAMOUS_FAMILIES'],
      },
      international: {
        enabled: process.env.ROLLOUT_INTERNATIONAL === 'true',
        features: ['MULTI_CURRENCY'],
      },
    },
  },
}));

// Export the config function as default
export default featureFlagsConfig;

// Export type
export type FeatureFlagsConfig = ReturnType<typeof featureFlagsConfig>;
