// src/application/guardianship/queries/impl/get-court-document-preview.query.ts
import { BaseQuery } from '../../../common/base/base.query';
import { IQuery } from '../../../common/interfaces/use-case.interface';

export enum DocumentType {
  COMPLIANCE_REPORT = 'COMPLIANCE_REPORT',
  BOND_CERTIFICATE = 'BOND_CERTIFICATE',
  APPOINTMENT_LETTER = 'APPOINTMENT_LETTER',
  CLOSING_SUMMARY = 'CLOSING_SUMMARY',
}

export class GetCourtDocumentPreviewQuery extends BaseQuery implements IQuery {
  public readonly guardianshipId: string;
  public readonly documentType: DocumentType;
  public readonly referenceId: string;
  public readonly format: 'PDF' | 'HTML';

  constructor(
    guardianshipId: string,
    documentType: DocumentType,
    referenceId: string,
    userId: string,
    format: 'PDF' | 'HTML' = 'PDF',
    correlationId?: string,
  ) {
    super({ userId, correlationId });

    if (!guardianshipId || !referenceId) {
      throw new Error('Context IDs are required for document generation');
    }

    this.guardianshipId = guardianshipId;
    this.documentType = documentType;
    this.referenceId = referenceId;
    this.format = format;
  }
}
