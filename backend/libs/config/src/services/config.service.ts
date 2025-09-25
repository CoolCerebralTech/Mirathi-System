import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ShambaConfig } from '../interfaces/config.interface';

@Injectable()
export class ShambaConfigService {
  private readonly logger = new Logger(ShambaConfigService.name);

  constructor(private nestConfigService: NestConfigService) {}

  get app() {
    return {
      name: this.getRequired('APP_NAME'),
      version: this.getRequired('APP_VERSION'),
      port: this.getNumber('PORT', 3000),
      environment: this.getRequired('NODE_ENV') as 'development' | 'production' | 'test',
      globalPrefix: this.get('GLOBAL_PREFIX', 'api'),
      corsOrigins: this.getCorsOrigins(),
      rateLimit: {
        ttl: this.getNumber('RATE_LIMIT_TTL', 60),
        limit: this.getNumber('RATE_LIMIT_LIMIT', 100),
      },
    };
  }

  get database() {
    return {
      url: this.getRequired('DATABASE_URL'),
      maxConnections: this.getNumber('DATABASE_MAX_CONNECTIONS', 10),
      timeout: this.getNumber('DATABASE_TIMEOUT', 30000),
      ssl: this.getBoolean('DATABASE_SSL', false),
    };
  }

  get auth() {
    return {
      jwtSecret: this.getRequired('JWT_SECRET'),
      jwtExpiration: this.get('JWT_EXPIRATION', '15m'),
      refreshTokenSecret: this.getRequired('REFRESH_TOKEN_SECRET'),
      refreshTokenExpiration: this.get('REFRESH_TOKEN_EXPIRATION', '7d'),
      bcryptRounds: this.getNumber('BCRYPT_ROUNDS', 12),
    };
  }

  get messaging() {
    return {
      rabbitMqUri: this.getRequired('RABBITMQ_URI'),
      exchange: this.get('RABBITMQ_EXCHANGE', 'shamba_events'),
      queues: {
        userEvents: 'user_events',
        documentEvents: 'document_events',
        notificationEvents: 'notification_events',
        auditEvents: 'audit_events',
      },
    };
  }

  get storage() {
    return {
      provider: this.get('STORAGE_PROVIDER', 'local') as 'local' | 's3' | 'google-cloud',
      localPath: this.get('STORAGE_LOCAL_PATH', './uploads'),
      s3: this.getS3Config(),
      maxFileSize: this.getNumber('STORAGE_MAX_FILE_SIZE', 10485760),
      allowedMimeTypes: this.getAllowedMimeTypes(),
    };
  }

  get email() {
    return {
      provider: this.get('EMAIL_PROVIDER', 'smtp') as 'smtp' | 'sendgrid' | 'ses',
      fromAddress: this.get('EMAIL_FROM_ADDRESS', 'noreply@shambasure.com'),
      smtp: this.getSmtpConfig(),
      sendgrid: this.getSendgridConfig(),
    };
  }

  get sms() {
    return {
      provider: this.get('SMS_PROVIDER') as 'africas-talking' | 'twilio' | undefined,
      africasTalking: this.getAfricasTalkingConfig(),
      twilio: this.getTwilioConfig(),
    };
  }

  get externalServices() {
    return {
      googleMaps: {
        apiKey: this.get('GOOGLE_MAPS_API_KEY'),
      },
      landRegistry: {
        apiUrl: this.get('LAND_REGISTRY_API_URL'),
        apiKey: this.get('LAND_REGISTRY_API_KEY'),
      },
    };
  }

  get security() {
    return {
      encryptionKey: this.getRequired('ENCRYPTION_KEY'),
      sessionTimeout: this.getNumber('SESSION_TIMEOUT', 3600),
      maxLoginAttempts: this.getNumber('MAX_LOGIN_ATTEMPTS', 5),
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
    };
  }

