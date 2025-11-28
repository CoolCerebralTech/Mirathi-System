import { IsUUID, IsEnum, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';
import { RelationshipType } from '@prisma/client';

export class CreateRelationshipDto {
  @IsUUID()
  @IsNotEmpty()
  fromMemberId: string;

  @IsUUID()
  @IsNotEmpty()
  toMemberId: string;

  @IsEnum(RelationshipType)
  type: RelationshipType;

  // --- Metadata for Legal Context ---
  @IsBoolean()
  @IsOptional()
  isAdopted?: boolean;

  @IsString()
  @IsOptional()
  adoptionOrderNumber?: string; // Proof of adoption

  @IsBoolean()
  @IsOptional()
  bornOutOfWedlock?: boolean; // Flags for Section 29 analysis
}
