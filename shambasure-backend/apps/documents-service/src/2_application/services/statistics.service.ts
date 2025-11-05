import { Injectable, Logger } from '@nestjs/common';

import { IDocumentRepository } from '../../3_domain/interfaces/document.repository.interface';
import { StatisticsMapper } from '../mappers/statistics.mapper';
import { DocumentStatsResponseDto } from '../dtos';

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    private readonly documentRepository: IDocumentRepository,
    private readonly statisticsMapper: StatisticsMapper,
  ) {}

  async getSystemStats(): Promise<DocumentStatsResponseDto> {
    try {
      const stats = await this.documentRepository.getStats();
      return this.statisticsMapper.toDocumentStatsResponseDto(stats);
    } catch (error) {
      this.logger.error(`Failed to get system stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<DocumentStatsResponseDto> {
    try {
      const stats = await this.documentRepository.getStats({ uploaderId: userId });
      return this.statisticsMapper.toDocumentStatsResponseDto(stats);
    } catch (error) {
      this.logger.error(`Failed to get user stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStorageStats() {
    try {
      const storageStats = await this.documentRepository.getStorageStats();
      return this.statisticsMapper.toStorageStatsResponseDto(storageStats);
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVerificationMetrics(timeRange: { start: Date; end: Date }) {
    try {
      const metrics = await this.documentRepository.getVerificationMetrics(timeRange);
      return this.statisticsMapper.toVerificationMetricsResponseDto(metrics);
    } catch (error) {
      this.logger.error(`Failed to get verification metrics: ${error.message}`, error.stack);
      throw error;
    }
  }
}
