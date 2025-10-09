// ============================================================================
// notification.entity.ts - Notification Entities
// ============================================================================

import {
  Notification as PrismaNotification,
  NotificationTemplate as PrismaTemplate,
  NotificationChannel,
  NotificationStatus,
} from '@shamba/database';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * NotificationTemplateEntity - Serializable notification template
 * Represents reusable message templates for emails and SMS
 */
@Exclude()
export class NotificationTemplateEntity implements PrismaTemplate {
  @Expose()
  @ApiProperty({
    example: 'clx123456789',
    description: 'Unique template identifier',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    example: 'welcome-email',
    description: 'Template name (unique identifier)',
  })
  name!: string;

  @Expose()
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Communication channel',
  })
  channel!: NotificationChannel;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'Welcome to Shamba Sure!',
    description: 'Email subject line (null for SMS)',
  })
  subject!: string | null;

  @Expose()
  @ApiProperty({
    example: 'Hello {{firstName}}, welcome to Shamba Sure!',
    description: 'Template body with placeholder variables',
  })
  body!: string;

  @Expose()
  @ApiProperty({
    example: '2025-01-15T10:30:00Z',
    description: 'Template creation timestamp',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    example: '2025-01-20T14:45:00Z',
    description: 'Last update timestamp',
  })
  updatedAt!: Date;

  constructor(partial: Partial<PrismaTemplate>) {
    Object.assign(this, partial);
  }
}

/**
 * NotificationEntity - Serializable notification for API responses
 * Represents a sent or pending notification
 */
@Exclude()
export class NotificationEntity implements PrismaNotification {
  @Expose()
  @ApiProperty({
    example: 'clx789012345',
    description: 'Unique notification identifier',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Communication channel',
  })
  channel!: NotificationChannel;

  @Expose()
  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.SENT,
    description: 'Notification delivery status',
  })
  status!: NotificationStatus;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    example: '2025-01-15T10:32:00Z',
    description: 'Timestamp when notification was sent (null if pending/failed)',
  })
  sentAt!: Date | null;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'SMTP connection timeout',
    description: 'Error message if delivery failed',
  })
  failReason!: string | null;

  @Expose()
  @ApiProperty({
    example: 'clx123456789',
    description: 'Template ID used for this notification',
  })
  templateId!: string;

  @Expose()
  @ApiProperty({
    required: false,
    nullable: true,
    example: 'clx456789012',
    description: 'Recipient user ID (null if deleted)',
  })
  recipientId!: string | null;

  @Expose()
  @ApiProperty({
    example: '2025-01-15T10:30:00Z',
    description: 'Notification creation timestamp',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    type: () => NotificationTemplateEntity,
    required: false,
    description: 'Template details (included when requested)',
  })
  @Type(() => NotificationTemplateEntity)
  template?: NotificationTemplateEntity;

  constructor(partial: Partial<PrismaNotification & { template?: PrismaTemplate }>) {
    Object.assign(this, partial);
    if (partial.template) {
      this.template = new NotificationTemplateEntity(partial.template);
    }
  }
}
