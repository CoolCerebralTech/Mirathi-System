import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { ApplicationStatus } from '../../../../domain/aggregates/probate-application.aggregate';

// ==============================================================================
// 1. Get Single Application Dashboard
// ==============================================================================
export class GetApplicationDashboardDto {
  @IsUUID()
  applicationId: string;
}

// ==============================================================================
// 2. List User Applications (My Cases)
// ==============================================================================
export class GetUserApplicationsDto {
  @IsUUID()
  userId: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  // Pagination
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;
}

// ==============================================================================
// 3. Get Application Timeline/History
// ==============================================================================
export class GetApplicationTimelineDto {
  @IsUUID()
  applicationId: string;
}
