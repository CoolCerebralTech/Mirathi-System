import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { NotificationTemplateEntity } from '../entities/notification.entity';
import { NotificationChannel } from '@shamba/common';

@Injectable()
export class TemplateRepository {
  constructor(private prisma: PrismaService) {}

  async create(templateData: {
    name: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    variables: string[];
    isActive?: boolean;
  }): Promise<NotificationTemplateEntity> {
    // Check if template with same name already exists
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { name: templateData.name },
    });

    if (existing) {
      throw new ConflictException(`Template with name '${templateData.name}' already exists`);
    }

    const template = await this.prisma.notificationTemplate.create({
      data: {
        name: templateData.name,
        channel: templateData.channel,
        subject: templateData.subject,
        body: templateData.body,
        variables: templateData.variables,
        isActive: templateData.isActive !== false, // Default to true
      },
      include: {
        notifications: {
          take: 10, // Include recent notifications
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return new NotificationTemplateEntity(template);
  }

  async findById(id: string): Promise<NotificationTemplateEntity> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
      include: {
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return new NotificationTemplateEntity(template);
  }

  async findByName(name: string): Promise<NotificationTemplateEntity | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { name },
      include: {
        notifications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return template ? new NotificationTemplateEntity(template) : null;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    channel?: NotificationChannel;
    isActive?: boolean;
  }): Promise<{ templates: NotificationTemplateEntity[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.channel) {
      where.channel = options.channel;
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        include: {
          notifications: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return {
      templates: templates.map(t => new NotificationTemplateEntity(t)),
      total,
    };
  }

  async update(
    id: string, 
    updateData: {
      name?: string;
      subject?: string;
      body?: string;
      variables?: string[];
      isActive?: boolean;
    }
  ): Promise<NotificationTemplateEntity> {
    await this.findById(id); // Verify exists

    // Check name uniqueness if name is being updated
    if (updateData.name) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: {
          name: updateData.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(`Template with name '${updateData.name}' already exists`);
      }
    }

    const template = await this.prisma.notificationTemplate.update({
      where: { id },
      data: updateData,
      include: {
        notifications: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return new NotificationTemplateEntity(template);
  }

  async delete(id: string): Promise<void> {
    const template = await this.findById(id);

    // Check if template can be deleted (no associated notifications)
    if (!template.canBeDeleted()) {
      throw new ConflictException('Cannot delete template with associated notifications');
    }

    await this.prisma.notificationTemplate.delete({
      where: { id },
    });
  }

  async activateTemplate(id: string): Promise<NotificationTemplateEntity> {
    return this.update(id, { isActive: true });
  }

  async deactivateTemplate(id: string): Promise<NotificationTemplateEntity> {
    return this.update(id, { isActive: false });
  }

  async getTemplateStats(id: string): Promise<{
    totalUsage: number;
    successRate: number;
    lastUsed?: Date;
    channel: NotificationChannel;
  }> {
    const template = await this.findById(id);
    const stats = template.getUsageStats();

    // Get last used date
    const lastNotification = await this.prisma.notification.findFirst({
      where: { templateId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return {
      totalUsage: stats.totalSent,
      successRate: stats.successRate,
      lastUsed: lastNotification?.createdAt,
      channel: template.channel,
    };
  }

  async searchTemplates(query: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ templates: NotificationTemplateEntity[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const templates = await this.prisma.notificationTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      include: {
        notifications: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const total = await this.prisma.notificationTemplate.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return {
      templates: templates.map(t => new NotificationTemplateEntity(t)),
      total,
    };
  }
}