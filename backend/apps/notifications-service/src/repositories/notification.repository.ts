import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { NotificationEntity, NotificationTemplateEntity } from '../entities/notification.entity';
import { NotificationChannel, NotificationStatus } from '@shamba/common';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(notificationData: {
    channel: NotificationChannel;
    recipientId: string;
    templateId: string;
    subject?: string;
    body: string;
    metadata?: Record<string, any>;
    maxRetries?: number;
  }): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.create({
      data: {
        channel: notificationData.channel,
        recipientId: notificationData.recipientId,
        templateId: notificationData.templateId,
        subject: notificationData.subject,
        body: notificationData.body,
        status: NotificationStatus.PENDING,
        metadata: notificationData.metadata,
        maxRetries: notificationData.maxRetries || 3,
        retryCount: 0,
      },
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return new NotificationEntity(notification);
  }

  async findById(id: string): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return new NotificationEntity(notification);
  }

  async findByRecipient(recipientId: string, options?: {
    page?: number;
    limit?: number;
    channel?: NotificationChannel;
    status?: NotificationStatus;
  }): Promise<{ notifications: NotificationEntity[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientId };

    if (options?.channel) {
      where.channel = options.channel;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          template: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(n => new NotificationEntity(n)),
      total,
    };
  }

  async updateStatus(
    id: string, 
    status: NotificationStatus, 
    options?: { failReason?: string; sentAt?: Date }
  ): Promise<NotificationEntity> {
    await this.findById(id); // Verify exists

    const notification = await this.prisma.notification.update({
      where: { id },
      data: {
        status,
        failReason: options?.failReason,
        sentAt: options?.sentAt,
        retryCount: status === NotificationStatus.FAILED 
          ? { increment: 1 }
          : undefined,
      },
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return new NotificationEntity(notification);
  }

  async getPendingNotifications(limit: number = 100): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours only
        },
      },
      take: limit,
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return notifications.map(n => new NotificationEntity(n));
  }

  async getFailedNotifications(limit: number = 50): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: { lt: 3 }, // Only those with retries left
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours only
        },
      },
      take: limit,
      include: {
        template: true,
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return notifications.map(n => new NotificationEntity(n));
  }

  async getStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byChannel: Record<string, number>;
    successRate: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const notifications = await this.prisma.notification.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    });

    const total = notifications.length;
    const sent = notifications.filter(n => n.status === NotificationStatus.SENT).length;
    const failed = notifications.filter(n => n.status === NotificationStatus.FAILED).length;
    const pending = notifications.filter(n => n.status === NotificationStatus.PENDING).length;

    const byChannel: Record<string, number> = {};
    notifications.forEach(n => {
      byChannel[n.channel] = (byChannel[n.channel] || 0) + 1;
    });

    const successRate = total > 0 ? (sent / total) * 100 : 0;

    return {
      total,
      sent,
      failed,
      pending,
      byChannel,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  async cleanupExpiredNotifications(): Promise<number> {
    const expirationDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: expirationDate,
        },
        status: {
          in: [NotificationStatus.SENT, NotificationStatus.FAILED],
        },
      },
    });

    return result.count;
  }
}