import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { DependantRelationship } from '../../../../../domain/entities/legal-dependant.entity';
import { MoneyDto } from '../common/money.dto';

/**
 * File Dependant Claim DTO
 *
 * Registers a person claiming support under S.26/S.29 of the Law of Succession Act.
 *
 * BUSINESS RULES:
 * 1. Relationship determines the burden of proof (Spouse/Child = S.29(a) vs Others = S.29(b)).
 * 2. Monthly Maintenance Needs are mandatory for calculating "Reasonable Provision".
 */
export class FileDependantClaimDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsString()
  @IsNotEmpty()
  deceasedId: string;

  // --- Identity ---

  @IsString()
  @IsNotEmpty()
  dependantId: string; // Link to Family Member ID

  @IsString()
  @IsNotEmpty()
  dependantName: string;

  @IsEnum(DependantRelationship)
  relationship: DependantRelationship;

  // --- Demographics (Critical for Risk Analysis) ---

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date; // Mandatory for Children to prove Minor status

  @IsBoolean()
  isIncapacitated: boolean; // Triggers higher dependency level

  @IsBoolean()
  hasDisability: boolean; // Triggers higher dependency level

  // --- Financial Need (The Core Claim) ---

  @ValidateNested()
  @Type(() => MoneyDto)
  monthlyMaintenanceNeeds: MoneyDto; // "How much do you need?"

  // --- Custody (For Minors) ---

  @IsString()
  @IsOptional()
  custodialParentId?: string;

  @IsString()
  @IsOptional()
  guardianId?: string;

  @IsString()
  @IsNotEmpty()
  filedBy: string;
}
