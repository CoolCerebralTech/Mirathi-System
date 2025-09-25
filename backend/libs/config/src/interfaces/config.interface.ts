export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  timeout: number;
  ssl: boolean;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiration: string;
  refreshTokenSecret: string;
  refreshTokenExpiration: string;
  bcryptRounds: number;
}

export interface AppConfig {
  name: string;
  version: string;
  port: number;
  environment: 'development' | 'production' | 'test';
  globalPrefix: string;
  corsOrigins: string[];
  rateLimit: {
    ttl: number;
    limit: number;
  };
}

export interface MessagingConfig {
  rabbitMqUri: string;
  exchange: string;
  queues: {
    userEvents: string;
    documentEvents: string;
    notificationEvents: string;
    auditEvents: string;
  };
}

export interface StorageConfig {
  provider: 'local' | 's3' | 'google-cloud';
  localPath: string;
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses';
  fromAddress: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
}

export interface SmsConfig {
  provider: 'africas-talking' | 'twilio';
  africasTalking?: {
    apiKey: string;
    username: string;
    shortCode: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface ExternalServicesConfig {
  googleMaps: {
    apiKey: string;
  };
  landRegistry: {
    apiUrl: string;
    apiKey: string;
  };
}

export interface SecurityConfig {
  encryptionKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  format: 'json' | 'simple';
  transports: ('console' | 'file' | 'cloudwatch')[];
  file?: {
    filename: string;
    maxSize: string;
    maxFiles: string;
  };
}

export interface ShambaConfig {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  messaging: MessagingConfig;
  storage: StorageConfig;
  email: EmailConfig;
  sms: SmsConfig;
  externalServices: ExternalServicesConfig;
  security: SecurityConfig;
  logging: LoggingConfig;
}