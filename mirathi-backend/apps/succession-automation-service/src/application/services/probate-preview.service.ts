// =============================================================================
// PROBATE SERVICE
// =============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';

import { ProbatePreview } from '../../domian/entities/probate-preview.entity';
import { ContextDetectorService } from '../../domian/services/context-detector.service';
import { FormSelectorService } from '../../domian/services/form-selector.service';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';
import { ProbatePreviewRepository } from '../../infrastructure/repositories/probate.repository';
import { ReadinessRepository } from '../../infrastructure/repositories/readiness.repository';

@Injectable()
export class ProbateService {
  constructor(
    private readonly probateRepo: ProbatePreviewRepository,
    private readonly readinessRepo: ReadinessRepository,
    private readonly contextDetector: ContextDetectorService,
    private readonly formSelector: FormSelectorService,
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
  ) {}

  /**
   * Generate form previews
   */
  async generatePreviews(userId: string, estateId: string) {
    // 1. Check readiness
    const assessment = await this.readinessRepo.findByEstateId(estateId);

    if (!assessment) {
      throw new NotFoundException('Please check readiness first');
    }

    // 2. Get context
    const estateData = await this.estateAdapter.getEstateData(estateId);
    const familyData = await this.familyAdapter.getFamilyData(userId);

    const context = this.contextDetector.detectContext({
      hasWill: estateData.hasWill,
      religion: familyData.religion,
      marriageType: familyData.isPolygamous ? 'POLYGAMOUS' : 'MONOGAMOUS',
      estateValue: estateData.totalAssets,
      hasMinors: familyData.numberOfMinors > 0,
      numberOfWives: familyData.numberOfSpouses,
      numberOfChildren: familyData.numberOfChildren,
    });

    // 3. Create preview
    let preview = await this.probateRepo.findByEstateId(estateId);

    if (!preview) {
      preview = ProbatePreview.create(userId, estateId, context, assessment.overallScore);
      await this.probateRepo.save(preview);
    }

    // 4. Select forms
    const forms = this.formSelector.selectForms(context);

    return {
      preview: preview.toJSON(),
      forms: forms,
      canGenerate: preview.isReady,
      warnings: preview.isReady
        ? []
        : ['Complete readiness assessment to 80% before generating forms'],
    };
  }

  /**
   * Get specific form preview (HTML)
   */
  async getFormPreview(estateId: string, formType: string) {
    const estateData = await this.estateAdapter.getEstateData(estateId);
    const familyData = await this.familyAdapter.getFamilyData(estateData.userId);

    // Generate HTML based on form type
    let html = '';

    if (formType === 'PA80_INTESTATE') {
      html = this.generatePA80Html(estateData, familyData);
    } else if (formType === 'PA1_PROBATE') {
      html = this.generatePA1Html(estateData, familyData);
    } else if (formType === 'PA12_AFFIDAVIT_MEANS') {
      html = this.generatePA12Html(estateData);
    }

    return {
      formType,
      html,
      disclaimer: 'This is an educational preview only. Not for official court submission.',
    };
  }

  private generatePA80Html(estateData: any, familyData: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; }
    .header { text-align: center; font-weight: bold; margin-bottom: 30px; }
    .section { margin: 20px 0; }
    .disclaimer { background: #fff3cd; padding: 15px; margin: 20px 0; border: 2px solid #ffc107; }
  </style>
</head>
<body>
  <div class="disclaimer">
    ⚠️ <strong>EDUCATIONAL PREVIEW ONLY</strong><br>
    This is not a legally valid document. Use only for learning purposes.
  </div>

  <div class="header">
    IN THE HIGH COURT OF KENYA AT NAIROBI<br>
    PROBATE AND ADMINISTRATION<br><br>
    PETITION FOR LETTERS OF ADMINISTRATION<br>
    (Form P&A 80)
  </div>

  <div class="section">
    <strong>IN THE MATTER OF THE ESTATE OF:</strong><br>
    [DECEASED NAME]<br>
    Who died on [DATE OF DEATH] at [PLACE OF DEATH]
  </div>

  <div class="section">
    <strong>I, [APPLICANT NAME],</strong> of [ADDRESS], being the [RELATIONSHIP] of the deceased,
    hereby apply for Letters of Administration of the estate of the late [DECEASED NAME].
  </div>

  <div class="section">
    <strong>ESTATE VALUE:</strong><br>
    Total Assets: KES ${estateData.totalAssets.toLocaleString()}<br>
    Total Debts: KES ${estateData.totalDebts.toLocaleString()}<br>
    Net Estate: KES ${estateData.netWorth.toLocaleString()}
  </div>

  <div class="section">
    <strong>BENEFICIARIES:</strong><br>
    Number of Children: ${familyData.numberOfChildren}<br>
    Number of Spouses: ${familyData.numberOfSpouses}
  </div>

  <div class="section">
    <strong>DECLARATION:</strong><br>
    I declare that the above information is true and correct to the best of my knowledge.
  </div>

  <div class="section" style="margin-top: 60px;">
    Signature: _______________________<br>
    Date: _______________________
  </div>

  <div class="disclaimer">
    <strong>Next Steps:</strong><br>
    1. Print this form<br>
    2. Fill in all required details<br>
    3. Sign before Commissioner for Oaths<br>
    4. Attach required documents<br>
    5. File at High Court registry
  </div>
</body>
</html>
    `.trim();
  }

  private generatePA1Html(estateData: any, familyData: any): string {
    return `<html><body><h1>P&A 1 - Probate Petition (Preview)</h1></body></html>`;
  }

  private generatePA12Html(estateData: any): string {
    return `<html><body><h1>P&A 12 - Affidavit of Means (Preview)</h1></body></html>`;
  }
}
