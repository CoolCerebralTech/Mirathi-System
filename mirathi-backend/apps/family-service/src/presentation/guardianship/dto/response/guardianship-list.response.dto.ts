import { ApiProperty } from '@nestjs/swagger';

import { GuardianshipStatus } from '../../../../domain/aggregates/guardianship.aggregate';

export class GuardianshipListItemDto {
  @ApiProperty() id: string;
  @ApiProperty() caseNumber: string;

  @ApiProperty() wardName: string;
  @ApiProperty() wardAge: number;

  @ApiProperty() primaryGuardianName: string;

  @ApiProperty({ enum: GuardianshipStatus })
  status: GuardianshipStatus;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] })
  riskLevel: string;

  @ApiProperty() nextComplianceDue: Date;
  @ApiProperty() establishedDate: Date;
}

export class PaginatedGuardianshipResponseDto {
  @ApiProperty({ type: [GuardianshipListItemDto] })
  items: GuardianshipListItemDto[];

  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
