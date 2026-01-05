// apps/family-service/src/family.module.ts
import { Module } from '@nestjs/common';

import { AuthModule } from '@shamba/auth';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule, MessagingService } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

// Application Layer
import { FamilyService } from './application/services/family.service';
import { GuardianshipService } from './application/services/guardianship.service';
// Infrastructure Layer
import { FamilyRepository } from './infrastructure/repositories/family.repository';
// Injection Tokens
import { EVENT_PUBLISHER, FAMILY_REPOSITORY } from './injection.tokens';
// Presentation Layer
import { FamilyController } from './presentation/controllers/family.controller';
import { GuardianshipController } from './presentation/controllers/guardianship.controller';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    DatabaseModule,
    MessagingModule.register({}),
    ObservabilityModule.register({
      serviceName: 'family-service',
      version: '1.0.0',
    }),
  ],
  controllers: [FamilyController, GuardianshipController, HealthController],
  providers: [
    // Services
    FamilyService,
    GuardianshipService,

    // Repository
    {
      provide: FAMILY_REPOSITORY,
      useClass: FamilyRepository,
    },

    // Event Publisher (Critical for messaging)
    {
      provide: EVENT_PUBLISHER,
      useExisting: MessagingService,
    },
  ],
  exports: [FamilyService, GuardianshipService],
})
export class FamilyModule {}
