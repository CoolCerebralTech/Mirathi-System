import { Will } from '../../../../domain/aggregates/will.aggregate';
import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

/**
 * Will Detail View Model
 *
 * PURPOSE:
 * Represents the full, detailed view of a Will for the UI/API.
 * Flattens Value Objects into primitive types (strings/numbers) for JSON serialization.
 * Hides domain-specific logic methods, exposing only state.
 */
export class WillDetailVm {
  public id: string;
  public testatorId: string;
  public versionNumber: number;
  public status: WillStatus;
  public type: WillType;

  // Metadata
  public createdAt: string;
  public updatedAt: string;
  public executionDate?: string;
  public executionLocation?: string;

  // Revocation Info (if applicable)
  public isRevoked: boolean;
  public revocationDetails?: {
    method: string;
    reason?: string;
    date: string;
  };

  // Content
  public funeralWishes?: string;
  public burialLocation?: string;
  public residuaryClause?: string;

  // Capacity Declaration
  public capacityDeclaration?: {
    status: string;
    date: string;
    riskLevel: string;
    isLegallySufficient: boolean;
  };

  // Child Collections
  public executors: ExecutorVm[];
  public bequests: BequestVm[];
  public witnesses: WitnessVm[];
  public codicils: CodicilVm[];
  public disinheritanceRecords: DisinheritanceRecordVm[];

  // Computed/Summary fields
  public isValid: boolean;
  public validationErrors: string[];

  /**
   * Factory method to convert Domain Entity to View Model
   */
  public static fromDomain(will: Will): WillDetailVm {
    const vm = new WillDetailVm();

    vm.id = will.id.toString();
    vm.testatorId = will.testatorId;
    vm.versionNumber = will.versionNumber;
    vm.status = will.status;
    vm.type = will.type;

    // Dates & Value Objects
    // Note: Assuming Entity has createdAt/updatedAt (Standard Entity props)
    // If not directly exposed on Aggregate, we map what is available.
    vm.createdAt = (will as any).props.createdAt?.toISOString() || new Date().toISOString();
    vm.updatedAt = (will as any).props.updatedAt?.toISOString() || new Date().toISOString();

    if (will.executionDate) {
      vm.executionDate = will.executionDate.toISOString();
      vm.executionLocation = (will.executionDate as any).props.location;
    }

    // Revocation
    vm.isRevoked = will.isRevoked;
    if (will.isRevoked) {
      vm.revocationDetails = {
        method: will.revocationMethod!,
        reason: (will as any).props.revocationReason, // Assuming prop exists or logic handles it
        date: will.revokedAt!.toISOString(),
      };
    }

    // Instructions
    vm.funeralWishes = will.funeralWishes;
    vm.burialLocation = will.burialLocation;
    vm.residuaryClause = will.residuaryClause;

    // Capacity
    if (will.capacityDeclaration) {
      vm.capacityDeclaration = {
        status: will.capacityDeclaration.toJSON().status,
        date: will.capacityDeclaration.toJSON().declarationDate,
        riskLevel: will.capacityDeclaration.getRiskLevel(),
        isLegallySufficient: will.capacityDeclaration.isLegallySufficient(),
      };
    }

    // Mapping Children
    vm.executors = will.executors.map((e) => ({
      id: e.id.toString(),
      name: e.getDisplayName(),
      type: e.executorIdentity.type,
      priority: e.priority.getLabel(),
      isQualified: e.isLegallyQualified(),
      status: e.consentStatus || 'PENDING',
    }));

    vm.bequests = will.bequests.map((b) => ({
      id: b.id.toString(),
      beneficiaryName: b.beneficiary.getDisplayName(),
      type: b.bequestType,
      description: b.description,
      valueSummary: b.getValueSummary().description,
      riskLevel: b.getRiskAssessment().riskLevel,
    }));

    vm.witnesses = will.witnesses.map((w) => ({
      id: w.id.toString(),
      name: w.getDisplayName(),
      status: w.status,
      type: w.witnessIdentity.type,
      signedAt: w.signedAt?.toISOString(),
    }));

    vm.codicils = will.codicils.map((c) => ({
      id: c.id.toString(),
      title: c.title,
      date: c.codicilDate.toISOString(),
      type: c.amendmentType,
      isExecuted: c.isExecuted(),
    }));

    vm.disinheritanceRecords = will.disinheritanceRecords.map((d) => ({
      id: d.id.toString(),
      personName: d.disinheritedPerson.getDisplayName(),
      reasonCategory: d.reasonCategory,
      riskLevel: d.legalRiskLevel,
      isActive: d.isActive,
    }));

    // Validation Status
    vm.isValid = will.isValid;
    vm.validationErrors = will.validationErrors;

    return vm;
  }
}

// --- Nested View Models (Lightweight interfaces) ---

export interface ExecutorVm {
  id: string;
  name: string;
  type: string;
  priority: string;
  isQualified: boolean;
  status: string;
}

export interface BequestVm {
  id: string;
  beneficiaryName: string;
  type: string;
  description: string;
  valueSummary: string;
  riskLevel: string;
}

export interface WitnessVm {
  id: string;
  name: string;
  status: string;
  type: string;
  signedAt?: string;
}

export interface CodicilVm {
  id: string;
  title: string;
  date: string;
  type: string;
  isExecuted: boolean;
}

export interface DisinheritanceRecordVm {
  id: string;
  personName: string;
  reasonCategory: string;
  riskLevel: string;
  isActive: boolean;
}
