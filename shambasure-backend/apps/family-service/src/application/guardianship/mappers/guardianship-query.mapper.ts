// application/guardianship/mappers/guardianship-query.mapper.ts
import { Injectable } from '@nestjs/common';
import { GuardianType } from '@prisma/client';

// We'll create these query classes later
// For now, we'll define interfaces that the mapper will use

interface QueryParams {
  correlationId?: string;
  timestamp: Date;
}

export interface GetGuardianshipByIdQueryParams extends QueryParams {
  guardianshipId: string;
  includeCompliance?: boolean;
}

export interface ListGuardianshipsByWardQueryParams extends QueryParams {
  wardId: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface ListGuardianshipsByGuardianQueryParams extends QueryParams {
  guardianId: string;
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

export interface CheckS72ComplianceQueryParams extends QueryParams {
  guardianshipId?: string;
}

export interface CheckS73ComplianceQueryParams extends QueryParams {
  guardianshipId?: string;
}

export interface GetComplianceSummaryQueryParams extends QueryParams {
  filters?: {
    courtStation?: string;
    guardianType?: GuardianType;
    dateRange?: { start: Date; end: Date };
  };
}

export interface ListOverdueReportsQueryParams extends QueryParams {
  daysThreshold?: number;
}

export interface ListGuardianshipsRequiringBondQueryParams extends QueryParams {
  // No additional params needed for now
}

@Injectable()
export class GuardianshipQueryMapper {
  /**
   * Maps parameters to GetGuardianshipByIdQueryParams
   */
  toGetGuardianshipByIdQueryParams(
    id: string,
    includeCompliance?: boolean,
    correlationId?: string,
  ): GetGuardianshipByIdQueryParams {
    return {
      guardianshipId: id,
      includeCompliance,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to ListGuardianshipsByWardQueryParams
   */
  toListGuardianshipsByWardQueryParams(
    wardId: string,
    page?: number,
    limit?: number,
    includeInactive?: boolean,
    correlationId?: string,
  ): ListGuardianshipsByWardQueryParams {
    return {
      wardId,
      page: page || 1,
      limit: limit || 20,
      includeInactive: includeInactive || false,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to ListGuardianshipsByGuardianQueryParams
   */
  toListGuardianshipsByGuardianQueryParams(
    guardianId: string,
    page?: number,
    limit?: number,
    includeInactive?: boolean,
    correlationId?: string,
  ): ListGuardianshipsByGuardianQueryParams {
    return {
      guardianId,
      page: page || 1,
      limit: limit || 20,
      includeInactive: includeInactive || false,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to CheckS72ComplianceQueryParams
   */
  toCheckS72ComplianceQueryParams(
    guardianshipId?: string,
    correlationId?: string,
  ): CheckS72ComplianceQueryParams {
    return {
      guardianshipId,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to CheckS73ComplianceQueryParams
   */
  toCheckS73ComplianceQueryParams(
    guardianshipId?: string,
    correlationId?: string,
  ): CheckS73ComplianceQueryParams {
    return {
      guardianshipId,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to GetComplianceSummaryQueryParams
   */
  toGetComplianceSummaryQueryParams(
    filters?: {
      courtStation?: string;
      guardianType?: GuardianType;
      dateRange?: { start: Date; end: Date };
    },
    correlationId?: string,
  ): GetComplianceSummaryQueryParams {
    return {
      filters,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to ListOverdueReportsQueryParams
   */
  toListOverdueReportsQueryParams(
    daysThreshold?: number,
    correlationId?: string,
  ): ListOverdueReportsQueryParams {
    return {
      daysThreshold: daysThreshold || 30,
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps parameters to ListGuardianshipsRequiringBondQueryParams
   */
  toListGuardianshipsRequiringBondQueryParams(
    correlationId?: string,
  ): ListGuardianshipsRequiringBondQueryParams {
    return {
      correlationId,
      timestamp: new Date(),
    };
  }

  /**
   * Maps pagination parameters
   */
  toPaginationParams(page?: number, limit?: number) {
    return {
      skip: ((page || 1) - 1) * (limit || 20),
      take: limit || 20,
      page: page || 1,
      limit: limit || 20,
    };
  }

  /**
   * Maps validation context for property access
   */
  toValidationContext(
    guardianshipId: string,
    accessType: string,
    context?: Record<string, any>,
  ): {
    guardianshipId: string;
    accessType: string;
    context: Record<string, any>;
  } {
    return {
      guardianshipId,
      accessType,
      context: context || {},
    };
  }
}
