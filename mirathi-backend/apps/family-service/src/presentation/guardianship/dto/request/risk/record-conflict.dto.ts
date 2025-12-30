import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

import { ConflictType } from '../../../../../domain/entities/guardian-assignment.entity';

export enum RiskSeverity {
  LOW = 'LOW', // e.g., Minor administrative delay
  MEDIUM = 'MEDIUM', // e.g., Unclear accounting
  HIGH = 'HIGH', // e.g., Borrowing from ward's funds
  CRITICAL = 'CRITICAL', // e.g., selling assets without court order (Triggers Suspension)
}

export class RecordConflictDto {
  @ApiProperty({ description: 'The Guardian involved in the conflict' })
  @IsUUID()
  guardianId: string;

  @ApiProperty({
    enum: ConflictType,
    description: 'Category of the conflict',
  })
  @IsEnum(ConflictType)
  conflictType: ConflictType;

  @ApiProperty({
    description: 'Detailed description of the issue',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty({
    enum: RiskSeverity,
    description: 'Impact level. CRITICAL triggers automatic suspension.',
  })
  @IsEnum(RiskSeverity)
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
