import { Inject, Injectable, Logger } from '@nestjs/common';

import { DocumentGap, DocumentGapType } from '../../../domain/value-objects/document-gap.vo';
import {
  SuccessionContext,
  SuccessionRegime,
} from '../../../domain/value-objects/succession-context.vo';
import { I_DOCUMENT_SERVICE } from '../interfaces/adapters.interface';
// FIX: Use 'import type'
import type { IDocumentServiceAdapter } from '../interfaces/adapters.interface';

@Injectable()
export class GapAnalysisService {
  private readonly logger = new Logger(GapAnalysisService.name);

  constructor(
    @Inject(I_DOCUMENT_SERVICE) private readonly documentService: IDocumentServiceAdapter,
  ) {}

  /**
   * Identify missing documents based on Context
   */
  async identifyGaps(estateId: string, context: SuccessionContext): Promise<DocumentGap[]> {
    this.logger.log(`Identifying document gaps for Estate: ${estateId}`);
    const gaps: DocumentGap[] = [];

    // 1. Check Fatal 10 (Mandatory for everyone)
    await this.checkAndAddGap(
      estateId,
      DocumentGapType.DEATH_CERTIFICATE,
      DocumentGap.createDeathCertificateGap(),
      gaps,
    );

    await this.checkAndAddGap(
      estateId,
      DocumentGapType.KRA_PIN_CERTIFICATE,
      DocumentGap.createKraPinGap(),
      gaps,
    );

    // 2. Context Specific: Intestate
    if (context.regime === SuccessionRegime.INTESTATE) {
      await this.checkAndAddGap(
        estateId,
        DocumentGapType.CHIEF_LETTER,
        DocumentGap.createChiefLetterGap(),
        gaps,
      );
    }

    // 3. Context Specific: Testate
    if (context.regime === SuccessionRegime.TESTATE) {
      await this.checkAndAddGap(
        estateId,
        DocumentGapType.ORIGINAL_WILL,
        DocumentGap.createOriginalWillGap(),
        gaps,
      );
    }

    return gaps;
  }

  private async checkAndAddGap(
    estateId: string,
    type: DocumentGapType,
    gapTemplate: DocumentGap,
    gapList: DocumentGap[],
  ): Promise<void> {
    const exists = await this.documentService.checkDocumentExists(estateId, type);
    if (!exists) {
      gapList.push(gapTemplate);
    }
  }
}
