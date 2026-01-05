// apps/documents-service/src/injection.tokens.ts

/**
 * Dependency Injection Tokens
 *
 * These tokens allow us to inject interfaces instead of concrete classes,
 * making the code testable and following SOLID principles.
 */

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
export const OCR_SERVICE = Symbol('OCR_SERVICE');
export const ENCRYPTION_SERVICE = Symbol('ENCRYPTION_SERVICE');
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
