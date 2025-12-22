// application/guardianship/queries/base.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { IQuery } from '../../common/interfaces/use-case.interface';

export abstract class BaseQuery implements IQuery {
  @ApiProperty({
    description: 'Unique query identifier for tracing',
    example: 'qry-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  abstract readonly queryId: string;

  @ApiProperty({
    description: 'Timestamp when query was issued',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  abstract readonly timestamp: Date;

  @ApiPropertyOptional({
    description: 'Correlation ID for distributed tracing',
    example: 'corr-123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  readonly correlationId?: string;

  @ApiProperty({
    description: 'User ID who issued the query',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  abstract readonly userId: string;

  constructor(correlationId?: string) {
    if (correlationId) {
      (this as any).correlationId = correlationId;
    }
  }

  /**
   * Abstract method to get query name for logging and auditing
   */
  abstract getQueryName(): string;
}