import { Module, Global } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { DatabaseService } from './services/database.service';
import { HealthController } from './health.controller';

/**
 * Database Module
 *
 * Provides:
 * - PrismaService: Low-level Prisma client access
 * - DatabaseService: High-level database operations
 * - HealthController: Health check endpoints
 *
 * Configuration:
 * - All database config is in libs/database/.env
 * - No dependency on @shamba/config package
 */
@Global() // Makes this module global so you don't need to import it everywhere
@Module({
  controllers: [HealthController],
  providers: [PrismaService, DatabaseService],
  exports: [PrismaService, DatabaseService],
})
export class DatabaseModule {}
