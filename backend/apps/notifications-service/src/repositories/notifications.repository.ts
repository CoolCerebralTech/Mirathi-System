// ============================================================================
// notifications.repository.ts - Notification Data Access Layer
// ============================================================================

import { Injectable } from '@nestjs/common';
import { 
  Prisma, 
  PrismaService, 
  Notification, 
  NotificationStatus as RepoNotificationStatus,
  NotificationChannel as RepoNotificationChannel,
} from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

/**
 * NotificationsRepository - Pure data access for notifications
 * 
 * RESPONSIBILITIES:
 * - CRUD operations for notifications
 * - Query pending notifications for processing
 * - Update notification status
 * - Cleanup old notifications
 */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async createBatch(data: Prisma.NotificationUncheckedCreateInput[]): Promise<number> {
    const result = await this.prisma.notification.createMany({ data });
    return result.count;
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async findByIdWithTemplate(id: string): Promise<(Notification & { template: any }) | null> {
    return this.prisma.notification.findUnique({
      where: { id },
      include: { template: true },
    });
  }

  async findMany(
    where: Prisma.NotificationWhereInput,
    pagination: PaginationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { template: true },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async findPending(limit: number = 100): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { status: RepoNotificationStatus.PENDING },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { template: true },
    });
  }

  async findByRecipient(
    recipientId: string,
    pagination: PaginationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.findMany({ recipientId }, pagination);
  }

  async findByStatus(
    status: RepoNotificationStatus,
    pagination: PaginationQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.findMany({ status }, pagination);
  }

  async findFailed(limit: number = 100): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { status: RepoNotificationStatus.FAILED },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(id: string, data: Prisma.NotificationUpdateInput): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data,
    });
  }

  async markAsSent(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: RepoNotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, failReason: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: RepoNotificationStatus.FAILED,
        failReason,
      },
    });
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async deleteOlderThan(date: Date): Promise<{ count: number }> {
    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: date },
        status: { 
          in: [RepoNotificationStatus.SENT, RepoNotificationStatus.FAILED] 
        },
      },
    });
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStatsByRecipient(recipientId: string) {
    return this.prisma.notification.groupBy({
      by: ['status', 'channel'],
      where: { recipientId },
      _count: {
        id: true,
      },
    });
  }

  async getGlobalStats() {
    return this.prisma.notification.groupBy({
      by: ['status', 'channel'],
      _count: {
        id: true,
      },
    });
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.notification.count({
      where: { status: RepoNotificationStatus.PENDING },
    });
  }

  async getFailedCount(): Promise<number> {
    return this.prisma.notification.count({
      where: { status: RepoNotificationStatus.FAILED },
    });
  }
}

