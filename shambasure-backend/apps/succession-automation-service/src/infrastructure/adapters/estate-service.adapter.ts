import { Injectable, Logger } from '@nestjs/common';

import { IEstateServiceAdapter } from '../../application/readiness/interfaces/adapters.interface';

@Injectable()
export class EstateServiceAdapter implements IEstateServiceAdapter {
  private readonly logger = new Logger(EstateServiceAdapter.name);

  async getEstateSummary(estateId: string): Promise<{
    grossValue: number;
    totalDebts: number;
    hasBusinessAssets: boolean;
    hasForeignAssets: boolean;
    isDisputed: boolean;
    deceasedId: string;
  }> {
    this.logger.log(`[Mock] Fetching estate summary for ${estateId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    return await Promise.resolve({
      grossValue: 5_000_000, // 5M KES
      totalDebts: 500_000,
      hasBusinessAssets: false,
      hasForeignAssets: false,
      isDisputed: false,
      deceasedId: 'deceased-uuid-123',
    });
  }

  async getWillDetails(estateId: string): Promise<{
    exists: boolean;
    willId?: string;
    witnessCount?: number;
    isValid?: boolean;
  }> {
    this.logger.log(`[Mock] Fetching will details for ${estateId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    return await Promise.resolve({
      exists: true,
      willId: 'will-uuid-456',
      witnessCount: 2,
      isValid: true,
    });
  }
}
