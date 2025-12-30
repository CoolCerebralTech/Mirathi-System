import { Global, Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { DatabaseService } from './services/database.service';
import { PrismaService } from './services/prisma.service';

/**
 * Database Module
 *
 * Responsibilities:
 * - PrismaService: Low-level database access, pooling, transactions
 * - DatabaseService: High-level database façade (future-safe)
 * - HealthController: Operational health & readiness endpoints
 *
 * Notes:
 * - This module is global by design
 * - No domain or application logic should live here
 * - No dependency on external config packages
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
