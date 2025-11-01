import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './services/prisma.service';
import { DatabaseService } from './services/database.service';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [PrismaService, DatabaseService],
  exports: [
    PrismaService,
    DatabaseService,
  ],
})
export class DatabaseModule {}
