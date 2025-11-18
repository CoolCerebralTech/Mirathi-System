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
  CORS_ORIGINS: string;
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
  REFRESH_TOKEN_SECRET: string | number;
  REFRESH_TOKEN_EXPIRATION: string | number;
  BCRYPT_ROUNDS: number;
}

export interface MessagingConfig {
  RABBITMQ_URL: string;
}

// ============================================================================
// Enhanced Storage Configuration
// ============================================================================

export interface StorageConfig {
  // Provider Configuration
  STORAGE_PROVIDER: 'local' | 's3' | 'google-cloud' | 'azure';
  STORAGE_LOCAL_PATH: string;

  // File Size Limits
  STORAGE_MAX_FILE_SIZE_MB: number;
  STORAGE_MAX_IMAGE_SIZE_MB: number;

  // File Validation
  /** Comma-separated list of allowed MIME types (parsed into array) */
  STORAGE_ALLOWED_MIME_TYPES: string[];
  /** Comma-separated list of dangerous extensions (parsed into array) */
  STORAGE_DANGEROUS_EXTENSIONS: string[];
  STORAGE_STRICT_MIME_VALIDATION: boolean;
  STORAGE_ENABLE_SIZE_VALIDATION: boolean;

  // Security Features
  STORAGE_ENABLE_VIRUS_SCAN: boolean;
  STORAGE_ENABLE_CHECKSUM: boolean;
  STORAGE_ENABLE_ATOMIC_WRITES: boolean;

  // Storage Management
  STORAGE_QUOTA_MB: number;
  STORAGE_TEMP_CLEANUP_HOURS: number;
  STORAGE_ENABLE_AUTO_CLEANUP: boolean;

  // Performance Settings
  STORAGE_STREAM_BUFFER_SIZE: number;
  STORAGE_MAX_CONCURRENT_OPS: number;

  // Cloud Storage (Optional)
  STORAGE_S3_BUCKET?: string;
  STORAGE_S3_REGION?: string;
  STORAGE_S3_ACCESS_KEY_ID?: string;
  STORAGE_S3_SECRET_ACCESS_KEY?: string;
  STORAGE_GOOGLE_CLOUD_BUCKET?: string;
  STORAGE_GOOGLE_CLOUD_PROJECT_ID?: string;
  STORAGE_AZURE_CONTAINER_NAME?: string;
  STORAGE_AZURE_CONNECTION_STRING?: string;
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
  METRICS_ENABLED: boolean;
  METRICS_PATH: string;
  TRACING_ENABLED: boolean;
  TRACING_SERVICE_NAME: string;
  TRACING_EXPORTER: 'console' | 'jaeger' | 'zipkin';
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
  NOTIFICATIONS_SERVICE_URL: string;
  AUDITING_SERVICE_URL: string;
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
