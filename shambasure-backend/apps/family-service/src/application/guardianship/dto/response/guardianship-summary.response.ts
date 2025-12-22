// application/guardianship/dto/response/guardianship-summary.response.ts
import { ApiProperty } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class GuardianshipSummaryResponse {
  @ApiProperty({
    description: 'Guardianship unique ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Ward ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  wardId: string;

  @ApiProperty({
    description: 'Guardian ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @Expose()
  guardianId: string;

  @ApiProperty({
    description: 'Type of guardianship',
    enum: GuardianType,
    example: GuardianType.COURT_APPOINTED,
  })
  @Expose()
  type: GuardianType;

  @ApiProperty({
    description: 'Whether guardianship is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether bond has been posted',
    example: true,
  })
  @Expose()
  isBondPosted: boolean;

  @ApiProperty({
    description: 'Whether annual report is overdue',
    example: false,
  })
  @Expose()
  isReportOverdue: boolean;

  @ApiProperty({
    description: 'Overall compliance status',
    example: true,
  })
  @Expose()
  isCompliant: boolean;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  // Denormalized data
  @ApiProperty({
    description: 'Ward full name',
    example: 'John Doe',
  })
  @Expose()
  wardName: string;

  @ApiProperty({
    description: 'Guardian full name',
    example: 'Jane Smith',
  })
  @Expose()
  guardianName: string;

  @ApiProperty({
    description: 'Ward age',
    example: 15,
  })
  @Expose()
  wardAge: number;

  @ApiProperty({
    description: 'Guardianship status summary',
    example: 'Active - Compliant',
  })
  @Expose()
  statusSummary: string;

  constructor(partial: Partial<GuardianshipSummaryResponse>) {
    Object.assign(this, partial);
  }
}
