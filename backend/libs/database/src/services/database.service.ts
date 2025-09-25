import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<{ status: string; details: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', details: 'Database connection is healthy' };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'error', details: 'Database connection failed' };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const [
      userCount,
      willCount,
      assetCount,
      documentCount,
      familyCount
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.will.count(),
      this.prisma.asset.count(),
      this.prisma.document.count(),
      this.prisma.family.count(),
    ]);

    return {
      users: userCount,
      wills: willCount,
      assets: assetCount,
      documents: documentCount,
      families: familyCount,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Backup database (simplified version)
   */
  async createBackup(): Promise<{ success: boolean; message: string }> {
    try {
      // In production, you'd use pg_dump or similar
      this.logger.log('Database backup initiated');
      
      // This is a placeholder for actual backup logic
      // You would integrate with your backup service here
      
      return { 
        success: true, 
        message: 'Backup process initiated successfully' 
      };
    } catch (error) {
      this.logger.error('Backup failed', error);
      return { 
        success: false, 
        message: `Backup failed: ${error.message}` 
      };
    }
  }

  /**
   * Clean up old data (archiving)
   */
  async cleanupOldData(daysOld: number = 365): Promise<{ deletedCount: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Example: Clean up old audit logs (you'd customize based on your retention policy)
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      this.logger.log(`Cleaned up ${result.count} old records`);
      return { deletedCount: result.count };
    } catch (error) {
      this.logger.error('Data cleanup failed', error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Execute raw SQL query (with safety checks)
   */
  async executeRaw<T = any>(query: string, parameters: any[] = []): Promise<T[]> {
    // Safety check - prevent destructive operations in production
    if (process.env.NODE_ENV === 'production') {
      const destructiveKeywords = ['drop', 'delete', 'truncate', 'alter'];
      const lowerQuery = query.toLowerCase();
      
      if (destructiveKeywords.some(keyword => lowerQuery.includes(keyword))) {
        throw new Error('Destructive operations are not allowed in production');
      }
    }

    return this.prisma.$queryRawUnsafe(query, ...parameters);
  }
}