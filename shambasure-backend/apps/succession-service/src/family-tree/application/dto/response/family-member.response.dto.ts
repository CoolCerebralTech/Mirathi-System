import { Exclude, Expose, Transform } from 'class-transformer';
import { RelationshipType } from '@prisma/client';

@Exclude()
export class FamilyMemberResponseDto {
  @Expose()
  id: string;

  @Expose()
  familyId: string;

  @Expose()
  userId?: string; // If they are a registered system user

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  role: RelationshipType; // Relationship to the Tree Creator

  @Expose()
  relationshipTo?: string; // Context string e.g. "Father of John"

  // Vital Stats
  @Expose()
  isDeceased: boolean;

  @Expose()
  isMinor: boolean;

  @Expose()
  dateOfBirth?: Date;

  @Expose()
  dateOfDeath?: Date;

  // Computed Helper
  @Expose()
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const diff = Date.now() - new Date(this.dateOfBirth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Contact Info (Exposed from nested object or flat entity getters)
  @Expose()
  @Transform(({ obj }) => obj.contactInfo?.email || obj.email)
  email?: string;

  @Expose()
  @Transform(({ obj }) => obj.contactInfo?.phone || obj.phone)
  phone?: string;

  @Expose()
  @Transform(({ obj }) => obj.contactInfo?.address || obj.address)
  address?: string;

  @Expose()
  createdAt: Date;
}
