import { Injectable } from '@nestjs/common';
import { DocumentVerificationAttempt } from '../../3_domain/models/document-verification-attempt.model';
import { DocumentVerificationAttemptResponseDto } from '../dtos/document-response.dto';
import {
  VerificationAttemptId,
  DocumentId,
  UserId,
  DocumentStatus,
  RejectionReason,
} from '../../3_domain/value-objects';

@Injectable()
export class DocumentVerificationAttemptMapper {
  toResponseDto(attempt: DocumentVerificationAttempt): DocumentVerificationAttemptResponseDto {
    return new DocumentVerificationAttemptResponseDto({
      id: attempt.id.value,
      documentId: attempt.documentId.value,
      verifierId: attempt.verifierId.value,
      verifierName: attempt.verifierName,
      status: attempt.status.value,
      reason: attempt.reason?.value,
      metadata: attempt.metadata,
      createdAt: attempt.createdAt,
    });
  }

  toResponseDtoList(
    attempts: DocumentVerificationAttempt[],
  ): DocumentVerificationAttemptResponseDto[] {
    return attempts.map((attempt) => this.toResponseDto(attempt));
  }

  verifyDtoToCreateVerifiedParams(
    dto: any, // Using any to avoid circular dependency
    documentId: string,
    verifierId: string,
    verifierName: string,
  ) {
    return {
      id: new VerificationAttemptId(dto.id), // ID should be generated in service layer
      documentId: new DocumentId(documentId),
      verifierId: new UserId(verifierId),
      verifierName,
      metadata: dto.verificationMetadata,
    };
  }

  verifyDtoToCreateRejectedParams(
    dto: any, // Using any to avoid circular dependency
    documentId: string,
    verifierId: string,
    verifierName: string,
  ) {
    return {
      id: new VerificationAttemptId(dto.id), // ID should be generated in service layer
      documentId: new DocumentId(documentId),
      verifierId: new UserId(verifierId),
      verifierName,
      reason: dto.reason,
      metadata: dto.verificationMetadata,
    };
  }
}
