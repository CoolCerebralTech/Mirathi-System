// src/application/dtos/debt.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DebtCategory, DebtPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class AddDebtDto {
  @ApiProperty({ example: 'Equity Bank Kenya' })
  @IsString()
  @Length(1, 200)
  creditorName: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  creditorContact?: string;

  @ApiProperty({ example: 'Home mortgage' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DebtCategory })
  @IsEnum(DebtCategory)
  category: DebtCategory;

  @ApiProperty({ example: 2000000 })
  @IsNumber()
  @Min(0)
  originalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  outstandingBalance?: number;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSecured?: boolean;

  @ApiPropertyOptional({ example: 'Secured against plot in Kiambu' })
  @IsOptional()
  @IsString()
  securityDetails?: string;
}

export class PayDebtDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

// --- RESPONSE DTO ---
export class DebtResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creditorName: string;

  @ApiProperty({ enum: DebtCategory })
  category: DebtCategory;

  @ApiProperty({ enum: DebtPriority })
  priority: DebtPriority;

  @ApiProperty()
  originalAmount: number;

  @ApiProperty()
  outstandingBalance: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isSecured: boolean;

  @ApiProperty()
  createdAt: Date;
}
