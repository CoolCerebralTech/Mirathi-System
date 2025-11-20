import { AggregateRoot } from '@nestjs/cqrs';
import { GuardianType } from '@prisma/client';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';
import { GuardianRemovedEvent } from '../events/guardian-removed.event';
import { GuardianshipAuthority } from '../value-objects/guardianship-authority.vo';

export class Guardianship extends AggregateRoot {
  private id: string;

  // Links
  private guardianId: string; // The Adult FamilyMember
  private wardId: string; // The Minor FamilyMember

  // Legal Configuration
  private type: GuardianType;
  private appointedBy: string | null; // Will ID or Court Order Ref

  // Timeline
  private appointmentDate: Date;
  private validUntil: Date | null;

  // Status
  private isActiveRecord: boolean; // Manual override (e.g. removal)
  private notes: string | null;

  private createdAt: Date;
  private updatedAt: Date;

  // Private constructor
  private constructor(
    id: string,
    guardianId: string,
    wardId: string,
    type: GuardianType,
    appointmentDate: Date,
  ) {
    super();
    if (guardianId === wardId) {
      throw new Error('A member cannot be their own guardian.');
    }

    this.id = id;
    this.guardianId = guardianId;
    this.wardId = wardId;
    this.type = type;
    this.appointmentDate = appointmentDate;

    // Defaults
    this.appointedBy = null;
    this.validUntil = null;
    this.isActiveRecord = true;
    this.notes = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    familyId: string, // Passed for Event context
    guardianId: string,
    wardId: string,
    type: GuardianType,
    wardDob: Date, // Required to calculate expiry
    appointedBy?: string,
  ): Guardianship {
    const guardianship = new Guardianship(id, guardianId, wardId, type, new Date());

    // Use Value Object to calculate legal limits (Age 18)
    // Mapping Prisma Enum to VO Source type if necessary, or logic here
    // Here we assume direct logic or usage of VO helper
    const authority = new GuardianshipAuthority(
      type === 'TESTAMENTARY' ? 'TESTAMENTARY' : 'COURT_ORDER', // Simplified mapping
      wardDob,
    );

    guardianship.validUntil = authority.getExpiryDate();
    if (appointedBy) guardianship.appointedBy = appointedBy;

    guardianship.apply(
      new GuardianAssignedEvent(
        id,
        familyId,
        guardianId,
        wardId,
        type,
        guardianship.appointmentDate,
        guardianship.validUntil,
      ),
    );

    return guardianship;
  }

  static reconstitute(props: any): Guardianship {
    const guardianship = new Guardianship(
      props.id,
      props.guardianId,
      props.wardId,
      props.type,
      new Date(props.appointmentDate),
    );

    guardianship.appointedBy = props.appointedBy || null;
    guardianship.validUntil = props.validUntil ? new Date(props.validUntil) : null;
    guardianship.isActiveRecord = props.isActive;
    guardianship.notes = props.notes || null;
    guardianship.createdAt = new Date(props.createdAt);
    guardianship.updatedAt = new Date(props.updatedAt);

    return guardianship;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Terminate the guardianship manually (e.g. Guardian dies, or Court revocation).
   */
  revoke(familyId: string, reason: string): void {
    if (!this.isActiveRecord) return;

    this.isActiveRecord = false;
    this.updatedAt = new Date();

    this.apply(new GuardianRemovedEvent(this.id, familyId, this.guardianId, this.wardId, reason));
  }

  /**
   * Checks if the guardianship is currently legally valid.
   * returns False if manually removed OR if the child has turned 18.
   */
  isValid(): boolean {
    if (!this.isActiveRecord) return false;

    // Check Expiry (Age of Majority)
    if (this.validUntil && new Date() > this.validUntil) {
      return false;
    }

    return true;
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getGuardianId() {
    return this.guardianId;
  }
  getWardId() {
    return this.wardId;
  }
  getType() {
    return this.type;
  }
  getValidUntil() {
    return this.validUntil;
  }
  getIsActiveRecord() {
    return this.isActiveRecord;
  }
  getAppointedBy() {
    return this.appointedBy;
  }
}
