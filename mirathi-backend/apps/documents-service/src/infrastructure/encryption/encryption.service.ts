// apps/documents-service/src/infrastructure/encryption/encryption.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { ConfigService } from '@shamba/config';

export interface IEncryptionService {
  encrypt(data: string): string;
  decrypt(encryptedData: string): string;
}

@Injectable()
export class EncryptionService implements IEncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encryptionKey = this.configService.get('ENCRYPTION_KEY');

    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
          'Generate one with: openssl rand -hex 32',
      );
    }

    this.key = Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Encrypts a string using AES-256-GCM
   * Format: iv:authTag:encryptedData (all hex encoded)
   */
  encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Return: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data encrypted with the encrypt() method
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Creates a hash of data (one-way, for comparisons)
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
