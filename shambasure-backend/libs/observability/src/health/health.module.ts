import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { MessagingHealthIndicator } from './messaging-health.indicator';

// The PrismaHealthIndicator is provided by the DatabaseModule, which should be
// imported in the root module of the microservice. We don't need to re-provide it here.

@Module({
  imports: [
    // TerminusModule is the foundation for all health checks.
    TerminusModule,
  ],
  providers: [HealthService, MessagingHealthIndicator],
  exports: [HealthService], // We export the service for use in controllers.
})
export class HealthModule {}
