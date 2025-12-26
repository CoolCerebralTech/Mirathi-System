// src/estate-service/src/domain/entities/dependant-evidence.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

export enum EvidenceType {
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  AFFIDAVIT_OF_MARRIAGE = 'AFFIDAVIT_OF_MARRIAGE',
  MEDICAL_REPORT = 'MEDICAL_REPORT', // For incapacity
  SCHOOL_FEE_RECEIPTS = 'SCHOOL_FEE_RECEIPTS', // Proof of maintenance
  BANK_STATEMENTS = 'BANK_STATEMENTS', // Proof of maintenance (money transfers)
  DNA_TEST_RESULT = 'DNA_TEST_RESULT',
}

export interface DependantEvidenceProps {
  dependantId: string; // Parent ID
  type: EvidenceType;
  documentUrl: string; // Link to Document Service
  description: string;
  isVerified: boolean; // Has a human checked this document?
  uploadedBy: string;

  // Audit
  version: number;
  createdAt: Date;
}

/**
 * Dependant Evidence Entity
 *
 * Represents a physical or digital document proving the relationship/dependency.
 */
export class DependantEvidence extends Entity<DependantEvidenceProps> {
  private constructor(props: DependantEvidenceProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
  }

  public static create(
    props: Omit<DependantEvidenceProps, 'createdAt' | 'version' | 'isVerified'>,
    id?: UniqueEntityID,
  ): DependantEvidence {
    return new DependantEvidence(
      {
        ...props,
        isVerified: false, // Default
        version: 1,
        createdAt: new Date(),
      },
      id,
    );
  }

  get type(): EvidenceType {
    return this.props.type;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }

  public markAsVerified(): void {
    this.updateState({ isVerified: true });
  }
}
