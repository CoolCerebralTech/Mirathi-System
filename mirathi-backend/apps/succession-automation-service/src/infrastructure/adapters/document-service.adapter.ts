import { Injectable, Logger } from '@nestjs/common';

import { IDocumentServiceAdapter } from '../../application/readiness/interfaces/adapters.interface';
import { DocumentGapType } from '../../domain/value-objects/document-gap.vo';

@Injectable()
export class DocumentServiceAdapter implements IDocumentServiceAdapter {
  private readonly logger = new Logger(DocumentServiceAdapter.name);

  async checkDocumentExists(estateId: string, docType: DocumentGapType): Promise<boolean> {
    this.logger.log(`[Mock] Checking existence of ${docType} for ${estateId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    // Simulation: We pretend Death Certificate exists, but KRA PIN is missing
    const exists = docType === DocumentGapType.DEATH_CERTIFICATE;

    return await Promise.resolve(exists);
  }

  async getMissingDocuments(estateId: string): Promise<DocumentGapType[]> {
    this.logger.log(`[Mock] Fetching missing documents for ${estateId}`);

    // Fix: Simulate network latency to satisfy 'require-await'
    return await Promise.resolve([
      DocumentGapType.KRA_PIN_CERTIFICATE,
      DocumentGapType.CHIEF_LETTER,
    ]);
  }
}
