import {
  Notification as PrismaNotification,
  NotificationTemplate as PrismaTemplate,
} from '@shamba/database';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of Entities
// ============================================================================
// These entities are clean representations of our data models, used for
// serializing API responses. All business logic has been REMOVED and now
// lives in the service layer (e.g., NotificationsService, TemplatesService).
// ============================================================================

export class NotificationTemplateEntity implements PrismaTemplate {
  id!: string;
  name!: string;
  channel!: PrismaTemplate['channel'];
  subject!: string | null;
  body!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<PrismaTemplate>) {
    Object.assign(this, partial);
  }
}

export class NotificationEntity implements PrismaNotification {
  id!: string;
  channel!: PrismaNotification['channel'];
  status!: PrismaNotification['status'];
  sentAt!: Date | null;
  failReason!: string | null;
  templateId!: string;
  recipientId!: string | null;
  createdAt!: Date;

  template?: NotificationTemplateEntity;

  constructor(partial: Partial<PrismaNotification & { template?: PrismaTemplate }>) {
    Object.assign(this, partial);
    if (partial.template) {
      this.template = new NotificationTemplateEntity(partial.template);
    }
  }
}