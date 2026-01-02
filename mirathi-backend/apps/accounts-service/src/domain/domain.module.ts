// src/domain/domain.module.ts
import { Module } from '@nestjs/common';

/**
 * Domain Module
 *
 * In Clean Architecture, this module is pure TypeScript and usually doesn't have providers.
 * However, we register it to ensure the folder structure is respected by NestJS CLI.
 * If you have Domain Services (not Application Services), they go here.
 */
@Module({
  exports: [],
})
export class DomainModule {}
