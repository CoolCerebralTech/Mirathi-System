import { Injectable } from '@nestjs/common';
import { KenyanFormType } from '@prisma/client';

import { EstateData } from '../adapters/estate-service.adapter';
import { FamilyData } from '../adapters/family-service.adapter';

@Injectable()
export class ProbateTemplateService {
  /**
   * Generates the HTML string for a specific form type.
   */
  public generate(
    formType: KenyanFormType,
    estate: EstateData,
    family: FamilyData,
    petitionerName: string, // Usually the user
  ): string {
    const data = this.prepareData(estate, family, petitionerName);

    switch (formType) {
      case KenyanFormType.PA1_PROBATE:
        return this.templatePA1(data);
      case KenyanFormType.PA80_INTESTATE:
        return this.templatePA80(data);
      case KenyanFormType.PA5_SUMMARY:
        return this.templatePA5(data);
      case KenyanFormType.PA12_AFFIDAVIT_MEANS:
        return this.templatePA12(data);
      case KenyanFormType.PA38_FAMILY_CONSENT:
        return this.templatePA38(data);
      case KenyanFormType.CHIEFS_LETTER:
        return this.templateChiefsLetter(data);
      default:
        return `<p>Template for ${formType} is under development.</p>`;
    }
  }

  // --- DATA PREPARATION ---

  private prepareData(estate: EstateData, family: FamilyData, petitionerName: string) {
    return {
      courtName: 'IN THE HIGH COURT OF KENYA', // Dynamic based on jurisdiction later
      deceasedName: 'THE DECEASED', // Should come from Estate Profile
      dateOfDeath: 'DD/MM/YYYY', // Should come from Death Cert
      domicile: 'KENYA',
      petitionerName: petitionerName.toUpperCase(),
      petitionerAddress: 'P.O. BOX ...',
      totalValue: `KES ${estate.totalAssets.toLocaleString()}`,
      survivors: family.members
        .map(
          (m) => `<li>${m.firstName} (${m.relationship}) - ${m.isMinor ? 'Minor' : 'Adult'}</li>`,
        )
        .join(''),
      assetsList: estate.assets
        .map((a) => `<li>${a.name} - KES ${a.estimatedValue.toLocaleString()}</li>`)
        .join(''),
      debtsList: estate.debts
        .map((d) => `<li>${d.creditorName} - KES ${d.outstandingBalance.toLocaleString()}</li>`)
        .join(''),
      executorName: estate.hasExecutor ? 'NAMED EXECUTOR' : petitionerName,
    };
  }

  // ===========================================================================
  // FORM P&A 80 - PETITION FOR LETTERS OF ADMINISTRATION INTESTATE
  // Section 66, Law of Succession Act
  // ===========================================================================
  private templatePA80(data: any): string {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">FORM P&A 80</h3>
        <h2 style="text-align: center;">${data.courtName}</h2>
        <h3 style="text-align: center;">SUCCESSION CAUSE NO. ....... OF ${new Date().getFullYear()}</h3>
        <br/>
        <p><strong>IN THE MATTER OF THE ESTATE OF ${data.deceasedName} (DECEASED)</strong></p>
        
        <h3 style="text-align: center; text-decoration: underline;">PETITION FOR LETTERS OF ADMINISTRATION INTESTATE</h3>
        
        <p><strong>I, ${data.petitionerName}</strong> of ${data.petitionerAddress}, HEREBY PETITION this Honourable Court for a grant of letters of administration intestate of the estate of the above-named deceased.</p>
        
        <p>AND I SAY as follows:-</p>
        <ol>
          <li>The deceased died on <strong>${data.dateOfDeath}</strong> at <strong>[Place of Death]</strong> was domiciled in <strong>${data.domicile}</strong>.</li>
          <li>The deceased died intestate (without a valid will).</li>
          <li>I am the <strong>[RELATIONSHIP]</strong> of the deceased and I am not a minor or of unsound mind/bankrupt.</li>
          <li>The deceased left surviving him/her the following persons:<br/>
            <ul>${data.survivors}</ul>
          </li>
          <li>The deceased was possessed of assets within the jurisdiction of this court.</li>
          <li>The estate has a gross value of approximately <strong>${data.totalValue}</strong>.</li>
        </ol>
        
        <p><strong>DATED</strong> at .................... this ............ day of .................... 20....</p>
        <br/><br/>
        <div style="border-top: 1px solid black; width: 200px;">Signature of Petitioner</div>
      </div>
    `;
  }

  // ===========================================================================
  // FORM P&A 1 - PETITION FOR PROBATE (TESTATE)
  // Section 51, Law of Succession Act
  // ===========================================================================
  private templatePA1(data: any): string {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">FORM P&A 1</h3>
        <h2 style="text-align: center;">${data.courtName}</h2>
        <br/>
        <p><strong>IN THE MATTER OF THE ESTATE OF ${data.deceasedName} (DECEASED)</strong></p>
        
        <h3 style="text-align: center; text-decoration: underline;">PETITION FOR PROBATE</h3>
        
        <p><strong>I, ${data.executorName}</strong> of ${data.petitionerAddress}, HEREBY PETITION this Honourable Court for a grant of probate of the will of the above-named deceased.</p>
        
        <p>AND I SAY as follows:-</p>
        <ol>
          <li>The deceased died on <strong>${data.dateOfDeath}</strong> leaving a valid written will dated <strong>[Date of Will]</strong>.</li>
          <li>I am the executor named in the said will.</li>
          <li>The document attached hereto and marked "A" is the original will of the deceased.</li>
          <li>The estate has a gross value of approximately <strong>${data.totalValue}</strong>.</li>
        </ol>
        <br/>
        <div style="border-top: 1px solid black; width: 200px;">Signature of Executor</div>
      </div>
    `;
  }

