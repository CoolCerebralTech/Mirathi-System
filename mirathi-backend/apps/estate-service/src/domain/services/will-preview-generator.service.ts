// =============================================================================
// WILL PREVIEW GENERATOR SERVICE
// =============================================================================
import { Injectable } from '@nestjs/common';

@Injectable()
export class WillPreviewGeneratorService {
  /**
   * Generates HTML preview of the will
   */
  generateHtmlPreview(will: {
    testatorName: string;
    versionNumber: number;
    executor?: {
      name: string;
      relationship?: string;
    };
    beneficiaries: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    witnesses: Array<{
      name: string;
      status: string;
    }>;
    funeralWishes?: string;
    burialLocation?: string;
    specialInstructions?: string;
    createdAt: Date;
  }): string {
    const date = will.createdAt.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .will-document {
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
      font-size: 28px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .subtitle {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 40px;
    }
    .section {
      margin: 30px 0;
      line-height: 1.8;
    }
    .section-title {
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 10px;
      color: #333;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }
    .declaration {
      font-style: italic;
      margin: 20px 0;
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #333;
    }
    .beneficiary {
      margin: 15px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .witness-box {
      margin: 30px 0;
      padding: 20px;
      border: 2px solid #333;
    }
    .signature-line {
      margin-top: 60px;
      border-top: 2px solid #000;
      width: 300px;
    }
    .warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .missing {
      color: #dc3545;
      font-weight: bold;
    }
    .legal-header { text-align: center; border-bottom: 3px double black; padding-bottom: 20px; margin-bottom: 30px; }
    .republic { font-size: 1.2em; letter-spacing: 4px; font-weight: bold; }
    .act-ref { font-size: 0.9em; font-style: italic; }
  </style>
</head>
<body>
  <div class="will-document">
    <h1>Last Will and Testament</h1>
    <div class="subtitle">
      Republic of Kenya<br>
      Version ${will.versionNumber} | ${date}
    </div>

    <div class="declaration">
      I, <strong>${will.testatorName}</strong>, being of sound mind and memory, do hereby make, publish, 
      and declare this to be my Last Will and Testament, hereby revoking all former wills and codicils 
      made by me.
    </div>

    ${
      will.executor
        ? `
    <div class="section">
      <div class="section-title">ARTICLE I: APPOINTMENT OF EXECUTOR</div>
      <p>
        I hereby nominate and appoint <strong>${will.executor.name}</strong>
        ${will.executor.relationship ? `(my ${will.executor.relationship})` : ''}
        as the Executor of this my Last Will and Testament.
      </p>
    </div>
    `
        : `
    <div class="warning">
      <div class="missing">⚠️ NO EXECUTOR APPOINTED</div>
      <p>You should appoint someone to execute your will.</p>
    </div>
    `
    }

    ${
      will.beneficiaries.length > 0
        ? `
    <div class="section">
      <div class="section-title">ARTICLE II: DISTRIBUTION OF ESTATE</div>
      <p>I give, devise, and bequeath my estate as follows:</p>
      ${will.beneficiaries
        .map(
          (b, i) => `
        <div class="beneficiary">
          <strong>${i + 1}. ${b.name}</strong> (${b.type})<br>
          ${b.description}
        </div>
      `,
        )
        .join('')}
    </div>
    `
        : `
    <div class="warning">
      <div class="missing">⚠️ NO BENEFICIARIES SPECIFIED</div>
      <p>You should specify who will inherit your estate.</p>
    </div>
    `
    }

    ${
      will.funeralWishes || will.burialLocation
        ? `
    <div class="section">
      <div class="section-title">ARTICLE III: FUNERAL AND BURIAL</div>
      ${will.funeralWishes ? `<p>${will.funeralWishes}</p>` : ''}
      ${will.burialLocation ? `<p>I wish to be buried at: <strong>${will.burialLocation}</strong></p>` : ''}
    </div>
    `
        : ''
    }

    ${
      will.specialInstructions
        ? `
    <div class="section">
      <div class="section-title">ARTICLE IV: SPECIAL INSTRUCTIONS</div>
      <p>${will.specialInstructions}</p>
    </div>
    `
        : ''
    }

    <div class="witness-box">
      <div class="section-title">WITNESSES (Kenyan Law Requirement: 2 witnesses)</div>
      ${
        will.witnesses.length >= 2
          ? `
        ${will.witnesses
          .map(
            (w, i) => `
          <p><strong>Witness ${i + 1}:</strong> ${w.name} - ${w.status}</p>
        `,
          )
          .join('')}
      `
          : `
        <div class="missing">
          ❌ INCOMPLETE: Need ${2 - will.witnesses.length} more witness(es)
        </div>
        ${will.witnesses
          .map(
            (w, i) => `
          <p><strong>Witness ${i + 1}:</strong> ${w.name} - ${w.status}</p>
        `,
          )
          .join('')}
      `
      }
    </div>

    <div style="margin-top: 60px;">
      <p>IN WITNESS WHEREOF, I have hereunto set my hand this day.</p>
      <div class="signature-line">
        <p style="margin-top: 10px;">Testator: ${will.testatorName}</p>
      </div>
    </div>

    <div style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 4px;">
      <small>
        <strong>Note:</strong> This is a preview only. For legal validity in Kenya, 
        this will must be signed by the testator in the presence of two witnesses 
        who must also sign (Section 11, Law of Succession Act Cap 160).
      </small>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
