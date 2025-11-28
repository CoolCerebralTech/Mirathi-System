import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { NotificationChannel } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

export class CreateTemplateRequestDto {
  @ApiProperty({
    description: 'Unique name of the template.',
    example: 'WELCOME_EMAIL',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    enum: NotificationChannel,
    description: 'The channel this template is designed for.',
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiPropertyOptional({
    description: 'Optional subject line (mainly for email templates).',
    example: 'Welcome to Shamba Sure!',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'The body of the template, with placeholders for variables.',
    example: 'Hello {{firstName}}, welcome to Shamba Sure!',
  })
  @IsString()
  @MinLength(10)
  body!: string;

  @ApiProperty({
    description: 'List of variables used in the template body.',
    isArray: true,
    type: String,
    example: ['firstName'],
  })
  @IsArray()
  @IsString({ each: true })
  variables!: string[];

  @ApiPropertyOptional({
    description: 'Whether the template is active and usable.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTemplateRequestDto {
  @ApiPropertyOptional({
    description: 'Updated name of the template.',
    example: 'WELCOME_EMAIL_V2',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated subject line.',
    example: 'Welcome to Shamba Sure (Updated)!',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Updated body of the template.',
    example: 'Hi {{firstName}}, we are glad to have you back!',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  body?: string;

  @ApiPropertyOptional({
    description: 'Updated list of variables used in the template.',
    isArray: true,
    type: String,
    example: ['firstName'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({
    description: 'Whether the template is active.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class TemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: 'Filter templates by channel.',
    example: NotificationChannel.SMS,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

export class TemplateResponseDto extends BaseResponseDto {
  @ApiProperty({ example: 'WELCOME_EMAIL' })
  name!: string;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  channel!: NotificationChannel;

  @ApiPropertyOptional({ example: 'Welcome to Shamba Sure!' })
  subject?: string;

  @ApiProperty({
    example: 'Hello {{firstName}}, welcome to Shamba Sure!',
  })
  body!: string;

  @ApiProperty({ type: [String], example: ['firstName'] })
  variables!: string[];

  @ApiProperty({ example: true })
  isActive!: boolean;
}
