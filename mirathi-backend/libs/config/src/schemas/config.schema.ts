import * as Joi from 'joi';

// Custom validation function to transform comma-separated strings into an array of strings.
const commaSeparatedStringToArray = (value: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value.split(',').map((item) => item.trim());
};

export const configValidationSchema = Joi.object({
  // --- App Configuration ---
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .required(),
  APP_NAME: Joi.string().default('Shamba Sure'),
  APP_VERSION: Joi.string().default('1.0.0'),
  PORT: Joi.number().default(3000), // Default to gateway port if not specified
  HOST: Joi.string().default('0.0.0.0'),
  GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000,http://localhost:5173')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  HEALTH_MEMORY_HEAP_THRESHOLD_MB: Joi.number().default(256),
  SERVICE_TIMEOUT: Joi.number().default(30000),

  // --- Service Ports (Matched to .env) ---
  GATEWAY_PORT: Joi.number().default(3000),
  ACCOUNTS_SERVICE_PORT: Joi.number().default(3001),
  DOCUMENTS_SERVICE_PORT: Joi.number().default(3002),
  FAMILY_SERVICE_PORT: Joi.number().default(3003),
  ESTATE_SERVICE_PORT: Joi.number().default(3004),
  SUCCESSION_AUTOMATION_SERVICE_PORT: Joi.number().default(3005),
  NOTIFICATIONS_SERVICE_PORT: Joi.number().default(3006),
  AUDITING_SERVICE_PORT: Joi.number().default(3007),

  // --- Service URLs ---
  ACCOUNTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  DOCUMENTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  FAMILY_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
  ESTATE_SERVICE_URL: Joi.string().uri().default('http://localhost:3004'),
  SUCCESSION_AUTOMATION_SERVICE_URL: Joi.string().uri().default('http://localhost:3005'),
  NOTIFICATIONS_SERVICE_URL: Joi.string().uri().default('http://localhost:3007'),
  AUDITING_SERVICE_URL: Joi.string().uri().default('http://localhost:3008'),

  // --- Database Configuration ---
  DATABASE_URL: Joi.string().required(),

  // --- Auth Configuration ---
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m').required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d').required(),
  BCRYPT_ROUNDS: Joi.number().default(10).required(),

  // --- Messaging Configuration ---
  RABBITMQ_URI: Joi.string().uri().optional(), // Added as optional since URL is primary
  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('shamba_events'),

  // ============================================================================
  // Enhanced Storage Configuration
  // ============================================================================
  STORAGE_PROVIDER: Joi.string()
    .valid('local', 's3', 'google-cloud', 'azure', 'minio') // Added 'minio'
    .default('local')
    .required(),
  STORAGE_LOCAL_PATH: Joi.string().when('STORAGE_PROVIDER', {
    is: 'local',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // File Size Limits
  STORAGE_MAX_FILE_SIZE_MB: Joi.number().default(50).min(1).max(500),
  STORAGE_MAX_IMAGE_SIZE_MB: Joi.number().default(10).min(1).max(100),

  // File Validation
  STORAGE_ALLOWED_MIME_TYPES: Joi.string()
    .default('application/pdf,image/jpeg,image/png')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),

  STORAGE_DANGEROUS_EXTENSIONS: Joi.string()
    .default('exe,sh,bat,js')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),

  STORAGE_STRICT_MIME_VALIDATION: Joi.boolean().default(true),
  STORAGE_ENABLE_SIZE_VALIDATION: Joi.boolean().default(true),

  // Security Features
  STORAGE_ENABLE_VIRUS_SCAN: Joi.boolean().default(false),
  STORAGE_ENABLE_CHECKSUM: Joi.boolean().default(true),
  STORAGE_ENABLE_ATOMIC_WRITES: Joi.boolean().default(true),

  // Storage Management
  STORAGE_QUOTA_MB: Joi.number().default(1024),
  STORAGE_TEMP_CLEANUP_HOURS: Joi.number().default(24),
  STORAGE_ENABLE_AUTO_CLEANUP: Joi.boolean().default(true),

  // Performance Settings
  STORAGE_STREAM_BUFFER_SIZE: Joi.number().default(65536),
  STORAGE_MAX_CONCURRENT_OPS: Joi.number().default(10),

  // Cloud Storage Configuration (Optional)
  STORAGE_S3_BUCKET: Joi.string().optional(),
  STORAGE_S3_REGION: Joi.string().optional(),
  STORAGE_S3_ACCESS_KEY_ID: Joi.string().optional(),
  STORAGE_S3_SECRET_ACCESS_KEY: Joi.string().optional(),

  // MinIO Configuration (Added)
  MINIO_BUCKET: Joi.string().optional(),
  MINIO_ENDPOINT: Joi.string().optional(),
  MINIO_PORT: Joi.number().optional(),
  MINIO_USE_SSL: Joi.boolean().optional(),
  MINIO_ACCESS_KEY: Joi.string().optional(),
  MINIO_SECRET_KEY: Joi.string().optional(),

  // --- Email Configuration ---
  EMAIL_PROVIDER: Joi.string().valid('smtp', 'sendgrid', 'ses').default('smtp'),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),
  EMAIL_SMTP_HOST: Joi.string().optional(),
  EMAIL_SMTP_PORT: Joi.number().optional(),
  EMAIL_SMTP_SECURE: Joi.boolean().optional(),
  EMAIL_SMTP_USER: Joi.string().optional(),
  EMAIL_SMTP_PASS: Joi.string().optional(),
  EMAIL_SENDGRID_API_KEY: Joi.string().optional(),

  // --- SMS Configuration ---
  SMS_PROVIDER: Joi.string().valid('africas-talking', 'twilio').optional(),
  SMS_AT_API_KEY: Joi.string().optional(),
  SMS_AT_USERNAME: Joi.string().optional(),
  SMS_AT_SHORTCODE: Joi.string().optional(),

  // --- External Services ---
  GOOGLE_MAPS_API_KEY: Joi.string().required(),
  LAND_REGISTRY_API_URL: Joi.string().uri().required(),
  LAND_REGISTRY_API_KEY: Joi.string().required(),

  // --- Security Configuration ---
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  SESSION_TIMEOUT_MINUTES: Joi.number().default(60),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  PASSWORD_MIN_LENGTH: Joi.number().default(8),
  PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: Joi.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: Joi.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL_CHARS: Joi.boolean().default(true),

  // --- Logging & Observability Configuration ---
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('simple'), // Default to simple for dev
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PATH: Joi.string().default('/metrics'),
  TRACING_ENABLED: Joi.boolean().default(false),
  TRACING_SERVICE_NAME: Joi.string().default('shamba-sure'),
  TRACING_EXPORTER: Joi.string().valid('console', 'jaeger', 'zipkin').default('console'),
});
