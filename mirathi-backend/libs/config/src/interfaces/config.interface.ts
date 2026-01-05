// ============================================================================
// Shamba Sure - Core Configuration Interface
// ============================================================================
import { Environment } from '../types';

export interface AppConfig {
  NODE_ENV: Environment;
  APP_NAME: string;
  APP_VERSION: string;
  PORT: number;
  HOST: string;
  GLOBAL_PREFIX: string;
  /** Comma-separated list of allowed origins (parsed into array) */
  CORS_ORIGINS: string[];

  // Rate Limiting
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_LIMIT: number;
}

export interface DatabaseConfig {
  DATABASE_URL: string;
}

export interface AuthConfig {
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRATION: string;
  BCRYPT_ROUNDS: number;
}

export interface MessagingConfig {
  RABBITMQ_URI: string;
  RABBITMQ_URL: string; // Included for consistency per your .env
  RABBITMQ_EXCHANGE: string;
}

export interface StorageConfig {
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_USE_SSL: boolean;
  MINIO_BUCKET: string;

  // Document Specific Settings (Matches your .env)
  MAX_FILE_SIZE_MB: number;
  DOCUMENT_EXPIRY_DAYS: number;
}

export interface EmailConfig {
  EMAIL_PROVIDER: 'smtp' | 'sendgrid' | 'ses';
  EMAIL_FROM_ADDRESS: string;
  EMAIL_SMTP_HOST?: string;
  EMAIL_SMTP_PORT?: number;
  EMAIL_SMTP_SECURE?: boolean;
  EMAIL_SMTP_USER?: string;
  EMAIL_SMTP_PASS?: string;
}

export interface SmsConfig {
  SMS_PROVIDER: 'africas-talking' | 'twilio';

  // Africa's Talking (Long form from .env)
  AFRICAS_TALKING_API_KEY?: string;
  AFRICAS_TALKING_USERNAME?: string;
  AFRICAS_TALKING_SHORT_CODE?: string;

  // Africa's Talking (Short form from .env)
  SMS_AT_API_KEY?: string;
  SMS_AT_USERNAME?: string;
  SMS_AT_SHORTCODE?: string;
}

export interface ExternalServicesConfig {
  GOOGLE_MAPS_API_KEY: string;
  LAND_REGISTRY_API_URL: string;
  LAND_REGISTRY_API_KEY: string;
}

export interface SecurityConfig {
  ENCRYPTION_KEY: string;
  SESSION_TIMEOUT_MINUTES: number;
  MAX_LOGIN_ATTEMPTS: number;
  PASSWORD_MIN_LENGTH: number;
  PASSWORD_REQUIRE_UPPERCASE: boolean;
  PASSWORD_REQUIRE_LOWERCASE: boolean;
  PASSWORD_REQUIRE_NUMBERS: boolean;
  PASSWORD_REQUIRE_SPECIAL_CHARS: boolean;
}

export interface LoggingConfig {
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  LOG_FORMAT: 'json' | 'simple';
  METRICS_ENABLED: boolean;
  METRICS_PATH: string;
  TRACING_ENABLED: boolean;
  TRACING_SERVICE_NAME: string;
  TRACING_EXPORTER: 'console' | 'jaeger' | 'zipkin';
}

export interface ServicePortsConfig {
  GATEWAY_PORT: number;
  ACCOUNTS_SERVICE_PORT: number;
  DOCUMENTS_SERVICE_PORT: number;
  FAMILY_SERVICE_PORT: number;
  ESTATE_SERVICE_PORT: number;
  SUCCESSION_AUTOMATION_SERVICE_PORT: number;
  NOTIFICATIONS_SERVICE_PORT: number;
  AUDITING_SERVICE_PORT: number;
}

export interface ServiceUrlsConfig {
  ACCOUNTS_SERVICE_URL: string;
  DOCUMENTS_SERVICE_URL: string;
  FAMILY_SERVICE_URL: string;
  ESTATE_SERVICE_URL: string;
  SUCCESSION_AUTOMATION_SERVICE_URL: string;
  NOTIFICATIONS_SERVICE_URL: string;
  AUDITING_SERVICE_URL: string;
}

/**
 * The complete, flattened configuration interface.
 */
export interface Config
  extends
    AppConfig,
    DatabaseConfig,
    ServicePortsConfig,
    ServiceUrlsConfig,
    AuthConfig,
    MessagingConfig,
    StorageConfig,
    EmailConfig,
    SmsConfig,
    ExternalServicesConfig,
    SecurityConfig,
    LoggingConfig {}
