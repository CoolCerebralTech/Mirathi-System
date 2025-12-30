// src/application/guardianship/services/guardianship-audit.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { ICommand } from '../../common/interfaces/use-case.interface';

@Injectable()
export class GuardianshipAuditService {
  private readonly logger = new Logger('LegalAuditTrail');

  public logCommandExecution(
    command: ICommand,
    status: 'SUCCESS' | 'FAILURE',
    metadata?: any,
  ): void {
    const entry = {
      timestamp: new Date(),
      commandId: command.commandId,
      userId: command.userId,
      type: command.constructor.name,
      status,
      metadata,
      // In a real system, you might hash this entry for immutability
      hash: 'SHA256_PLACEHOLDER',
    };

    // Store in Audit Table / ElasticSearch
    this.logger.log(JSON.stringify(entry));
  }
}
