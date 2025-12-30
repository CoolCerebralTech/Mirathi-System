import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class HouseHeadDto {
  @ApiProperty()
  memberId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isAlive: boolean;

  @ApiProperty()
  marriageStatus: string;
}

class HouseMemberDto {
  @ApiProperty()
  memberId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['CHILD', 'SPOUSE', 'GRANDCHILD', 'OTHER'] })
  relationshipToHead: string;

  @ApiPropertyOptional()
  age?: number;

  @ApiProperty()
  isMinor: boolean;

  @ApiProperty()
  isStudent: boolean;

  @ApiProperty()
  hasDisability: boolean;

  @ApiProperty()
  isEligibleBeneficiary: boolean;
}

export class HouseGroupDto {
  @ApiProperty()
  houseId: string;

  @ApiProperty()
  houseName: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  theoreticalSharePercentage: number;

  @ApiProperty({ type: HouseHeadDto })
  headOfHouse: HouseHeadDto;

  @ApiProperty({ type: [HouseMemberDto] })
  members: HouseMemberDto[];

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  minorCount: number;
}

export class PolygamyStatusDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty()
  isPolygamous: boolean;

  @ApiProperty({ enum: ['PER_STIRPES', 'PER_CAPITA'] })
  distributionMethod: string;

  @ApiProperty()
  totalHouses: number;

  @ApiProperty({ type: [HouseGroupDto] })
  houses: HouseGroupDto[];

  @ApiProperty({
    type: [HouseMemberDto],
    description: 'Members not assigned to a specific house (Risk area)',
  })
  unassignedMembers: HouseMemberDto[];

  @ApiProperty()
  hasUnassignedRisks: boolean;
}
