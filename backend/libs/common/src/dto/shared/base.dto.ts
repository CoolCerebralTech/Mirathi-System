import { ApiProperty } from '@nestjs/swagger';

export class BaseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class AuditableDto extends BaseDto {
  @ApiProperty({
    description: 'User who created the record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy?: string;

  @ApiProperty({
    description: 'User who last updated the record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  updatedBy?: string;
}