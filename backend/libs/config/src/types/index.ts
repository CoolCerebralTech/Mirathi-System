export * from '../interfaces/config.interface';

export type Environment = 'development' | 'production' | 'test';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigUpdateEvent {
  timestamp: Date;
  changes: string[];
  source: string;
}