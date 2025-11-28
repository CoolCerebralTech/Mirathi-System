import { RelationshipType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
