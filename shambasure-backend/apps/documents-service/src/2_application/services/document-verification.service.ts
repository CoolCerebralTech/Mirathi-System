import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { IDocumentVerificationAttemptRepository } from '../../3_domain/interfaces/document-verification-attempt.repository.interface';
import { DocumentVerificationAttemptMapper } from '../mappers/document-verification-attempt.mapper';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import { DocumentId, UserId } from '../../3_domain/value-objects';
import { DocumentVerificationAttemptResponseDto } from '../dtos';

@Injectable()
export class DocumentVerificationService {
  private readonly logger = new Logger(DocumentVerificationService.name);

  constructor(
    private readonly verificationAttemptRepository: IDocumentVerificationAttemptRepository,
    private readonly verificationAttemptMapper: DocumentVerificationAttemptMapper,
  ) {}

  async getVerificationHistory(
    documentId: string,
  ): Promise<DocumentVerificationAttemptResponseDto[]> {
    try {
      const attempts = await this.verificationAttemptRepository.findByDocumentId(
        new DocumentId(documentId),
        { limit: 50, orderBy: 'createdAt' },
      );

      return this.verificationAttemptMapper.toResponseDtoList(attempts);
    } catch (error) {
      this.logger.error(`Failed to get verification history: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getVerifierStats(verifierId: string, timeRange?: { start: Date; end: Date }) {
    try {
      return await this.verificationAttemptRepository.getVerifierStats(
        new UserId(verifierId),
        timeRange,
      );
    } catch (error) {
      this.logger.error(`Failed to get verifier stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLatestVerificationAttempt(
    documentId: string,
  ): Promise<DocumentVerificationAttemptResponseDto | null> {
    try {
      const attempt = await this.verificationAttemptRepository.findLatestByDocumentId(
        new DocumentId(documentId),
      );

      if (!attempt) {
        return null;
      }

      return this.verificationAttemptMapper.toResponseDto(attempt);
    } catch (error) {
      this.logger.error(`Failed to get latest verification attempt: ${error.message}`, error.stack);
      throw error;
    }
  }
}
