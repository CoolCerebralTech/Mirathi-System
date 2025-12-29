import { Injectable, Logger } from '@nestjs/common';

import { KenyanFormTypeEnum } from '../../../../domain/value-objects/kenyan-form-type.vo';
import { SuccessionContext } from '../../../../domain/value-objects/succession-context.vo';

// Removed Adapter imports since we are mocking internally

/**
 * PDF Assembler Service (MOCK IMPLEMENTATION)
 */
@Injectable()
export class PdfAssemblerService {
  private readonly logger = new Logger(PdfAssemblerService.name);

  constructor() {
    // Removed adapters
  }

  /**
   * Generates a physical PDF for a Form Entity
   */
  public async assembleForm(
    formType: KenyanFormTypeEnum,
    context: SuccessionContext,
    data: Record<string, any>,
  ): Promise<{ storageUrl: string; fileSize: number; checksum: string; generationTimeMs: number }> {
    const startTime = Date.now();
    this.logger.log(`Starting [MOCK] PDF assembly for ${formType}...`);

    try {
      // Simulate Processing Delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 1. Logic to pick specific template versions (kept for logic validity)
      const templateId = this.selectTemplateId(formType, context);
      this.logger.debug(`Selected Template ID: ${templateId}`);

      // FIX 3: Removed context.status (it doesn't exist on VO)

      this.logger.debug(`Hydrating template with ${Object.keys(data).length} data points...`);

      // 2. Generate MOCK Output
      // In real life, we would upload to S3 here.
      // We generate a fake S3 URL for the frontend to "see".
      const fileName = `${formType}-${Date.now()}.pdf`;
      const mockStorageUrl = `https://s3.us-east-1.amazonaws.com/mock-bucket/estates/${data.estateId}/forms/${fileName}`;

      // Mock File stats
      const mockFileSize = 1024 * 50; // 50KB
      const mockChecksum = `mock-sha256-${Date.now()}`;

      const generationTimeMs = Date.now() - startTime;

      this.logger.log(`[MOCK] PDF Generated: ${mockStorageUrl}`);

      return {
        storageUrl: mockStorageUrl,
        fileSize: mockFileSize,
        checksum: mockChecksum,
        generationTimeMs,
      };
    } catch (error) {
      this.logger.error(`Failed to assemble form ${formType}`, error);
      throw new Error(
        `PDF Assembly Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private selectTemplateId(type: KenyanFormTypeEnum, context: SuccessionContext): string {
    const prefix = type.toString();
    const suffix = context.requiresKadhisCourt() ? '_ISLAMIC' : '_STANDARD';
    return `${prefix}${suffix}`;
  }
}
