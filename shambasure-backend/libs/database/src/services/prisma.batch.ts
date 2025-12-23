/**
 * BatchResult
 * -----------------------------------------------
 * Structured batch execution result for observability.
 */
export interface BatchResult {
  total: number;
  batches: number;
  succeeded: number;
  failed: number;
}

/**
 * executeInBatches
 * -----------------------------------------------
 * Splits large workloads into deterministic batches.
 *
 * Useful for:
 * - Bulk inserts
 * - Backfills
 * - Migrations
 * - Reindexing jobs
 */
export async function executeInBatches<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>,
): Promise<BatchResult> {
  const total = items.length;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      await operation(batch);
      succeeded += batch.length;
    } catch {
      failed += batch.length;
      throw new Error(`Batch failed at index ${i}`);
    }
  }

  return {
    total,
    batches: Math.ceil(total / batchSize),
    succeeded,
    failed,
  };
}