  // ===========================================================================
  // FORM P&A 12 - AFFIDAVIT OF MEANS
  // Required for all causes
  // ===========================================================================
  private templatePA12(data: any): string {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">FORM P&A 12</h3>
        <h3 style="text-align: center; text-decoration: underline;">AFFIDAVIT OF MEANS AND ASSETS</h3>
        
        <p><strong>I, ${data.petitionerName}</strong> make oath and say as follows:-</p>
        
        <p>1. THAT I have set out in the schedule herein a full and true inventory of all the assets and liabilities of the deceased.</p>
        
        <h4>SCHEDULE OF ASSETS</h4>
        <ul>${data.assetsList}</ul>
        
        <h4>SCHEDULE OF LIABILITIES</h4>
        <ul>${data.debtsList}</ul>
        
        <p>2. THAT the gross value of the estate is <strong>${data.totalValue}</strong>.</p>
        
        <p><strong>SWORN</strong> at .................... by the said <strong>${data.petitionerName}</strong></p>
        <br/><br/>
        <div style="display: flex; justify-content: space-between;">
           <div style="border-top: 1px solid black; width: 200px;">Deponent</div>
           <div style="border-top: 1px solid black; width: 200px;">Commissioner for Oaths</div>
        </div>
      </div>
    `;
  }

  // ===========================================================================
  // FORM P&A 38 - CONSENT
  // Rule 26(1), Probate and Administration Rules
  // ===========================================================================
  private templatePA38(data: any): string {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">FORM P&A 38</h3>
        <h3 style="text-align: center; text-decoration: underline;">CONSENT TO MAKING OF A GRANT</h3>
        
        <p><strong>WE, THE UNDERSIGNED</strong>, being beneficiaries of the estate of <strong>${data.deceasedName}</strong>, HEREBY CONSENT to the making of a grant of representation to <strong>${data.petitionerName}</strong>.</p>
        
        <table border="1" cellpadding="10" cellspacing="0" style="width: 100%; margin-top: 20px;">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            <!-- Iterate family members here -->
             <tr>
               <td colspan="3" style="text-align: center; color: gray;">(Print family members table here)</td>
             </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // ===========================================================================
  // FORM P&A 5 - SUMMARY ADMINISTRATION
  // Section 49, Law of Succession Act (Small Estates)
  // ===========================================================================
  private templatePA5(data: any): string {
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">FORM P&A 5</h3>
        <h3 style="text-align: center; text-decoration: underline;">PETITION FOR SUMMARY ADMINISTRATION</h3>
        
        <p><strong>I, ${data.petitionerName}</strong>... PETITION for a grant of letters of administration.</p>
        <p>AND I SAY that the aggregate value of the estate does not exceed <strong>KES 500,000</strong>.</p>
        <p>Under Section 49 of the Law of Succession Act, I pray for dispensation with full grant procedures.</p>
      </div>
    `;
  }

  // ===========================================================================
  // CHIEF'S LETTER (Informal but Standard)
  // ===========================================================================
  private templateChiefsLetter(data: any): string {
    return `
      <div style="font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6;">
        <h3 style="text-align: center; text-decoration: underline;">RE: LETTER OF INTRODUCTION</h3>
        <h3 style="text-align: center;">ESTATE OF ${data.deceasedName}</h3>
        
        <p>This is to confirm that the above named person was a resident of this Location and died on ${data.dateOfDeath}.</p>
        <p>I confirm the beneficiaries/survivors are known to me as follows:</p>
        <ul>${data.survivors}</ul>
        
        <p>I have no objection to <strong>${data.petitionerName}</strong> applying for administration documents.</p>
        <br/><br/>
        <p><strong>AREA CHIEF</strong></p>
        <p>Sign/Stamp: .................................</p>
      </div>
    `;
  }
}
