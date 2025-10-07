import * as Joi from 'joi';
import { Environment } from '../types';

// Custom validation function to transform comma-separated strings into an array of strings.
const commaSeparatedStringToArray = (value: string, helpers: Joi.CustomHelpers) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value.split(',').map(item => item.trim());
};

export const configValidationSchema = Joi.object({
  // --- App Configuration ---
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .required() as Joi.StringSchema<Environment>,
  APP_NAME: Joi.string().default('Shamba Sure'),
  APP_VERSION: Joi.string().default('1.0.0'),
  PORT: Joi.number().default(3001).required(),
  HOST: Joi.string().default('0.0.0.0'),
  GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  HEALTH_MEMORY_HEAP_THRESHOLD_MB: Joi.number().default(256),

  SERVICE_TIMEOUT: Joi.number().default(30000),

    // Service Ports
  ACCOUNTS_SERVICE_PORT: Joi.number().default(3001),
  DOCUMENTS_SERVICE_PORT: Joi.number().default(3002),
  SUCCESSION_SERVICE_PORT: Joi.number().default(3003),
  AUDITING_SERVICE_PORT: Joi.number().default(3004),
  NOTIFICATIONS_SERVICE_PORT: Joi.number().default(3005),

  // Service URLs
  GATEWAY_PORT: Joi.number().default(3000),
  ACCOUNTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  DOCUMENTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  SUCCESSION_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),

  // --- Database Configuration ---
  DATABASE_URL: Joi.string().uri().required(),

  // --- Auth Configuration ---
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m').required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d').required(),
  BCRYPT_ROUNDS: Joi.number().default(12).required(),

  // --- Messaging Configuration ---
  RABBITMQ_URL: Joi.string().uri().required(),

  // --- Storage Configuration ---
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local').required(),
  STORAGE_LOCAL_PATH: Joi.string().when('STORAGE_PROVIDER', {
    is: 'local',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STORAGE_MAX_FILE_SIZE_MB: Joi.number().default(10).required(),
  STORAGE_ALLOWED_MIME_TYPES: Joi.string()
    .default('image/jpeg,image/png,application/pdf')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),

  // --- Conditional S3 Storage Configuration ---
  STORAGE_S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STORAGE_S3_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STORAGE_S3_ACCESS_KEY_ID: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  STORAGE_S3_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // --- Email Configuration ---
  EMAIL_PROVIDER: Joi.string().valid('smtp', 'sendgrid', 'ses').default('smtp').required(),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),

  // --- Conditional SMTP Configuration ---
  EMAIL_SMTP_HOST: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SMTP_PORT: Joi.number().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SMTP_SECURE: Joi.boolean().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SMTP_USER: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SMTP_PASS: Joi.string().when('EMAIL_PROVIDER', {
    is: 'smtp',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_SENDGRID_API_KEY: Joi.string().when('EMAIL_PROVIDER', {
    is: 'sendgrid',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  // --- SMS Configuration (all optional until a provider is chosen) ---
  SMS_PROVIDER: Joi.string().valid('africas-talking', 'twilio').optional(),

  // --- Conditional Africa's Talking Configuration ---
  SMS_AT_API_KEY: Joi.string().when('SMS_PROVIDER', {
    is: 'africas-talking',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMS_AT_USERNAME: Joi.string().when('SMS_PROVIDER', {
    is: 'africas-talking',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMS_AT_SHORTCODE: Joi.string().when('SMS_PROVIDER', {
    is: 'africas-talking',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  // --- External Services ---
  GOOGLE_MAPS_API_KEY: Joi.string().required(),
  LAND_REGISTRY_API_URL: Joi.string().uri().required(),
  LAND_REGISTRY_API_KEY: Joi.string().required(),

  // --- Security Configuration ---
  ENCRYPTION_KEY: Joi.string().length(32).required(), // Enforce 32-char key for AES-256
  SESSION_TIMEOUT_MINUTES: Joi.number().default(60).required(),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5).required(),
  PASSWORD_MIN_LENGTH: Joi.number().default(8).required(),
  PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true).required(),
  PASSWORD_REQUIRE_LOWERCASE: Joi.boolean().default(true).required(),
  PASSWORD_REQUIRE_NUMBERS: Joi.boolean().default(true).required(),
  PASSWORD_REQUIRE_SPECIAL_CHARS: Joi.boolean().default(true).required(),

  // --- Logging Configuration ---
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info')
    .required(),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json').required(),
});