// src/4_infrastructure/index.ts
// Repository implementations
export * from './repositories/prisma-document.repository';
export * from './repositories/prisma-document-version.repository';
export * from './repositories/prisma-document-verification-attempt.repository';

// Storage implementations
export * from './storage/providers/local-storage.provider';
export * from './storage/storage.service';
export * from './storage/file-validator.service';

// Virus scanner will be added when integrated
// export * from './storage/virus-scanner.service';
