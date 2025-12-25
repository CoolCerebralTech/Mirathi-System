import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ enum: ['CHILD', 'SPOUSE', 'OTHER'] })
  relationshipToHead: 'CHILD' | 'SPOUSE' | 'OTHER';

  @ApiProperty()
  age: number;

  @ApiProperty()
  isMinor: boolean;
}

export class HouseGroupDto {
  @ApiProperty()
  houseId: string;

  @ApiProperty()
  houseName: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: HouseHeadDto })
  headOfHouse: HouseHeadDto;

  @ApiProperty({ type: [HouseMemberDto] })
  members: HouseMemberDto[];

  @ApiProperty()
  memberCount: number;
}

export class PolygamyStatusDto {
  @ApiProperty()
  familyId: string;

  @ApiProperty()
  isPolygamous: boolean;

  @ApiProperty({ type: [HouseGroupDto] })
  houses: HouseGroupDto[];

  @ApiProperty({
    type: [HouseMemberDto],
    description: 'Members not assigned to a specific house (Risk area)',
  })
  unassignedMembers: HouseMemberDto[];
}
