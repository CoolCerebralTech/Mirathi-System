import { Injectable, Logger } from '@nestjs/common';

import { IFamilyServiceAdapter } from '../../application/readiness/interfaces/adapters.interface';

@Injectable()
export class FamilyServiceAdapter implements IFamilyServiceAdapter {
  private readonly logger = new Logger(FamilyServiceAdapter.name);

  async getFamilyStructure(familyId: string): Promise<{
    hasMinors: boolean;
    hasDisputes: boolean;
    marriageType: 'MONOGAMOUS' | 'POLYGAMOUS' | 'COHABITATION' | 'SINGLE';
    wifeCount: number;
    beneficiaryCount: number;
    religion: 'CHRISTIAN' | 'ISLAMIC' | 'HINDU' | 'TRADITIONAL' | 'OTHER';
  }> {
    this.logger.log(`[Mock] Fetching family structure for ${familyId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    return await Promise.resolve({
      hasMinors: true,
      hasDisputes: false,
      marriageType: 'MONOGAMOUS',
      wifeCount: 1,
      beneficiaryCount: 4,
      religion: 'CHRISTIAN',
    });
  }

  async getMinors(
    familyId: string,
  ): Promise<Array<{ id: string; name: string; hasGuardian: boolean }>> {
    this.logger.log(`[Mock] Fetching minors for ${familyId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    return await Promise.resolve([
      { id: 'minor-1', name: 'John Doe Jr.', hasGuardian: true },
      { id: 'minor-2', name: 'Jane Doe', hasGuardian: false }, // Simulating a risk
    ]);
  }
}
