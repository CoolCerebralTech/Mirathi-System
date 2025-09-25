import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('Shamba Sure'),
  APP_VERSION: Joi.string().default('1.0.0'),
  PORT: Joi.number().default(3000),
  GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('*'),
  
  // Database Configuration
  DATABASE_URL: Joi.string().required(),
  DATABASE_MAX_CONNECTIONS: Joi.number().default(10),
  DATABASE_TIMEOUT: Joi.number().default(30000),
  DATABASE_SSL: Joi.boolean().default(false),
  
  // Auth Configuration
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),
  
  // Messaging Configuration
  RABBITMQ_URI: Joi.string().required(),
  RABBITMQ_EXCHANGE: Joi.string().default('shamba_events'),
  
  // Storage Configuration
  STORAGE_PROVIDER: Joi.string().valid('local', 's3', 'google-cloud').default('local'),
  STORAGE_LOCAL_PATH: Joi.string().default('./uploads'),
  STORAGE_MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  STORAGE_ALLOWED_MIME_TYPES: Joi.string().default('image/jpeg,image/png,application/pdf'),
  
  // S3 Configuration (if using AWS S3)
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
  
  // Email Configuration
  EMAIL_PROVIDER: Joi.string().valid('smtp', 'sendgrid', 'ses').default('smtp'),
  EMAIL_FROM_ADDRESS: Joi.string().email().default('noreply@shambasure.com'),
  
  // SMTP Configuration
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  
  // SMS Configuration
  SMS_PROVIDER: Joi.string().valid('africas-talking', 'twilio').optional(),
  
  // Africa's Talking Configuration
  AFRICAS_TALKING_API_KEY: Joi.string().optional(),
  AFRICAS_TALKING_USERNAME: Joi.string().optional(),
  AFRICAS_TALKING_SHORT_CODE: Joi.string().optional(),
  
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: Joi.string().optional(),
  TWILIO_AUTH_TOKEN: Joi.string().optional(),
  TWILIO_FROM_NUMBER: Joi.string().optional(),
  
  // External Services
  GOOGLE_MAPS_API_KEY: Joi.string().optional(),
  LAND_REGISTRY_API_URL: Joi.string().optional(),
  LAND_REGISTRY_API_KEY: Joi.string().optional(),
  
  // Security Configuration
  ENCRYPTION_KEY: Joi.string().required(),
  SESSION_TIMEOUT: Joi.number().default(3600),
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  
  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  LOG_TRANSPORTS: Joi.string().default('console'),
  
  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),
});