import { FormStatus, SignatureType } from '../../../../domain/entities/generated-form.entity';

export class SignatureStatusVm {
  signatoryName: string;
  role: string; // "Applicant" or "Beneficiary"
  hasSigned: boolean;
  signedAt?: Date;
  signatureType?: SignatureType;
}

export class FormItemVm {
  id: string;
  code: string; // "P&A 1"
  name: string; // "Petition for Grant..."
  status: FormStatus;
  category: string;

  // Versioning
  version: number;
  generatedAt: Date;

  // Actions
  downloadUrl: string; // Temporary signed URL
  previewUrl?: string;
  canSign: boolean;
  canRegenerate: boolean;

  // Signatures
  signaturesRequired: number;
  signaturesObtained: number;
  signatories: SignatureStatusVm[];

  // Court Feedback
  rejectionReason?: string;
  courtQueries?: string[];
}

export class FormBundleVm {
  applicationId: string;

  // Grouped for UI Sections
  primaryPetitions: FormItemVm[];
  affidavits: FormItemVm[];
  consentsAndGuarantees: FormItemVm[];
  others: FormItemVm[];

  // Bulk Actions
  allApproved: boolean;
  allSigned: boolean;
}
