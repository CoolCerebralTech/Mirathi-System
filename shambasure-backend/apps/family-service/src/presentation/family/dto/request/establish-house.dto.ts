import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class EstablishPolygamousHouseDto {
  @ApiProperty({ description: 'The UUID of the Head of House (usually the Wife)' })
  @IsUUID()
  headOfHouseId: string;

  @ApiProperty({ example: 2, description: 'The chronological order of the house' })
  @IsInt()
  @Min(1)
  houseOrder: number;

  @ApiPropertyOptional({ example: 'House of Wanjiku' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  houseName?: string;
}
