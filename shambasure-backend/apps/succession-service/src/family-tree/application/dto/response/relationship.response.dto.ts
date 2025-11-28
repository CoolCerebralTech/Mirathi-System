import { RelationshipType } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RelationshipResponseDto {
  @Expose()
  id: string;

  @Expose()
  fromMemberId: string;

  @Expose()
  toMemberId: string;

  @Expose()
  type: RelationshipType;

  // Metadata (Adoption status, biological flags)
  @Expose()
  metadata?: Record<string, any>;

  // Trust Layer
  @Expose()
  isVerified: boolean;

  @Expose()
  verificationMethod?: string;
}
