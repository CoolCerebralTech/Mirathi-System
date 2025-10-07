import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus, NotificationChannel } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of this File
// ============================================================================
// While the `notifications-service` is primarily event-driven, it will expose
// endpoints for users to retrieve their notification history. This file defines
// the contracts for those read-only operations.
// ============================================================================

// ============================================================================
// REQUEST DTOs (Input Validation)
// ============================================================================

/**
 * Defines the query parameters for filtering a list of notifications.
 */
export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter notifications by their delivery status.',
    enum: NotificationStatus,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    description: 'Filter notifications by the channel they were sent through.',
    enum: NotificationChannel,
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;
}

// ============================================================================
// RESPONSE DTOs (API Output)
// ============================================================================

/**
 * Defines the shape of a single Notification object returned by the API.
 */
export class NotificationResponseDto extends BaseResponseDto {
  @ApiProperty({
        enum: NotificationChannel,
        description: 'The channel through which the notification was sent (e.g., EMAIL, SMS).',
    })
    channel: NotificationChannel = "EMAIL";

  @ApiProperty({
        enum: NotificationStatus,
        description: 'The delivery status of the notification.',
    })
    status: NotificationStatus = "PENDING";

  @ApiPropertyOptional({
    description: 'The timestamp when the notification was successfully sent.',
    nullable: true,
  })
  sentAt?: Date | null;

  @ApiPropertyOptional({
    description: 'The reason for a delivery failure, if any.',
    nullable: true,
  })
  failReason?: string | null;

  @ApiProperty({
        description: 'The ID of the user who received the notification.',
    })
    recipientId!: string;

  @ApiProperty({
        description: 'The name of the template used for this notification (e.g., "WELCOME_EMAIL").',
    })
    templateName!: string; // We expose the name, not the full template body
}