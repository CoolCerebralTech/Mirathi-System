import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class RecordCohabitationDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsNotEmpty()
  @IsUUID()
  partner1Id: string;

  @IsNotEmpty()
  @IsUUID()
  partner2Id: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsBoolean()
  hasChildren?: boolean;

  @IsOptional()
  @IsNumber()
  childrenCount?: number;

  @IsOptional()
  @IsBoolean()
  isAcknowledged?: boolean; // Community recognition

  @IsOptional()
  @IsBoolean()
  isRegistered?: boolean;
}
