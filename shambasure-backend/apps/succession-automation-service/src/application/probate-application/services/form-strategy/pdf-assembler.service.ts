import { Injectable, Logger } from '@nestjs/common';

import { KenyanFormTypeEnum } from '../../../../domain/value-objects/kenyan-form-type.vo';
import { SuccessionContext } from '../../../../domain/value-objects/succession-context.vo';
import { IPdfGeneratorAdapter } from '../../interfaces/i-pdf-generator.adapter';
import { IStorageAdapter } from '../../interfaces/i-storage.adapter';

/**
 * PDF Assembler Service
 *
 * PURPOSE: The "Paralegal" that types up the documents.
 *
 * RESPONSIBILITIES:
 * 1. Fetch the correct template (HTML/DOCX) for the Form Type.
 * 2. Hydrate the template with Estate, Applicant, and Beneficiary data.
 * 3. Convert to PDF.
 * 4. Upload to Secure Storage (S3).
 * 5. Return the URL and metadata to update the Entity.
 */

@Injectable()
export class PdfAssemblerService {
  private readonly logger = new Logger(PdfAssemblerService.name);

  constructor(
    private readonly pdfGenerator: IPdfGeneratorAdapter,
    private readonly storage: IStorageAdapter,
  ) {}

  /**
   * Generates a physical PDF for a Form Entity
   */
  public async assembleForm(
    formType: KenyanFormTypeEnum,
    context: SuccessionContext,
    data: Record<string, any>, // Flattened data from Estate/Applicant/Beneficiaries
  ): Promise<{ storageUrl: string; fileSize: number; checksum: string; generationTimeMs: number }> {
    const startTime = Date.now();
    this.logger.log(`Starting PDF assembly for ${formType}...`);

    try {
      // 1. Select Template based on Context
      // (e.g., Islamic P&A 80 looks different from Standard P&A 80)
      const templateId = this.selectTemplateId(formType, context);

      // 2. Hydrate Template (Replace {{ placeholders }})
      // We inject specific legal formatting helpers here
      const hydratedHtml = await this.pdfGenerator.hydrateTemplate(templateId, {
        ...data,
        _meta: {
          generatedAt: new Date().toISOString(),
          caseType: context.toCaseClassification(),
          watermark: context.status === 'DRAFT' ? 'DRAFT - NOT FOR FILING' : null,
        },
      });

      // 3. Generate PDF Buffer
      const pdfBuffer = await this.pdfGenerator.generatePdf(hydratedHtml, {
        format: 'A4',
        margin: '2cm',
        security: { password: null, permissions: ['PRINT'] }, // No password for court filing
      });

      // 4. Calculate Checksum (SHA-256) for Integrity
      const checksum = this.calculateChecksum(pdfBuffer);

      // 5. Upload to S3 (Versioned path)
      const fileName = `${formType}-${Date.now()}.pdf`;
      const storageUrl = await this.storage.uploadFile(
        `estates/${data.estateId}/forms/${fileName}`,
        pdfBuffer,
        'application/pdf',
      );

      const generationTimeMs = Date.now() - startTime;

      return {
        storageUrl,
        fileSize: pdfBuffer.length,
        checksum,
        generationTimeMs,
      };
    } catch (error) {
      this.logger.error(`Failed to assemble form ${formType}`, error);
      throw new Error(`PDF Assembly Failed: ${error.message}`);
    }
  }

  private selectTemplateId(type: KenyanFormTypeEnum, context: SuccessionContext): string {
    // Logic to pick specific template versions
    // e.g., "PA80_INTESTATE_V2" vs "PA80_ISLAMIC_V1"
    const prefix = type.toString();
    const suffix = context.requiresKadhisCourt() ? '_ISLAMIC' : '_STANDARD';
    return `${prefix}${suffix}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
