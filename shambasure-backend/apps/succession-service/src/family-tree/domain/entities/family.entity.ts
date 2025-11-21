import { AggregateRoot } from '@nestjs/cqrs';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMetadataUpdatedEvent } from '../events/family-metadata-updated.event';
import { FamilyArchivedEvent } from '../events/family-archived.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';
import { CustomaryMarriageRegisteredEvent } from '../events/customary-marriage-registered.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';

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
  };
}

export interface KenyanFamilyMetadata {
  // Kenyan-specific family structure
  hasCustomaryMarriage: boolean;
  hasPolygamousMarriage: boolean;
  familyHeadId?: string; // Eldest male or appointed head
  clanName?: string;
  subClan?: string;
  ancestralHome?: string; // Rural home location
  familyTotem?: string; // Traditional family symbol
}
// Define a proper interface for reconstitution props
interface FamilyReconstitutionProps {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  metadata?: KenyanFamilyMetadata;
  treeData?: TreeVisualizationData | string | null;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  memberCount?: number;
  livingMemberCount?: number;
  minorCount?: number;
}

export class Family extends AggregateRoot {
  private id: string;
  private name: string;
  private description: string | null;
  private creatorId: string;

  // Kenyan Family Metadata
  private metadata: KenyanFamilyMetadata;

  // Performance Optimization for frontend
  private treeData: TreeVisualizationData | null;

  // Legal Status Tracking
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Statistics for quick queries
  private memberCount: number;
  private livingMemberCount: number;
  private minorCount: number;

  private constructor(
    id: string,
    creatorId: string,
    name: string,
    description?: string,
    metadata?: Partial<KenyanFamilyMetadata>,
  ) {
    super();
    this.id = id;
    this.creatorId = creatorId;
    this.name = name;
    this.description = description || null;

    // Initialize Kenyan metadata
    this.metadata = {
      hasCustomaryMarriage: false,
      hasPolygamousMarriage: false,
      familyHeadId: undefined,
      clanName: metadata?.clanName,
      subClan: metadata?.subClan,
      ancestralHome: metadata?.ancestralHome,
      familyTotem: metadata?.familyTotem,
      ...metadata,
    };

    this.treeData = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;

    // Initialize counters
    this.memberCount = 0;
    this.livingMemberCount = 0;
    this.minorCount = 0;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    creatorId: string,
    name: string,
    description?: string,
    metadata?: Partial<KenyanFamilyMetadata>,
  ): Family {
    if (!name.trim()) throw new Error('Family name is required.');
    if (!creatorId) throw new Error('Family must have a creator.');

    const family = new Family(id, creatorId, name, description, metadata);

    // Emit event with proper metadata and timestamp
    family.apply(new FamilyCreatedEvent(id, creatorId, name, family.metadata, new Date()));

    return family;
  }

  static reconstitute(props: FamilyReconstitutionProps): Family {
    const family = new Family(
      props.id,
      props.creatorId,
      props.name,
      props.description,
      props.metadata,
    );

    // -----------------------------
    // TREE DATA PARSING
    // -----------------------------
    if (props.treeData) {
      if (typeof props.treeData === 'string') {
        try {
          family.treeData = JSON.parse(props.treeData) as TreeVisualizationData;
        } catch (error) {
          console.warn('Failed to parse treeData JSON:', error);
          family.treeData = null;
        }
      } else {
        family.treeData = props.treeData;
      }
    } else {
      family.treeData = null;
    }

    // -----------------------------
    // BOOLEAN FLAGS
    // -----------------------------
    family.isActive = props.isActive ?? true;

    // -----------------------------
    // DATE FIELDS
    // -----------------------------
    family.createdAt =
      props.createdAt instanceof Date
        ? props.createdAt
        : typeof props.createdAt === 'string'
          ? new Date(props.createdAt)
          : new Date();

    family.updatedAt =
      props.updatedAt instanceof Date
        ? props.updatedAt
        : typeof props.updatedAt === 'string'
          ? new Date(props.updatedAt)
          : new Date();

    family.deletedAt =
      props.deletedAt instanceof Date
        ? props.deletedAt
        : typeof props.deletedAt === 'string'
          ? new Date(props.deletedAt)
          : null;

    // -----------------------------
    // COUNTERS
    // -----------------------------
    family.memberCount = props.memberCount ?? 0;
    family.livingMemberCount = props.livingMemberCount ?? 0;
    family.minorCount = props.minorCount ?? 0;

    // -----------------------------
    // METADATA
    // -----------------------------
    family.metadata = {
      hasCustomaryMarriage: props.metadata?.hasCustomaryMarriage ?? false,
      hasPolygamousMarriage: props.metadata?.hasPolygamousMarriage ?? false,
      familyHeadId: props.metadata?.familyHeadId,
      clanName: props.metadata?.clanName,
      subClan: props.metadata?.subClan,
      ancestralHome: props.metadata?.ancestralHome,
      familyTotem: props.metadata?.familyTotem,
    };

    return family;
  }

  // --------------------------------------------------------------------------
  // KENYAN FAMILY BUSINESS LOGIC
  // --------------------------------------------------------------------------

  updateMetadata(name: string, description?: string): void {
    if (!name.trim()) {
      throw new Error('Family name cannot be empty.');
    }

    this.name = name.trim();
    if (description !== undefined) {
      this.description = description;
    }
    this.updatedAt = new Date();

    this.apply(new FamilyMetadataUpdatedEvent(this.id, this.name, this.description || undefined));
  }

