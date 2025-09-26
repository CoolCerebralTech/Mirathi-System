import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shamba/database';
import { SecurityEventEntity } from '../entities/audit-log.entity';

@Injectable()
export class SecurityEventRepository {
  constructor(private prisma: PrismaService) {}

  async create(eventData: {
    type: 'suspicious_login' | 'multiple_failures' | 'data_breach_attempt' | 'unauthorized_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedUsers: string[];
    relatedLogs: string[];
    investigationNotes?: string;
  }): Promise<SecurityEventEntity> {
    const securityEvent = await this.prisma.securityEvent.create({
      data: {
        ...eventData,
        status: 'open',
        detectedAt: new Date(),
      },
    });

    return new SecurityEventEntity(securityEvent);
  }

  async findById(id: string): Promise<SecurityEventEntity> {
    const event = await this.prisma.securityEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Security event with ID ${id} not found`);
    }

    return new SecurityEventEntity(event);
  }

  async findAllOpenEvents(): Promise<SecurityEventEntity[]> {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        status: {
          in: ['open', 'investigating'],
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return events.map(event => new SecurityEventEntity(event));
  }

  async updateStatus(id: string, status: 'open' | 'investigating' | 'resolved' | 'false_positive', resolution?: string): Promise<SecurityEventEntity> {
    const updateData: any = { status };
    
    if (status === 'resolved' || status === 'false_positive') {
      updateData.resolvedAt = new Date();
      if (resolution) {
        updateData.resolution = resolution;
      }
    }

    const event = await this.prisma.securityEvent.update({
      where: { id },
      data: updateData,
    });

    return new SecurityEventEntity(event);
  }

  async addInvestigationNotes(id: string, notes: string): Promise<SecurityEventEntity> {
    const event = await this.prisma.securityEvent.update({
      where: { id },
      data: {
        investigationNotes: notes,
      },
    });

    return new SecurityEventEntity(event);
  }

  async getEventsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', days: number = 30): Promise<SecurityEventEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.securityEvent.findMany({
      where: {
        severity,
        detectedAt: {
          gte: startDate,
        },
      },
      orderBy: { detectedAt: 'desc' },
    });

    return events.map(event => new SecurityEventEntity(event));
  }

  async getStatistics(days: number = 30): Promise<{
    totalEvents: number;
    openEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    averageResolutionTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.securityEvent.findMany({
      where: {
        detectedAt: {
          gte: startDate,
        },
      },
    });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      if (event.resolvedAt) {
        const resolutionTime = event.resolvedAt.getTime() - event.detectedAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    const openEvents = events.filter(event => 
      event.status === 'open' || event.status === 'investigating'
    ).length;

    return {
      totalEvents: events.length,
      openEvents,
      eventsByType,
      eventsBySeverity,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
    };
  }
}