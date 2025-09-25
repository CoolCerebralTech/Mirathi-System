import { Injectable, OnModuleInit } from '@nestjs/common';
import { ShambaConfigService } from './config.service';

@Injectable()
export class ConfigLoaderService implements OnModuleInit {
  constructor(private configService: ShambaConfigService) {}

  onModuleInit() {
    this.loadAndValidateConfig();
  }

  private loadAndValidateConfig() {
    const validation = this.configService.validateConfig();
    
    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed:\n${validation.errors.join('\n')}`
      );
    }

    console.log('✅ Configuration loaded and validated successfully');
    console.log(`🏠 Environment: ${this.configService.app.environment}`);
    console.log(`📱 App: ${this.configService.app.name} v${this.configService.app.version}`);
    console.log(`🌐 Port: ${this.configService.app.port}`);
  }
}