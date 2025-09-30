import { IsString, IsEnum, IsOptional, IsArray, MinLength, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../../enums';
import { PaginationQueryDto } from '../shared/pagination.dto';

export class CreateTemplateRequestDto {
  @ApiProperty() @IsString() @MinLength(3)
    name!: string;
  @ApiProperty({ enum: NotificationChannel }) @IsEnum(NotificationChannel)
    channel!: NotificationChannel;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiProperty() @IsString() @MinLength(10)
    body!: string;
  @ApiProperty({ isArray: true, type: String }) @IsArray() @IsString({ each: true })
    variables!: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTemplateRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(3) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(10) body?: string;
  @ApiPropertyOptional({ isArray: true, type: String }) @IsOptional() @IsArray() @IsString({ each: true }) variables?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class TemplateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NotificationChannel }) @IsOptional() @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}