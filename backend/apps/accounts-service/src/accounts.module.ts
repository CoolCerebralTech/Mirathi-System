import { Module } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { UserService } from './services/user.service';
import { ProfileService } from './services/profile.service';
import { UserRepository } from './repositories/user.repository';
import { UserEvents } from './events/user.events';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    MessagingModule.forRoot(),
    ObservabilityModule.forRoot(),
  ],
  controllers: [AuthController, UsersController],
  providers: [UserService, ProfileService, UserRepository, UserEvents],
  exports: [UserService, UserRepository],
})
export class AccountsModule {}