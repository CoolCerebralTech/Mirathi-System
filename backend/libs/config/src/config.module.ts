import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configValidationSchema } from './schemas/config.schema';
import { ShambaConfigService } from './services/config.service';
import { ConfigLoaderService } from './services/config-loader.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: configValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      cache: true,
    }),
  ],
  providers: [ShambaConfigService, ConfigLoaderService],
  exports: [ShambaConfigService],
})
export class ConfigModule {}