// src/succession-automation/src/application/roadmap/services/task-automation/proof-validator.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { ProofType } from '../../../../domain/entities/roadmap-task.entity';
import { Result } from '../../../common/result';

/**
 * Service responsible for verifying task completion proofs.
 *
 * CURRENT STATUS: MOCK MODE
 * External integrations (Document Service, Payment Gateway) are simulated
 * to allow independent development of the Roadmap module.
 */
@Injectable()
export class ProofValidatorService {
  private readonly logger = new Logger(ProofValidatorService.name);

  constructor() {
    // In production, we would inject:
    // - IDocumentService
    // - IPaymentGateway
    // - ISignatureProvider
  }

  /**
   * Validates the provided proof against the requirements.
   * This is an async operation to simulate external I/O.
   */
  public async validateProof(proofType: ProofType, proofPayload: any): Promise<Result<boolean>> {
    try {
      this.logger.debug(`Validating proof type: ${proofType}`);

      switch (proofType) {
        case ProofType.DOCUMENT_UPLOAD:
          return this.validateDocumentUpload(proofPayload);

        case ProofType.COURT_RECEIPT:
        case ProofType.BANK_SLIP:
          return this.validatePayment(proofPayload);

        case ProofType.DIGITAL_SIGNATURE:
          return this.validateSignature(proofPayload);

        case ProofType.SMS_VERIFICATION:
        case ProofType.EMAIL_VERIFICATION:
          return this.validateCommunication(proofPayload);

        default:
          // For other types like WITNESS_SIGNATURE, we might just accept them if payload exists
          return Result.ok(true);
      }
    } catch (error) {
      this.logger.error(`Proof validation error`, error);
      return Result.fail(error instanceof Error ? error : new Error('Proof validation error'));
    }
  }

  // ==================== MOCK VALIDATORS ====================

  private async validateDocumentUpload(payload: { documentId: string }): Promise<Result<boolean>> {
    if (!payload || !payload.documentId) {
      return Result.fail('Document ID is missing from payload');
    }

    // SIMULATION: Simulate checking a Document Service
    await this.simulateLatency();

    // Mock Rule: Fail if documentId contains "INVALID"
    if (payload.documentId.includes('INVALID')) {
      return Result.fail('Document validation failed: File corrupted or missing.');
    }

    this.logger.log(`[Mock] Document ${payload.documentId} verified successfully.`);
    return Result.ok(true);
  }

  private async validatePayment(payload: {
    transactionReference: string;
  }): Promise<Result<boolean>> {
    if (!payload || !payload.transactionReference) {
      return Result.fail('Transaction reference missing');
    }

    // SIMULATION: Simulate calling M-PESA / Stripe API
    await this.simulateLatency();

    // Mock Rule: Validate format (e.g., 10 alphanumeric chars for M-PESA)
    const transactionRegex = /^[A-Z0-9]{10}$/;
    if (!transactionRegex.test(payload.transactionReference)) {
      return Result.fail(
        'Invalid transaction reference format (Expected 10 alphanumeric characters).',
      );
    }

    this.logger.log(`[Mock] Payment ${payload.transactionReference} verified successfully.`);
    return Result.ok(true);
  }

  private async validateSignature(payload: { signatureToken: string }): Promise<Result<boolean>> {
    if (!payload || !payload.signatureToken) {
      return Result.fail('Signature token missing');
    }

    // SIMULATION: Simulate checking DocuSign / Internal Signature Service
    await this.simulateLatency();

    this.logger.log(`[Mock] Signature token ${payload.signatureToken} verified.`);
    return Result.ok(true);
  }

  private async validateCommunication(payload: {
    verificationCode: string;
  }): Promise<Result<boolean>> {
    if (!payload || !payload.verificationCode) {
      return Result.fail('Verification code missing');
    }

    // SIMULATION: Simulate checking Redis/DB for code match
    await this.simulateLatency();

    if (payload.verificationCode !== '123456') {
      // Mock "Correct" code
      // In mock mode, we usually allow anything except explicit failures,
      // but strictly speaking code matching is binary.
      // We'll return true for now to unblock devs unless they send 'FAIL'.
      if (payload.verificationCode === 'FAIL') {
        return Result.fail('Invalid verification code');
      }
    }

    return Result.ok(true);
  }

  /**
   * Helper to simulate network latency (Fixes "async has no await" error)
   */
  private async simulateLatency(): Promise<void> {
    const ms = Math.floor(Math.random() * 400) + 100; // 100-500ms delay
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