  get logging() {
    return {
      level: this.get('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug' | 'verbose',
      format: this.get('LOG_FORMAT', 'json') as 'json' | 'simple',
      transports: this.getLogTransports(),
      file: this.getFileLogConfig(),
    };
  }

  /**
   * Get entire configuration object
   */
  getConfig(): ShambaConfig {
    return {
      app: this.app,
      database: this.database,
      auth: this.auth,
      messaging: this.messaging,
      storage: this.storage,
      email: this.email,
      sms: this.sms,
      externalServices: this.externalServices,
      security: this.security,
      logging: this.logging,
    };
  }

  /**
   * Validate that all required configuration is present
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required configurations
    const requiredConfigs = [
      'DATABASE_URL',
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'RABBITMQ_URI',
      'ENCRYPTION_KEY',
    ];

    for (const configKey of requiredConfigs) {
      if (!this.nestConfigService.get(configKey)) {
        errors.push(`Missing required configuration: ${configKey}`);
      }
    }

    // Validate specific configurations
    if (this.storage.provider === 's3') {
      const s3Required = ['AWS_S3_BUCKET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
      for (const configKey of s3Required) {
        if (!this.nestConfigService.get(configKey)) {
          errors.push(`S3 storage selected but missing: ${configKey}`);
        }
      }
    }

    if (this.email.provider === 'smtp') {
      const smtpRequired = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
      for (const configKey of smtpRequired) {
        if (!this.nestConfigService.get(configKey)) {
          errors.push(`SMTP email selected but missing: ${configKey}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get configuration value with fallback
   */
  private get(key: string, defaultValue?: any): any {
    return this.nestConfigService.get(key) ?? defaultValue;
  }

  /**
   * Get required configuration value (throws if missing)
   */
  private getRequired(key: string): any {
    const value = this.nestConfigService.get(key);
    if (value === undefined || value === null) {
      throw new Error(`Required configuration missing: ${key}`);
    }
    return value;
  }

  /**
   * Get number configuration value
   */
  private getNumber(key: string, defaultValue: number): number {
    const value = this.nestConfigService.get(key);
    return value ? Number(value) : defaultValue;
  }

  /**
   * Get boolean configuration value
   */
  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.nestConfigService.get(key);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value ? Boolean(value) : defaultValue;
  }

  /**
   * Parse CORS origins from string
   */
  private getCorsOrigins(): string[] {
    const origins = this.get('CORS_ORIGINS', '*');
    if (origins === '*') return ['*'];
    return origins.split(',').map(origin => origin.trim());
  }

  /**
   * Parse allowed MIME types from string
   */
  private getAllowedMimeTypes(): string[] {
    const types = this.get('STORAGE_ALLOWED_MIME_TYPES', 'image/jpeg,image/png,application/pdf');
    return types.split(',').map(type => type.trim());
  }

  /**
   * Parse log transports from string
   */
  private getLogTransports(): ('console' | 'file' | 'cloudwatch')[] {
    const transports = this.get('LOG_TRANSPORTS', 'console');
    return transports.split(',').map(transport => transport.trim()) as any;
  }

  /**
   * Get S3 configuration if available
   */
  private getS3Config() {
    const bucket = this.get('AWS_S3_BUCKET');
    if (!bucket) return undefined;

    return {
      bucket,
      region: this.getRequired('AWS_REGION'),
      accessKeyId: this.getRequired('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.getRequired('AWS_SECRET_ACCESS_KEY'),
    };
  }

  /**
   * Get SMTP configuration if available
   */
  private getSmtpConfig() {
    const host = this.get('SMTP_HOST');
    if (!host) return undefined;

    return {
      host,
      port: this.getNumber('SMTP_PORT', 587),
      secure: this.getBoolean('SMTP_SECURE', false),
      auth: {
        user: this.getRequired('SMTP_USER'),
        pass: this.getRequired('SMTP_PASS'),
      },
    };
  }

  /**
   * Get SendGrid configuration if available
   */
  private getSendgridConfig() {
    const apiKey = this.get('SENDGRID_API_KEY');
    if (!apiKey) return undefined;

    return { apiKey };
  }

  /**
   * Get Africa's Talking configuration if available
   */
  private getAfricasTalkingConfig() {
    const apiKey = this.get('AFRICAS_TALKING_API_KEY');
    if (!apiKey) return undefined;

    return {
      apiKey,
      username: this.getRequired('AFRICAS_TALKING_USERNAME'),
      shortCode: this.get('AFRICAS_TALKING_SHORT_CODE'),
    };
  }

  /**
   * Get Twilio configuration if available
   */
  private getTwilioConfig() {
    const accountSid = this.get('TWILIO_ACCOUNT_SID');
    if (!accountSid) return undefined;

    return {
      accountSid,
      authToken: this.getRequired('TWILIO_AUTH_TOKEN'),
      fromNumber: this.getRequired('TWILIO_FROM_NUMBER'),
    };
  }

  /**
   * Get file log configuration if file transport is enabled
   */
  private getFileLogConfig() {
    const transports = this.getLogTransports();
    if (!transports.includes('file')) return undefined;

    return {
      filename: this.get('LOG_FILE_NAME', 'shamba-sure.log'),
      maxSize: this.get('LOG_FILE_MAX_SIZE', '10m'),
      maxFiles: this.get('LOG_FILE_MAX_FILES', '5'),
    };
  }

  /**
   * Check if current environment is production
   */
  isProduction(): boolean {
    return this.app.environment === 'production';
  }

  /**
   * Check if current environment is development
   */
  isDevelopment(): boolean {
    return this.app.environment === 'development';
  }

  /**
   * Check if current environment is test
   */
  isTest(): boolean {
    return this.app.environment === 'test';
  }
}