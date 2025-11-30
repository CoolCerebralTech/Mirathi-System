import { AggregateRoot } from '@nestjs/cqrs';
import {
  DependencyLevel,
  GuardianAppointmentSource,
  GuardianType,
  InheritanceRights,
  Prisma,
  RelationshipType,
} from '@prisma/client';

import { CustomaryMarriageRegisteredEvent } from '../events/customary-marriage-registered.event';
import { FamilyArchivedEvent } from '../events/family-archived.event';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

export class KenyanDependantStatus {
  constructor(
    public readonly isDependant: boolean,
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {}
}

// Tree Visualization Interface matching Frontend expectations
export interface TreeVisualizationData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'person' | 'spouse' | 'deceased';
    data: {
      isDeceased?: boolean;
      isMinor?: boolean;
      dateOfBirth?: string;
      dateOfDeath?: string;
      relationshipType?: string;
      inheritanceRights?: InheritanceRights;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    type: 'marriage' | 'parent_child' | 'sibling' | 'guardianship';
    data: {
      marriageType?: string;
      marriageDate?: string;
      isAdopted?: boolean;
      guardianshipType?: string;
      inheritanceRights?: InheritanceRights;
    };
  }>;
  metadata: {
    generationCount: number;
    memberCount: number;
    deceasedCount: number;
    minorCount: number;
    lastCalculated: string;
    familyHeadId?: string;
    customaryMarriages: number;
    polygamousMarriages: number;
  };
}

// Family Reconstitution Interface
export interface FamilyReconstitutionProps {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;

  // Kenyan Identity Fields
  clanName: string | null;
  subClan: string | null;
  ancestralHome: string | null;
  familyTotem: string | null;
  familyHeadId: string | null;

  // Legal Status
  hasCustomaryMarriage: boolean;
  hasPolygamousMarriage: boolean;

  // Statistics
  memberCount: number;
  livingMemberCount: number;
  minorCount: number;
  customaryMarriageCount: number;
  polygamousMarriageCount: number;

  // Fixed: Use Prisma.JsonValue directly (it includes null)
  treeData: Prisma.JsonValue;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// -----------------------------------------------------------------------------
// AGGREGATE ROOT: FAMILY
// -----------------------------------------------------------------------------

export class Family extends AggregateRoot {
  // Core Identity
  private readonly id: string;
  private name: string;
  private description: string | null;
  private readonly creatorId: string;

  // Kenyan Identity Fields
  private clanName: string | null;
  private subClan: string | null;
  private ancestralHome: string | null;
  private familyTotem: string | null;
  private familyHeadId: string | null;

  // Legal Status Tracking
  private hasCustomaryMarriage: boolean;
  private hasPolygamousMarriage: boolean;

  // Statistics
  private memberCount: number;
  private livingMemberCount: number;
  private minorCount: number;
  private customaryMarriageCount: number;
  private polygamousMarriageCount: number;

  // Visualization
  private treeData: Prisma.JsonValue;

