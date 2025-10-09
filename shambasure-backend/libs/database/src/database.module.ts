import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from './services/prisma.service';
import { DatabaseService } from './services/database.service';
import { HealthService } from './services/health.service';
import { PrismaHealthIndicator } from './indicators/prisma-health.indicator';

@Module({
  imports: [
    ConfigModule,
    // TerminusModule is required for the health check infrastructure
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
    }),
  ],
  providers: [PrismaService, DatabaseService, HealthService, PrismaHealthIndicator],
  exports: [
    PrismaService,
    DatabaseService,
    HealthService, // Export the HealthService so other modules can use it
  ],
})
export class DatabaseModule {}
