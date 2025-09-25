import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../services/prisma.service';
import { DatabaseService } from '../services/database.service';
import { HealthService } from '../services/health.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, DatabaseService, HealthService],
  exports: [PrismaService, DatabaseService, HealthService],
})
export class DatabaseModule {}