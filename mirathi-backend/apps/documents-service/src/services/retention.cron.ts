import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@shamba/database';

import { MinioService } from '../adapters/minio.service';

@Injectable()
export class RetentionCronService {
  private readonly logger = new Logger(RetentionCronService.name);

  constructor(
    private prisma: PrismaService,
    private minioService: MinioService,
  ) {}

  /**
   * Runs every hour.
   * Finds documents that are VERIFIED and passed their expiresAt time.
   * Deletes them from MinIO to ensure user privacy.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpVerifiedDocuments() {
    this.logger.log('Running Retention Policy Check...');

    const now = new Date();

    // Find documents where:
    // 1. We set an expiration date (meaning they were verified)
    // 2. The expiration date has passed
    // 3. We haven't marked them as deleted yet
    const docsToDelete = await this.prisma.document.findMany({
      where: {
        expiresAt: { lt: now },
        deletedAt: null,
        versions: { some: {} }, // Only get ones with files
      },
      include: { versions: true },
    });

    for (const doc of docsToDelete) {
      try {
        // 1. Delete actual files from MinIO
        for (const version of doc.versions) {
          await this.minioService.deleteFile(version.storagePath);
        }

        // 2. Mark DB record as "soft deleted" (or just remove the link to the file)
        // We set deletedAt to indicate the FILE is gone, but the RECORD status stays VERIFIED.
        await this.prisma.document.update({
          where: { id: doc.id },
          data: { deletedAt: now },
        });

        this.logger.log(`Retention: Purged files for Document ${doc.id}`);
      } catch (err) {
        this.logger.error(`Failed to purge document ${doc.id}: ${err.message}`);
      }
    }
  }
}
