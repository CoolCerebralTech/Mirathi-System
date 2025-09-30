import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, Notification, NotificationStatus } from '@shamba/database';
import { PaginationQueryDto } from '@shamba/common';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Repository
// ============================================================================
// This repository is a pure data access layer. All complex logic (stats
// calculation, business rules for retries) has been REMOVED and now lives
// in the `NotificationsService`.
// ============================================================================

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.NotificationUncheckedCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async findOne(where: Prisma.NotificationWhereUniqueInput): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where });
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
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }
  
  async findPending(limit: number): Promise<Notification[]> {
      return this.prisma.notification.findMany({
          where: { status: NotificationStatus.PENDING },
          take: limit,
          orderBy: { createdAt: 'asc' }
      });
  }

  async update(id: string, data: Prisma.NotificationUpdateInput): Promise<Notification> {
    return this.prisma.notification.update({ where: { id }, data });
  }
  
  async deleteOlderThan(date: Date): Promise<{ count: number }> {
      return this.prisma.notification.deleteMany({
          where: { 
              createdAt: { lt: date },
              status: { in: [NotificationStatus.SENT, NotificationStatus.FAILED] }
          }
      });
  }
}