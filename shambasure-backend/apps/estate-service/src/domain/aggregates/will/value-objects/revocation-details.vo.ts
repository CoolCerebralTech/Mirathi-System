import { ValueObject } from '../../../base/value-object';
import { Result } from '../../../core/result';

export enum RevocationMethod {
  NEW_WILL = 'NEW_WILL',
  CODICIL = 'CODICIL',
  DESTRUCTION = 'DESTRUCTION',
  COURT_ORDER = 'COURT_ORDER',
  MARRIAGE = 'MARRIAGE',
  DIVORCE = 'DIVORCE',
  OTHER = 'OTHER',
}

export enum RevocationStatus {
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  CONTESTED = 'CONTESTED',
}

interface RevocationDetailsProps {
  // Core Information
  method: RevocationMethod;
  status: RevocationStatus;

  // Legal Grounds (Section 16-19 LSA)
  revokedAt: Date;
  revokedBy: string; // User ID of person executing revocation
  reason?: string;

  // Method-Specific Details
  newWillId?: string; // For NEW_WILL method
  codicilId?: string; // For CODICIL method
  destructionMethod?: 'BURNING' | 'TEARING' | 'OBLITERATION';
  destructionWitnesses?: string[]; // Witness IDs
  courtOrderNumber?: string; // For COURT_ORDER method
  courtStation?: string;

  // Marriage/Divorce Details (Section 17 LSA)
  marriageDate?: Date;
  divorceDate?: Date;
  spouseId?: string;
  marriageCertificateNumber?: string;
  divorceDecreeNumber?: string;

  // Evidence and Documentation
  supportingDocumentIds: string[];
  witnessStatementIds: string[];

  // Legal Compliance
  compliesWithSection16: boolean; // Revocation by writing
  compliesWithSection17: boolean; // Revocation by marriage
  compliesWithSection18: boolean; // Revocation by destruction
  compliesWithSection19: boolean; // Revocation by later will

