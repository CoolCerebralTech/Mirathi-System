// application/guardianship/mappers/guardianship-command.mapper.ts
import { Injectable } from '@nestjs/common';

import { AppointGuardianRequest } from '../dto/request/appoint-guardian.request';
import { ApproveAnnualReportRequest } from '../dto/request/approve-annual-report.request';
import { ExtendGuardianshipRequest } from '../dto/request/extend-guardianship.request';
import { FileAnnualReportRequest } from '../dto/request/file-annual-report.request';
import { GrantPropertyPowersRequest } from '../dto/request/grant-property-powers.request';
import { PostBondRequest } from '../dto/request/post-bond.request';
import { RenewBondRequest } from '../dto/request/renew-bond.request';
import { TerminateGuardianshipRequest } from '../dto/request/terminate-guardianship.request';
import { UpdateAllowanceRequest } from '../dto/request/update-allowance.request';
import { UpdateRestrictionsRequest } from '../dto/request/update-restrictions.request';
import { UpdateSpecialInstructionsRequest } from '../dto/request/update-special-instructions.request';

// We'll create these command classes later
// For now, we'll define interfaces that the mapper will use

interface CommandParams {
  correlationId?: string;
  timestamp: Date;
}

export interface AppointGuardianCommandParams extends CommandParams {
  wardId: string;
  guardianId: string;
  type: string;
  appointmentDate: Date;
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;
  guardianIdNumber?: string;
  courtCaseNumber?: string;
  interimOrderId?: string;
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: Record<string, any>;
  specialInstructions?: string;
  bondRequired?: boolean;
  bondAmountKES?: number;
  annualAllowanceKES?: number;
}

export interface PostBondCommandParams extends CommandParams {
  guardianshipId: string;
  provider: string;
  policyNumber: string;
  expiryDate: Date;
}

export interface FileAnnualReportCommandParams extends CommandParams {
  guardianshipId: string;
  reportDate: Date;
  summary: string;
  metadata?: Record<string, any>;
  approvedBy?: string;
}

export interface TerminateGuardianshipCommandParams extends CommandParams {
  guardianshipId: string;
  reason: string;
  terminationDate: Date;
  courtOrderNumber?: string;
}

export interface GrantPropertyPowersCommandParams extends CommandParams {
  guardianshipId: string;
  courtOrderNumber?: string;
  restrictions?: Record<string, any>;
}

export interface UpdateAllowanceCommandParams extends CommandParams {
  guardianshipId: string;
  amount: number;
  approvedBy: string;
}

export interface ExtendGuardianshipCommandParams extends CommandParams {
  guardianshipId: string;
  newValidUntil: Date;
  courtOrderNumber?: string;
}

export interface RenewBondCommandParams extends CommandParams {
  guardianshipId: string;
  newExpiryDate: Date;
  provider?: string;
  policyNumber?: string;
}

export interface UpdateRestrictionsCommandParams extends CommandParams {
  guardianshipId: string;
  restrictions: Record<string, any>;
}

export interface UpdateSpecialInstructionsCommandParams extends CommandParams {
  guardianshipId: string;
  instructions: string;
}

export interface ApproveAnnualReportCommandParams extends CommandParams {
  guardianshipId: string;
  auditorId: string;
}

@Injectable()
export class GuardianshipCommandMapper {
  /**
   * Maps AppointGuardianRequest to command parameters
   */
  toAppointGuardianCommandParams(
    request: AppointGuardianRequest,
    correlationId?: string,
  ): AppointGuardianCommandParams {
    return {
      wardId: request.wardId,
      guardianId: request.guardianId,
      type: request.type,
      appointmentDate: request.appointmentDate,
      courtOrderNumber: request.courtOrderNumber,
      courtStation: request.courtStation,
      validUntil: request.validUntil,
      guardianIdNumber: request.guardianIdNumber,
      courtCaseNumber: request.courtCaseNumber,
      interimOrderId: request.interimOrderId,
      hasPropertyManagementPowers: request.hasPropertyManagementPowers,
      canConsentToMedical: request.canConsentToMedical,
      canConsentToMarriage: request.canConsentToMarriage,
      restrictions: request.restrictions,
      specialInstructions: request.specialInstructions,
      bondRequired: request.bondRequired,
      bondAmountKES: request.bondAmountKES,
      annualAllowanceKES: request.annualAllowanceKES,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps PostBondRequest to command parameters
   */
  toPostBondCommandParams(request: PostBondRequest, correlationId?: string): PostBondCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      provider: request.provider,
      policyNumber: request.policyNumber,
      expiryDate: request.expiryDate,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps FileAnnualReportRequest to command parameters
   */
  toFileAnnualReportCommandParams(
    request: FileAnnualReportRequest,
    correlationId?: string,
  ): FileAnnualReportCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      reportDate: request.reportDate,
      summary: request.summary,
      metadata: request.metadata,
      approvedBy: request.approvedBy,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps TerminateGuardianshipRequest to command parameters
   */
  toTerminateGuardianshipCommandParams(
    request: TerminateGuardianshipRequest,
    correlationId?: string,
  ): TerminateGuardianshipCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      reason: request.reason,
      terminationDate: request.terminationDate,
      courtOrderNumber: request.courtOrderNumber,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps GrantPropertyPowersRequest to command parameters
   */
  toGrantPropertyPowersCommandParams(
    request: GrantPropertyPowersRequest,
    correlationId?: string,
  ): GrantPropertyPowersCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      courtOrderNumber: request.courtOrderNumber,
      restrictions: request.restrictions,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps UpdateAllowanceRequest to command parameters
   */
  toUpdateAllowanceCommandParams(
    request: UpdateAllowanceRequest,
    correlationId?: string,
  ): UpdateAllowanceCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      amount: request.amount,
      approvedBy: request.approvedBy,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps ExtendGuardianshipRequest to command parameters
   */
  toExtendGuardianshipCommandParams(
    request: ExtendGuardianshipRequest,
    correlationId?: string,
  ): ExtendGuardianshipCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      newValidUntil: request.newValidUntil,
      courtOrderNumber: request.courtOrderNumber,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps RenewBondRequest to command parameters
   */
  toRenewBondCommandParams(
    request: RenewBondRequest,
    correlationId?: string,
  ): RenewBondCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      newExpiryDate: request.newExpiryDate,
      provider: request.provider,
      policyNumber: request.policyNumber,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps UpdateRestrictionsRequest to command parameters
   */
  toUpdateRestrictionsCommandParams(
    request: UpdateRestrictionsRequest,
    correlationId?: string,
  ): UpdateRestrictionsCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      restrictions: request.restrictions,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps UpdateSpecialInstructionsRequest to command parameters
   */
  toUpdateSpecialInstructionsCommandParams(
    request: UpdateSpecialInstructionsRequest,
    correlationId?: string,
  ): UpdateSpecialInstructionsCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      instructions: request.instructions,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps ApproveAnnualReportRequest to command parameters
   */
  toApproveAnnualReportCommandParams(
    request: ApproveAnnualReportRequest,
    correlationId?: string,
  ): ApproveAnnualReportCommandParams {
    return {
      guardianshipId: request.guardianshipId,
      auditorId: request.auditorId,
      correlationId,
      timestamp: new Date(),
    };
  }
}
