import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

import { ConfigService } from '@shamba/config';

@Injectable()
export class MinioService {
  private minioClient: Minio.Client;
  private bucketName: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    // 1. Retrieve configuration values
    this.bucketName = (this.configService.get('MINIO_BUCKET') as string) || 'documents';

    const endPoint = (this.configService.get('MINIO_ENDPOINT') as string) || 'localhost';
    const port = Number(this.configService.get('MINIO_PORT')) || 9000;

    // Fix: Joi validation ensures this is returned as a boolean or undefined.
    // We default to false if it's undefined.
    const useSSL = this.configService.get('MINIO_USE_SSL') === true;

    const accessKey = this.configService.get('MINIO_ACCESS_KEY') as string;
    const secretKey = this.configService.get('MINIO_SECRET_KEY') as string;

    // 2. Initialize MinIO Client
    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  /**
   * Uploads a buffer to MinIO.
   * Creates the bucket if it doesn't exist.
   */
  async uploadFile(path: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Created bucket: ${this.bucketName}`);
      }

      await this.minioClient.putObject(this.bucketName, path, fileBuffer, fileBuffer.length, {
        'Content-Type': mimeType,
      });

      return path;
    } catch (error) {
      this.logger.error(`MinIO Upload Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates a temporary link (valid for 1 hour) for viewing the file.
   */
  async getPresignedUrl(path: string): Promise<string> {
    try {
      // 3600 seconds = 1 hour validity
      return await this.minioClient.presignedGetObject(this.bucketName, path, 3600);
    } catch (error) {
      this.logger.error(`MinIO URL Gen Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Permanently deletes a file from storage.
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, path);
      this.logger.log(`Permanently deleted file: ${path}`);
    } catch (error) {
      this.logger.warn(`MinIO Delete Warning: ${error.message}`);
    }
  }
}