  // Audit Trail
  createdAt: Date;
  updatedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export class RevocationDetails extends ValueObject<RevocationDetailsProps> {
  get method(): RevocationMethod {
    return this.props.method;
  }
  get status(): RevocationStatus {
    return this.props.status;
  }
  get revokedAt(): Date {
    return this.props.revokedAt;
  }
  get revokedBy(): string {
    return this.props.revokedBy;
  }
  get compliesWithSection16(): boolean {
    return this.props.compliesWithSection16;
  }

  private constructor(props: RevocationDetailsProps) {
    super(props);
  }

  /**
   * Creates revocation details for a will
   */
  public static create(props: Partial<RevocationDetailsProps>): Result<RevocationDetails> {
    const defaultProps: RevocationDetailsProps = {
      method: RevocationMethod.OTHER,
      status: RevocationStatus.PENDING,
      revokedAt: new Date(),
      revokedBy: '',
      supportingDocumentIds: [],
      witnessStatementIds: [],
      compliesWithSection16: false,
      compliesWithSection17: false,
      compliesWithSection18: false,
      compliesWithSection19: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const finalProps = { ...defaultProps, ...props };

    const validationResult = this.validateRevocation(finalProps);
    if (validationResult.isFailure) {
      return Result.fail<RevocationDetails>(validationResult.getErrorValue());
    }

    // Auto-set compliance based on method
    finalProps.compliesWithSection16 =
      finalProps.method === RevocationMethod.NEW_WILL ||
      finalProps.method === RevocationMethod.CODICIL;
    finalProps.compliesWithSection17 = finalProps.method === RevocationMethod.MARRIAGE;
    finalProps.compliesWithSection18 = finalProps.method === RevocationMethod.DESTRUCTION;
    finalProps.compliesWithSection19 = finalProps.method === RevocationMethod.NEW_WILL;

    return Result.ok<RevocationDetails>(new RevocationDetails(finalProps));
  }

  /**
   * Validates revocation details per Kenyan law
   */
  private static validateRevocation(props: RevocationDetailsProps): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (!props.revokedBy) {
      errors.push('Revocation must specify who revoked the will');
    }

    if (props.revokedAt > new Date()) {
      errors.push('Revocation date cannot be in the future');
    }

    // Method-specific validation
    switch (props.method) {
      case RevocationMethod.NEW_WILL:
        if (!props.newWillId) {
          errors.push('New will ID is required for revocation by new will');
        }
        break;

      case RevocationMethod.CODICIL:
        if (!props.codicilId) {
          errors.push('Codicil ID is required for revocation by codicil');
        }
        break;

      case RevocationMethod.DESTRUCTION:
        if (!props.destructionMethod) {
          errors.push('Destruction method is required for revocation by destruction');
        }
        if (!props.destructionWitnesses || props.destructionWitnesses.length < 2) {
          errors.push('Destruction requires at least 2 witnesses under Section 18 LSA');
        }
        break;

      case RevocationMethod.COURT_ORDER:
        if (!props.courtOrderNumber) {
          errors.push('Court order number is required for court-ordered revocation');
        }
        break;

      case RevocationMethod.MARRIAGE:
        if (!props.marriageDate) {
          errors.push('Marriage date is required for revocation by marriage');
        }
        break;

      case RevocationMethod.DIVORCE:
        if (!props.divorceDate) {
          errors.push('Divorce date is required for revocation by divorce');
        }
        break;
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Executes the revocation (changes status from PENDING to EXECUTED)
   */
  public executeRevocation(verifiedBy?: string): Result<void> {
    if (this.props.status !== RevocationStatus.PENDING) {
      return Result.fail(`Revocation is already ${this.props.status.toLowerCase()}`);
    }

    this.props.status = RevocationStatus.EXECUTED;
    this.props.updatedAt = new Date();

    if (verifiedBy) {
      this.props.verifiedBy = verifiedBy;
      this.props.verifiedAt = new Date();
    }

    return Result.ok();
  }

  /**
   * Cancels a pending revocation
   */
  public cancelRevocation(reason: string): Result<void> {
    if (this.props.status !== RevocationStatus.PENDING) {
      return Result.fail('Only pending revocations can be cancelled');
    }

    this.props.status = RevocationStatus.CANCELLED;
    this.props.reason = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Contests the revocation
   */
  public contestRevocation(): Result<void> {
    if (this.props.status === RevocationStatus.CONTESTED) {
      return Result.fail('Revocation is already contested');
    }

    this.props.status = RevocationStatus.CONTESTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Adds supporting document for revocation
   */
  public addSupportingDocument(documentId: string): void {
    if (!this.props.supportingDocumentIds.includes(documentId)) {
      this.props.supportingDocumentIds.push(documentId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Adds witness statement for revocation
   */
  public addWitnessStatement(statementId: string): void {
    if (!this.props.witnessStatementIds.includes(statementId)) {
      this.props.witnessStatementIds.push(statementId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Checks if revocation is legally valid under Kenyan law
   */
  public isLegallyValid(): boolean {
    if (this.props.status !== RevocationStatus.EXECUTED) {
      return false;
    }

    // Check compliance with relevant LSA sections
    switch (this.props.method) {
      case RevocationMethod.NEW_WILL:
        return this.props.compliesWithSection16 && this.props.compliesWithSection19;

      case RevocationMethod.CODICIL:
        return this.props.compliesWithSection16;

      case RevocationMethod.DESTRUCTION:
        return (
          this.props.compliesWithSection18 && (this.props.destructionWitnesses?.length || 0) >= 2
        );

      case RevocationMethod.COURT_ORDER:
        return !!this.props.courtOrderNumber;

      case RevocationMethod.MARRIAGE:
        return this.props.compliesWithSection17 && !!this.props.marriageDate;

      case RevocationMethod.DIVORCE:
        return !!this.props.divorceDate;

      default:
        return false;
    }
  }

  /**
   * Gets the legal basis for revocation
   */
  public getLegalBasis(): string {
    const basisMap: Record<RevocationMethod, string> = {
      [RevocationMethod.NEW_WILL]: 'Section 19 LSA - Revocation by later will',
      [RevocationMethod.CODICIL]: 'Section 16 LSA - Revocation by writing',
      [RevocationMethod.DESTRUCTION]: 'Section 18 LSA - Revocation by destruction',
      [RevocationMethod.COURT_ORDER]: 'Court order',
      [RevocationMethod.MARRIAGE]: 'Section 17 LSA - Revocation by marriage',
      [RevocationMethod.DIVORCE]: 'Common law principle',
      [RevocationMethod.OTHER]: 'Other legal basis',
    };

    return basisMap[this.props.method];
  }

  /**
   * Gets summary of revocation
   */
  public getSummary(): string {
    const methodMap: Record<RevocationMethod, string> = {
      [RevocationMethod.NEW_WILL]: 'Revoked by new will',
      [RevocationMethod.CODICIL]: 'Revoked by codicil',
      [RevocationMethod.DESTRUCTION]: 'Revoked by destruction',
      [RevocationMethod.COURT_ORDER]: 'Revoked by court order',
      [RevocationMethod.MARRIAGE]: 'Revoked by marriage',
      [RevocationMethod.DIVORCE]: 'Revoked by divorce',
      [RevocationMethod.OTHER]: 'Revoked by other means',
    };

    const statusMap: Record<RevocationStatus, string> = {
      [RevocationStatus.PENDING]: 'Pending',
      [RevocationStatus.EXECUTED]: 'Executed',
      [RevocationStatus.CANCELLED]: 'Cancelled',
      [RevocationStatus.CONTESTED]: 'Contested',
    };

    return `${methodMap[this.props.method]} - Status: ${statusMap[this.props.status]}`;
  }

  /**
   * Checks if revocation was by marriage (Section 17 LSA)
   */
  public isRevocationByMarriage(): boolean {
    return this.props.method === RevocationMethod.MARRIAGE;
  }

  /**
   * Checks if revocation was by destruction (Section 18 LSA)
   */
  public isRevocationByDestruction(): boolean {
    return this.props.method === RevocationMethod.DESTRUCTION;
  }

  /**
   * Checks if revocation is contestable (has legal weaknesses)
   */
  public isContestable(): boolean {
    // Destructions without witnesses are contestable
    if (
      this.props.method === RevocationMethod.DESTRUCTION &&
      (this.props.destructionWitnesses?.length || 0) < 2
    ) {
      return true;
    }

    // Marriage revocations without marriage certificate are contestable
    if (this.props.method === RevocationMethod.MARRIAGE && !this.props.marriageCertificateNumber) {
      return true;
    }

    // Court orders without proper documentation are contestable
    if (this.props.method === RevocationMethod.COURT_ORDER && !this.props.courtOrderNumber) {
      return true;
    }

    return false;
  }
}
