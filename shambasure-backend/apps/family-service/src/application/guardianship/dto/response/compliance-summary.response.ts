// application/guardianship/dto/response/compliance-summary.response.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GuardianshipComplianceSummaryResponse {
  @ApiProperty({
    description: 'Total guardianships',
    example: 100,
  })
  @Expose()
  total: number;

  @ApiProperty({
    description: 'Active guardianships',
    example: 75,
  })
  @Expose()
  active: number;

  @ApiProperty({
    description: 'Terminated guardianships',
    example: 25,
  })
  @Expose()
  terminated: number;

  @ApiProperty({
    description: 'Bond required',
    example: 60,
  })
  @Expose()
  bondRequired: number;

  @ApiProperty({
    description: 'Bond compliant',
    example: 45,
  })
  @Expose()
  bondCompliant: number;

  @ApiProperty({
    description: 'S.73 compliant',
    example: 50,
  })
  @Expose()
  s73Compliant: number;

  @ApiProperty({
    description: 'S.73 non-compliant',
    example: 10,
  })
  @Expose()
  s73NonCompliant: number;

  @ApiProperty({
    description: 'With property powers',
    example: 40,
  })
  @Expose()
  propertyPowers: number;

  @ApiProperty({
    description: 'Court appointed',
    example: 30,
  })
  @Expose()
  courtAppointed: number;

  @ApiProperty({
    description: 'Testamentary',
    example: 70,
  })
  @Expose()
  testamentary: number;
}
