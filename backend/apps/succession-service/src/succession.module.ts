import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { WillsController } from './controllers/wills.controller';
import { AssetsController } from './controllers/assets.controller';
import { FamiliesController } from './controllers/families.controller';
import { WillService } from './services/will.service';
import { AssetService } from './services/asset.service';
import { FamilyService } from './services/family.service';
import { WillRepository } from './repositories/will.repository';
import { AssetRepository } from './repositories/asset.repository';
import { FamilyRepository } from './repositories/family.repository';
import { SuccessionEvents } from './events/succession.events';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.forRoot(),
    ObservabilityModule.forRoot(),
  ],
  controllers: [WillsController, AssetsController, FamiliesController],
  providers: [
    WillService,
    AssetService,
    FamilyService,
    WillRepository,
    AssetRepository,
    FamilyRepository,
    SuccessionEvents,
  ],
  exports: [WillService, AssetService, FamilyService],
})
export class SuccessionModule {}