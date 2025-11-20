import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ProxyService } from './services/proxy.service';

@Module({
  imports: [
    InfrastructureModule, // Imports the providers for 'IHttpClient' and 'IServiceRouter'
  ],
  providers: [
    ProxyService, // Provides the main application service
  ],
  exports: [
    ProxyService, // Exports the service so the Presentation layer can use it
  ],
})
export class ProxyModule {}