  // Lifecycle
  private isActive: boolean;
  private readonly createdAt: Date; // Readonly, set in constructor
  private updatedAt: Date; // Mutable, changes on actions
  private deletedAt: Date | null;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    creatorId: string,
    name: string,
    description: string | null,
    // Optional params for Reconstitution vs Creation
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
  ) {
    super();
    this.id = id;
    this.creatorId = creatorId;
    this.name = name;
    this.description = description;

    // Defaults
    this.clanName = null;
    this.subClan = null;
    this.ancestralHome = null;
    this.familyTotem = null;
    this.familyHeadId = null;

    this.hasCustomaryMarriage = false;
    this.hasPolygamousMarriage = false;

    this.memberCount = 0;
    this.livingMemberCount = 0;
    this.minorCount = 0;
    this.customaryMarriageCount = 0;
    this.polygamousMarriageCount = 0;

    this.treeData = null;
    this.isActive = true;

    // Lifecycle assignment
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
    this.deletedAt = deletedAt ?? null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(id: string, creatorId: string, name: string, description?: string): Family {
    if (!name.trim()) throw new Error('Family name is required.');
    if (!creatorId) throw new Error('Family must have a creator.');

    // Pass null/undefined for lifecycle to trigger defaults in constructor
    const family = new Family(id, creatorId, name, description || null);

    family.apply(new FamilyCreatedEvent(id, creatorId, name, new Date()));
    return family;
  }

  static reconstitute(props: FamilyReconstitutionProps): Family {
    // Pass lifecycle dates into constructor to satisfy 'readonly' requirements
    const family = new Family(
      props.id,
      props.creatorId,
      props.name,
      props.description,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );

    // Map properties
    family.clanName = props.clanName;
    family.subClan = props.subClan;
    family.ancestralHome = props.ancestralHome;
    family.familyTotem = props.familyTotem;
    family.familyHeadId = props.familyHeadId;

    family.hasCustomaryMarriage = props.hasCustomaryMarriage;
    family.hasPolygamousMarriage = props.hasPolygamousMarriage;

    family.memberCount = props.memberCount;
    family.livingMemberCount = props.livingMemberCount;
    family.minorCount = props.minorCount;
    family.customaryMarriageCount = props.customaryMarriageCount;
    family.polygamousMarriageCount = props.polygamousMarriageCount;

    family.isActive = props.isActive;

    // Handle Tree Data
    family.treeData = props.treeData;

    return family;
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateKenyanIdentity(identity: {
    clanName?: string;
    subClan?: string;
    ancestralHome?: string;
    familyTotem?: string;
  }): void {
    if (identity.clanName !== undefined) this.clanName = identity.clanName;
    if (identity.subClan !== undefined) this.subClan = identity.subClan;
    if (identity.ancestralHome !== undefined) this.ancestralHome = identity.ancestralHome;
    if (identity.familyTotem !== undefined) this.familyTotem = identity.familyTotem;

    this.updatedAt = new Date();
  }

  registerCustomaryMarriage(marriageDetails: {
    spouse1Id: string;
    spouse2Id: string;
    marriageDate: Date;
    elderWitnesses: string[];
    bridePricePaid: boolean;
    bridePriceAmount?: number;
    ceremonyLocation: string;
    traditionalCeremonyType?: string;
    clanApproval?: boolean;
  }): void {
    if (!marriageDetails.elderWitnesses || marriageDetails.elderWitnesses.length === 0) {
      throw new Error('Customary marriage requires elder witnesses to be legally valid.');
    }
    if (!marriageDetails.ceremonyLocation) {
      throw new Error('Ceremony location is required for customary marriage registration.');
    }

    this.hasCustomaryMarriage = true;
    this.customaryMarriageCount++;
    this.updatedAt = new Date();

    this.apply(new CustomaryMarriageRegisteredEvent(this.id, { ...marriageDetails }));
  }

  registerPolygamousMarriage(): void {
    // Note: Validation Logic moved to Service Layer or checked via validation method
    this.hasPolygamousMarriage = true;
    this.polygamousMarriageCount++;
    this.updatedAt = new Date();
  }

  appointFamilyHead(familyMemberId: string): void {
    if (!familyMemberId) {
      throw new Error('Family member ID is required for family head appointment.');
    }
    this.familyHeadId = familyMemberId;
    this.updatedAt = new Date();
  }

  assignGuardian(guardianDetails: {
    guardianId: string;
    wardId: string;
    type: GuardianType;
    appointedBy: GuardianAppointmentSource;
    appointmentDate: Date;
    courtOrderNumber?: string;
    // ... other params handled in event payload
  }): void {
    if (guardianDetails.guardianId === guardianDetails.wardId) {
      throw new Error('A person cannot be their own guardian.');
    }
    if (guardianDetails.type === GuardianType.LEGAL_GUARDIAN && !guardianDetails.courtOrderNumber) {
      throw new Error('Legal Guardian appointment requires a valid Court Order Number.');
    }

    this.updatedAt = new Date();
    this.apply(
      new GuardianAssignedEvent(this.id, {
        ...guardianDetails,
      }),
    );
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT
  // --------------------------------------------------------------------------

  addFamilyMember(memberDetails: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    isDeceased?: boolean;
    isMinor: boolean;
    role: RelationshipType;
  }): void {
    if (memberDetails.isMinor && !memberDetails.dateOfBirth) {
      throw new Error('Minors must have a date of birth for age verification under the Law.');
    }

    this.memberCount++;
    this.livingMemberCount += memberDetails.isDeceased ? 0 : 1;
    this.minorCount += memberDetails.isMinor ? 1 : 0;

    this.updatedAt = new Date();

    this.apply(
      new FamilyMemberAddedEvent(this.id, {
        ...memberDetails,
        isDeceased: memberDetails.isDeceased ?? false,
      }),
    );
  }

  updateMemberStatus(updates: {
    memberId: string;
    becameDeceased?: boolean;
    becameAdult?: boolean;
    newMinor?: boolean;
  }): void {
    if (updates.becameDeceased && this.livingMemberCount > 0) {
      this.livingMemberCount--;
    }
    if (updates.becameAdult && this.minorCount > 0) {
      this.minorCount--;
    }
    if (updates.newMinor) {
      this.minorCount++;
    }
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & RULES
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.memberCount === 0) {
      errors.push('Family must have at least one member to determine dependants.');
    }

    if (this.minorCount > 0) {
      if (!this.familyHeadId && this.livingMemberCount < 2) {
        warnings.push(
          'Family with minors needs a Guardian or Family Head for estate administration.',
        );
      }
    }

    if (this.hasPolygamousMarriage && !this.hasCustomaryMarriage) {
      warnings.push('Polygamy detected but no Customary Marriage registered.');
    }

    if (this.livingMemberCount === 0) {
      errors.push('No living family members found. Estate must be administered by Public Trustee.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // --------------------------------------------------------------------------
  // GETTERS (Exposing the fields to satisfy usage checks)
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return this.description;
  }
  getCreatorId(): string {
    return this.creatorId;
  }

  getClanName(): string | null {
    return this.clanName;
  }
  getSubClan(): string | null {
    return this.subClan;
  }
  getAncestralHome(): string | null {
    return this.ancestralHome;
  }
  getFamilyTotem(): string | null {
    return this.familyTotem;
  }
  getFamilyHeadId(): string | null {
    return this.familyHeadId;
  }

  getHasCustomaryMarriage(): boolean {
    return this.hasCustomaryMarriage;
  }
  getHasPolygamousMarriage(): boolean {
    return this.hasPolygamousMarriage;
  }

  getMemberCount(): number {
    return this.memberCount;
  }
  getLivingMemberCount(): number {
    return this.livingMemberCount;
  }
  getMinorCount(): number {
    return this.minorCount;
  }

  getTreeData(): Prisma.JsonValue {
    return this.treeData;
  }

  // These Getters ensure createdAt/updatedAt are "read" and used
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  getIsActive(): boolean {
    return this.isActive;
  }

  // --------------------------------------------------------------------------
  // VISUALIZATION & ARCHIVING
  // --------------------------------------------------------------------------

  updateTreeVisualization(data: Prisma.JsonValue): void {
    this.treeData = data;
    this.updatedAt = new Date();
    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.id));
  }

  archive(archivedBy: string): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.apply(new FamilyArchivedEvent(this.id, archivedBy));
  }

  restore(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }
}
