// ============================================================================
// Shamba Sure - Core Configuration Interface v2.0
// ============================================================================
// This interface defines a flattened structure that maps directly to
// environment variables (e.g., `jwtSecret` -> `JWT_SECRET`).
// It simplifies validation and integration with NestJS ConfigModule.
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
  RATE_LIMIT_TTL: number;
  RATE_LIMIT_LIMIT: number;
  HEALTH_MEMORY_HEAP_THRESHOLD_MB: number;
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
  RABBITMQ_URL: string;
}

export interface StorageConfig {
  STORAGE_PROVIDER: 'local' | 's3' | 'google-cloud';
  STORAGE_LOCAL_PATH: string;
  STORAGE_S3_BUCKET?: string;
  STORAGE_S3_REGION?: string;
  STORAGE_S3_ACCESS_KEY_ID?: string;
  STORAGE_S3_SECRET_ACCESS_KEY?: string;
  STORAGE_MAX_FILE_SIZE_MB: number;
  /** Comma-separated list of allowed MIME types (parsed into array) */
  STORAGE_ALLOWED_MIME_TYPES: string[];
}

export interface EmailConfig {
  EMAIL_PROVIDER: 'smtp' | 'sendgrid' | 'ses';
  EMAIL_FROM_ADDRESS: string;
  EMAIL_SMTP_HOST?: string;
  EMAIL_SMTP_PORT?: number;
  EMAIL_SMTP_SECURE?: boolean;
  EMAIL_SMTP_USER?: string;
  EMAIL_SMTP_PASS?: string;
  EMAIL_SENDGRID_API_KEY?: string;
}

export interface SmsConfig {
  SMS_PROVIDER: 'africas-talking' | 'twilio';
  SMS_AT_API_KEY?: string;
  SMS_AT_USERNAME?: string;
  SMS_AT_SHORTCODE?: string;
  SMS_TWILIO_ACCOUNT_SID?: string;
  SMS_TWILIO_AUTH_TOKEN?: string;
  SMS_TWILIO_FROM_NUMBER?: string;
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
}

export interface ServiceConfig {
  SERVICE_TIMEOUT: number;
}

export interface ServicePortsConfig {
  ACCOUNTS_SERVICE_PORT: number;
  DOCUMENTS_SERVICE_PORT: number;
  SUCCESSION_SERVICE_PORT: number;
  AUDITING_SERVICE_PORT: number;
  NOTIFICATIONS_SERVICE_PORT: number;
}

export interface ServiceUrlsConfig {
  GATEWAY_PORT: number; // For the gateway itself
  ACCOUNTS_SERVICE_URL: string;
  DOCUMENTS_SERVICE_URL: string;
  SUCCESSION_SERVICE_URL: string;
}

/**
 * The complete, flattened configuration interface for the entire application.
 * This is the final shape of the object provided by the ConfigService.
 */
export interface Config
  extends AppConfig,
    DatabaseConfig,
    ServiceConfig,
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
