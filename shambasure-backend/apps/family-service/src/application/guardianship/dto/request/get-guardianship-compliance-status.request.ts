// application/guardianship/dto/request/compliance-check.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ComplianceCheckQuery {
  @ApiPropertyOptional({
    description: 'Check S.72 bond compliance only',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  checkBondOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Check S.73 annual report compliance only',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  checkReportOnly?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include only active guardianships',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiPropertyOptional({
    description: 'Court station filter',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  courtStation?: string;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  detailed?: boolean = false;
}
