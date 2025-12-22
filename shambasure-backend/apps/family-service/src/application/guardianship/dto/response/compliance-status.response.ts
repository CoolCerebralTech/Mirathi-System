// application/guardianship/dto/response/compliance-report.response.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ComplianceReportResponse {
  @ApiProperty({
    description: 'Total number of guardianships',
    example: 100,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Number of active guardianships',
    example: 75,
  })
  @Expose()
  active: number;

  @ApiProperty({
    description: 'Number of terminated guardianships',
    example: 25,
  })
  @Expose()
  terminated: number;

  @ApiProperty({
    description: 'Number of guardianships requiring bond',
    example: 60,
  })
  @Expose()
  bondRequired: number;

  @ApiProperty({
    description: 'Number of guardianships with compliant bond',
    example: 55,
  })
  @Expose()
  bondCompliant: number;

  @ApiProperty({
    description: 'Number of S.73 compliant guardianships',
    example: 40,
  })
  @Expose()
  s73Compliant: number;

  @ApiProperty({
    description: 'Number of S.73 non-compliant guardianships',
    example: 15,
  })
  @Expose()
  s73NonCompliant: number;

  @ApiProperty({
    description: 'Number with property management powers',
    example: 30,
  })
  @Expose()
  propertyPowers: number;

  @ApiProperty({
    description: 'Number of court-appointed guardians',
    example: 45,
  })
  @Expose()
  courtAppointed: number;

  @ApiProperty({
    description: 'Number of testamentary guardians',
    example: 30,
  })
  @Expose()
  testamentary: number;

  @ApiProperty({
    description: 'Overall compliance rate (%)',
    example: 82.5,
  })
  @Expose()
  complianceRate: number;

  @ApiProperty({
    description: 'Number of overdue reports',
    example: 5,
  })
  @Expose()
  overdueReports: number;

  @ApiProperty({
    description: 'Number of expired bonds',
    example: 3,
  })
  @Expose()
  expiredBonds: number;

  constructor(partial: Partial<ComplianceReportResponse>) {
    Object.assign(this, partial);
  }
}
