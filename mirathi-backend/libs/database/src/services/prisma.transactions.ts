import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * TransactionOptions
 * ------------------------------------------------
 * Controls retry behavior and transaction safety.
 */
export interface TransactionOptions {
  maxRetries?: number;
  timeout?: number;
  maxWait?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * executeTransaction
 * ------------------------------------------------
 * Executes a Prisma transaction with:
 * - Deadlock retry (P2034)
 * - Serialization retry (P2028)
 * - Exponential backoff
 *
 * This function is intentionally stateless.
 */
export async function executeTransaction<T>(
  prisma: PrismaService,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    timeout = 15_000,
    maxWait = 5_000,
    isolationLevel,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        timeout,
        maxWait,
        isolationLevel,
      });
    } catch (error) {
      lastError = error;

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034' || error.code === 'P2028') {
          if (attempt < maxRetries) {
            const backoff = Math.min(2 ** attempt * 100, 5_000);
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
        }
      }

      throw error;
    }
  }

  throw new Error(
    `Transaction failed after ${maxRetries} attempts: ${
      lastError instanceof Error ? lastError.message : 'Unknown error'
    }`,
  );
}