  updateKenyanMetadata(metadata: Partial<KenyanFamilyMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    };
    this.updatedAt = new Date();
  }

  registerCustomaryMarriage(marriageDetails: {
    spouse1Id: string;
    spouse2Id: string;
    marriageDate: Date;
    elderWitnesses: string[];
    bridePricePaid: boolean;
    ceremonyLocation: string;
    marriageType?: 'CUSTOMARY' | 'CHRISTIAN' | 'CIVIL' | 'ISLAMIC';
    lobolaAmount?: number;
    lobolaCurrency?: string;
    traditionalCeremonyType?: string;
  }): void {
    this.metadata.hasCustomaryMarriage = true;
    this.updatedAt = new Date();

    // Ensure marriage type is set
    const fullMarriageDetails = {
      marriageType: 'CUSTOMARY' as const,
      lobolaAmount: 0,
      lobolaCurrency: 'KES',
      traditionalCeremonyType: 'Unknown',
      ...marriageDetails,
    };

    this.apply(new CustomaryMarriageRegisteredEvent(this.id, fullMarriageDetails));
  }

  registerPolygamousMarriage(): void {
    this.metadata.hasPolygamousMarriage = true;
    this.updatedAt = new Date();
  }

  appointFamilyHead(familyMemberId: string): void {
    if (!familyMemberId) {
      throw new Error('Family member ID is required for family head appointment.');
    }

    this.metadata.familyHeadId = familyMemberId;
    this.updatedAt = new Date();
  }

  assignGuardian(guardianDetails: {
    guardianId: string;
    wardId: string;
    guardianType: string;
    appointedBy: 'court' | 'family' | 'will';
    validUntil?: Date;
    notes?: string;
  }): void {
    // Validate guardian assignment
    if (guardianDetails.guardianId === guardianDetails.wardId) {
      throw new Error('Guardian cannot be the same as ward.');
    }

    this.updatedAt = new Date();

    // Add appointmentDate automatically
    const eventPayload = {
      ...guardianDetails,
      appointmentDate: new Date(), // Required by the event
    };

    this.apply(new GuardianAssignedEvent(this.id, eventPayload));
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT BUSINESS LOGIC
  // --------------------------------------------------------------------------

  addFamilyMember(memberDetails: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    isDeceased?: boolean;
    dateOfDeath?: Date;
    isMinor: boolean;
  }): void {
    this.memberCount++;

    if (!memberDetails.isDeceased) {
      this.livingMemberCount++;
    }

    if (memberDetails.isMinor) {
      this.minorCount++;
    }

    this.updatedAt = new Date();

    this.apply(new FamilyMemberAddedEvent(this.id, memberDetails));
  }

  removeFamilyMember(memberDetails: {
    memberId: string;
    wasDeceased: boolean;
    wasMinor: boolean;
  }): void {
    this.memberCount = Math.max(0, this.memberCount - 1);

    if (!memberDetails.wasDeceased) {
      this.livingMemberCount = Math.max(0, this.livingMemberCount - 1);
    }

    if (memberDetails.wasMinor) {
      this.minorCount = Math.max(0, this.minorCount - 1);
    }

    this.updatedAt = new Date();
  }

  updateMemberStatus(updates: {
    becameDeceased?: boolean;
    becameAdult?: boolean; // Minor turning 18
    newMinor?: boolean; // Birth of new minor
  }): void {
    if (updates.becameDeceased) {
      this.livingMemberCount = Math.max(0, this.livingMemberCount - 1);
    }

    if (updates.becameAdult) {
      this.minorCount = Math.max(0, this.minorCount - 1);
    }

    if (updates.newMinor) {
      this.minorCount++;
    }

    this.updatedAt = new Date();
  }

  /**
   * Updates the cached visualization data with Kenyan family structure
   */
  updateTreeVisualization(data: TreeVisualizationData): void {
    this.treeData = data;
    this.updatedAt = new Date();

    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.id));
  }

  // --------------------------------------------------------------------------
  // LIFECYCLE MANAGEMENT
  // --------------------------------------------------------------------------

  archive(archivedBy: string): void {
    if (!this.isActive) return; // Idempotent

    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();

    this.apply(new FamilyArchivedEvent(this.id, archivedBy));
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS (Kenyan Law Compliance)
  // --------------------------------------------------------------------------

  validateForSuccession(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Law of Succession Act requirements
    if (this.memberCount === 0) {
      errors.push('Family must have at least one member for succession purposes.');
    }

    if (this.minorCount > 0 && !this.metadata.familyHeadId) {
      errors.push('Family with minors must have an appointed family head for guardianship.');
    }

    // Customary law validation
    if (this.metadata.hasPolygamousMarriage && !this.metadata.hasCustomaryMarriage) {
      errors.push(
        'Polygamous marriages must be registered as customary marriages under Kenyan law.',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  canInitiateProbate(): boolean {
    const validation = this.validateForSuccession();
    return validation.isValid && this.livingMemberCount > 0;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }

  getCreatorId(): string {
    return this.creatorId;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | null {
    return this.description;
  }

  getMetadata(): KenyanFamilyMetadata {
    return { ...this.metadata };
  }

  getTreeData(): TreeVisualizationData | null {
    return this.treeData;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
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

  getStatistics() {
    return {
      totalMembers: this.memberCount,
      livingMembers: this.livingMemberCount,
      minors: this.minorCount,
      deceased: this.memberCount - this.livingMemberCount,
      hasCustomaryMarriage: this.metadata.hasCustomaryMarriage,
      hasPolygamousMarriage: this.metadata.hasPolygamousMarriage,
      familyHeadAppointed: !!this.metadata.familyHeadId,
    };
  }
}
