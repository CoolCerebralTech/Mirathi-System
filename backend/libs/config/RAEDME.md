# @shamba/config

Centralized configuration management for Shamba Sure platform.

## Features

- Type-safe configuration with full TypeScript support
- Environment variable validation using Joi schemas
- Automatic configuration loading and validation
- Support for multiple environments
- Centralized configuration interface

## Usage

```typescript
import { ConfigModule, ShambaConfigService } from '@shamba/config';

@Module({
  imports: [ConfigModule],
  providers: [YourService],
})
export class YourModule {}

// In your service
constructor(private configService: ShambaConfigService) {}

async yourMethod() {
  const dbConfig = this.configService.database;
  const jwtSecret = this.configService.auth.jwtSecret;
  
  if (this.configService.isProduction()) {
    // Production-specific logic
  }
}