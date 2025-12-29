// src/succession-automation/src/application/readiness/interfaces/adapters.interface.ts
import { DocumentGapType } from '../../../domain/value-objects/document-gap.vo';

export interface IFamilyServiceAdapter {
  getFamilyStructure(familyId: string): Promise<{
    hasMinors: boolean;
    hasDisputes: boolean;
    marriageType: 'MONOGAMOUS' | 'POLYGAMOUS' | 'COHABITATION' | 'SINGLE';
    wifeCount: number;
    beneficiaryCount: number;
    religion: 'CHRISTIAN' | 'ISLAMIC' | 'HINDU' | 'TRADITIONAL' | 'OTHER';
  }>;
  getMinors(familyId: string): Promise<Array<{ id: string; name: string; hasGuardian: boolean }>>;
}

export interface IEstateServiceAdapter {
  getEstateSummary(estateId: string): Promise<{
    grossValue: number;
    totalDebts: number;
    hasBusinessAssets: boolean;
    hasForeignAssets: boolean;
    isDisputed: boolean;
    deceasedId: string;
  }>;
  getWillDetails(estateId: string): Promise<{
    exists: boolean;
    willId?: string;
    witnessCount?: number;
    isValid?: boolean;
  }>;
}

export interface IDocumentServiceAdapter {
  checkDocumentExists(estateId: string, docType: DocumentGapType): Promise<boolean>;
  getMissingDocuments(estateId: string): Promise<DocumentGapType[]>;
}

export const I_FAMILY_SERVICE = 'I_FAMILY_SERVICE';
export const I_ESTATE_SERVICE = 'I_ESTATE_SERVICE';
export const I_DOCUMENT_SERVICE = 'I_DOCUMENT_SERVICE';
