import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configValidationSchema } from './schemas/config.schema';
import { ConfigService } from './services/config.service';

// ============================================================================
// Shamba Sure - Shared Configuration Module
// ============================================================================
// This is the single, centralized module for all configuration management.
// It performs the following critical tasks:
// 1. Loads environment variables from a .env file.
// 2. Validates all loaded variables against our strict Joi schema.
// 3. Provides a clean, simple, and strongly-typed `ConfigService`.
//
// By importing this one module into the root of each microservice, we
// guarantee that configuration is handled identically and robustly everywhere.
// ============================================================================

@Global() // Makes the ConfigService available globally without needing to re-import this module.
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env', // Looks for the .env file in the root of the monorepo.
      validationSchema: configValidationSchema,
      validationOptions: {
        // Allow environment variables that are not in our schema (e.g., system variables).
        allowUnknown: true,
        // Report all validation errors at once instead of stopping at the first one.
        abortEarly: false,
      },
      // Caching improves performance by only reading/parsing env vars once.
      cache: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
