// ============================================================================
// templates.repository.ts - Template Data Access Layer
// ============================================================================

import { 
  Injectable as TemplateInjectable, 
  NotFoundException 
} from '@nestjs/common';
import { 
  Prisma as TemplatePrisma, 
  PrismaService as TemplatePrismaService, 
  NotificationTemplate,
  NotificationChannel as TemplateNotificationChannel,
} from '@shamba/database';
import { PaginationQueryDto as TemplatePaginationQueryDto } from '@shamba/common';

/**
 * TemplatesRepository - Pure data access for notification templates
 * 
 * RESPONSIBILITIES:
 * - CRUD operations for templates
 * - Query templates by name or channel
 */
@TemplateInjectable()
export class TemplatesRepository {
  constructor(private readonly prisma: TemplatePrismaService) {}

  // ========================================================================
  // CREATE OPERATIONS
  // ========================================================================

  async create(data: TemplatePrisma.NotificationTemplateCreateInput): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.create({ data });
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  async findById(id: string): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findUnique({ where: { name } });
  }

  async findOneOrFail(
    where: TemplatePrisma.NotificationTemplateWhereUniqueInput
  ): Promise<NotificationTemplate> {
    const template = await this.prisma.notificationTemplate.findUnique({ where });
    if (!template) {
      const identifier = where.id || where.name || 'unknown';
      throw new NotFoundException(`Template '${identifier}' not found`);
    }
    return template;
  }

  async findMany(
    where: TemplatePrisma.NotificationTemplateWhereInput,
    pagination: TemplatePaginationQueryDto,
  ): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
    const skip = (page - 1) * limit;

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return { templates, total };
  }

  async findByChannel(
    channel: TemplateNotificationChannel,
    pagination: TemplatePaginationQueryDto,
  ): Promise<{ templates: NotificationTemplate[]; total: number }> {
    return this.findMany({ channel }, pagination);
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.prisma.notificationTemplate.count({ where: { name } });
    return count > 0;
  }

  // ========================================================================
  // UPDATE OPERATIONS
  // ========================================================================

  async update(
    id: string, 
    data: TemplatePrisma.NotificationTemplateUpdateInput
  ): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.update({
      where: { id },
      data,
    });
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  async delete(id: string): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }
}