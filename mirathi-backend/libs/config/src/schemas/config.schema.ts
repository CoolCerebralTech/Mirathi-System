import * as Joi from 'joi';

// Helper to parse comma-separated strings
const commaSeparatedStringToArray = (value: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value.split(',').map((item) => item.trim());
};

export const configValidationSchema = Joi.object({
  // --- App Configuration ---
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_NAME: Joi.string().default('Shamba Sure'),
  APP_VERSION: Joi.string().default('1.0.0'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'), // Not in .env, but good default
  GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:5173')
    .custom(commaSeparatedStringToArray, 'Comma-separated string to array'),

  // --- Rate Limiting ---
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // --- Database ---
  DATABASE_URL: Joi.string().required(),

  // --- Authentication ---
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(10),

  // --- Messaging (RabbitMQ) ---
  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_URL: Joi.string().uri().optional(), // In .env for consistency
  RABBITMQ_EXCHANGE: Joi.string().default('shamba_events'),

  // --- Storage (MinIO & Documents) ---
  // MinIO Specifics
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().allow('').optional(),
  MINIO_SECRET_KEY: Joi.string().allow('').optional(),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_BUCKET: Joi.string().default('documents-temp'),

  // Document Settings
  MAX_FILE_SIZE_MB: Joi.number().default(10),
  DOCUMENT_EXPIRY_DAYS: Joi.number().default(7),

  // --- Email ---
  EMAIL_PROVIDER: Joi.string().default('smtp'),
  EMAIL_FROM_ADDRESS: Joi.string().email().required(),
  EMAIL_SMTP_HOST: Joi.string().default('localhost'),
  EMAIL_SMTP_PORT: Joi.number().default(1025),
  EMAIL_SMTP_SECURE: Joi.boolean().default(false),
  EMAIL_SMTP_USER: Joi.string().allow('').optional(),
  EMAIL_SMTP_PASS: Joi.string().allow('').optional(),

  // --- SMS ---
  SMS_PROVIDER: Joi.string().default('africas-talking'),

  // Africa's Talking (Long keys)
  AFRICAS_TALKING_API_KEY: Joi.string().optional(),
  AFRICAS_TALKING_USERNAME: Joi.string().default('sandbox'),
  AFRICAS_TALKING_SHORT_CODE: Joi.string().default('SHAMBA'),

  // Africa's Talking (Short keys)
  SMS_AT_API_KEY: Joi.string().optional(),
  SMS_AT_USERNAME: Joi.string().optional(),
  SMS_AT_SHORTCODE: Joi.string().optional(),

  // --- External Services ---
  GOOGLE_MAPS_API_KEY: Joi.string().required(),
  LAND_REGISTRY_API_URL: Joi.string().uri().required(),
  LAND_REGISTRY_API_KEY: Joi.string().required(),

  // --- Security ---
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  SESSION_TIMEOUT_MINUTES: Joi.number().default(60),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  PASSWORD_MIN_LENGTH: Joi.number().default(8),
  PASSWORD_REQUIRE_UPPERCASE: Joi.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: Joi.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: Joi.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL_CHARS: Joi.boolean().default(true),

  // --- Logging & Observability ---
  LOG_LEVEL: Joi.string().default('info'),
  LOG_FORMAT: Joi.string().default('simple'),
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PATH: Joi.string().default('/metrics'),
  TRACING_ENABLED: Joi.boolean().default(false),
  TRACING_SERVICE_NAME: Joi.string().default('shamba-sure'),
  TRACING_EXPORTER: Joi.string().default('console'),

  // --- Service URLs ---
  ACCOUNTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  DOCUMENTS_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  FAMILY_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
  ESTATE_SERVICE_URL: Joi.string().uri().default('http://localhost:3004'),
  SUCCESSION_AUTOMATION_SERVICE_URL: Joi.string().uri().default('http://localhost:3005'),

  // --- Service Ports ---
  GATEWAY_PORT: Joi.number().default(3000),
  ACCOUNTS_SERVICE_PORT: Joi.number().default(3001),
  DOCUMENTS_SERVICE_PORT: Joi.number().default(3002),
  FAMILY_SERVICE_PORT: Joi.number().default(3003),
  ESTATE_SERVICE_PORT: Joi.number().default(3004),
  SUCCESSION_AUTOMATION_SERVICE_PORT: Joi.number().default(3005),
});
