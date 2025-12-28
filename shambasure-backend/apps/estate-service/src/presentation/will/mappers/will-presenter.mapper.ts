import { ComplianceReportVm } from '../../../application/will/queries/view-models/compliance-report.vm';
import { ExecutorDashboardItemVm } from '../../../application/will/queries/view-models/executor-dashboard.vm';
import { WillDetailVm } from '../../../application/will/queries/view-models/will-detail.vm';
import { WillSummaryVm } from '../../../application/will/queries/view-models/will-summary.vm';
import { PaginatedResult } from '../../../domain/interfaces/will.repository.interface';
import { ComplianceReportResponseDto } from '../dto/response/compliance-report.response.dto';
import { ExecutorAssignmentResponseDto } from '../dto/response/executor-assignment.response.dto';
import { PaginatedWillResponseDto } from '../dto/response/paginated-will.response.dto';
import { WillDetailResponseDto } from '../dto/response/will-detail.response.dto';
import { WillSummaryResponseDto } from '../dto/response/will-summary.response.dto';

/**
 * Will Presenter Mapper
 *
 * PURPOSE:
 * Decouples the Application Layer (View Models) from the Presentation Layer (API DTOs).
 * Transforms internal data structures into the public JSON contract defined by Swagger.
 */
export class WillPresenterMapper {
  /**
   * Maps detailed view model to response DTO
   */
  public static toDetailDto(vm: WillDetailVm): WillDetailResponseDto {
    const dto = new WillDetailResponseDto();

    dto.id = vm.id;
    dto.testatorId = vm.testatorId;
    dto.versionNumber = vm.versionNumber;
    dto.status = vm.status;
    dto.type = vm.type;
    dto.createdAt = vm.createdAt;
    dto.updatedAt = vm.updatedAt;
    dto.executionDate = vm.executionDate;
    dto.executionLocation = vm.executionLocation;
    dto.isRevoked = vm.isRevoked;

    if (vm.revocationDetails) {
      dto.revocationDetails = {
        method: vm.revocationDetails.method,
        reason: vm.revocationDetails.reason,
        date: vm.revocationDetails.date,
      };
    }

    dto.funeralWishes = vm.funeralWishes;
    dto.burialLocation = vm.burialLocation;
    dto.residuaryClause = vm.residuaryClause;

    if (vm.capacityDeclaration) {
      dto.capacityDeclaration = {
        status: vm.capacityDeclaration.status,
        date: vm.capacityDeclaration.date,
        riskLevel: vm.capacityDeclaration.riskLevel,
        isLegallySufficient: vm.capacityDeclaration.isLegallySufficient,
      };
    }

    dto.executors = vm.executors.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      priority: e.priority,
      isQualified: e.isQualified,
      status: e.status,
    }));

    dto.bequests = vm.bequests.map((b) => ({
      id: b.id,
      beneficiaryName: b.beneficiaryName,
      type: b.type,
      description: b.description,
      valueSummary: b.valueSummary,
      riskLevel: b.riskLevel,
    }));

    dto.witnesses = vm.witnesses.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      type: w.type,
      signedAt: w.signedAt,
    }));

    dto.codicils = vm.codicils.map((c) => ({
      id: c.id,
      title: c.title,
      date: c.date,
      type: c.type,
      isExecuted: c.isExecuted,
    }));

    dto.disinheritanceRecords = vm.disinheritanceRecords.map((d) => ({
      id: d.id,
      personName: d.personName,
      reasonCategory: d.reasonCategory,
      riskLevel: d.riskLevel,
      isActive: d.isActive,
    }));

    dto.isValid = vm.isValid;
    dto.validationErrors = vm.validationErrors;

    return dto;
  }

  /**
   * Maps summary view model to response DTO
   */
  public static toSummaryDto(vm: WillSummaryVm): WillSummaryResponseDto {
    const dto = new WillSummaryResponseDto();

    dto.id = vm.id;
    dto.testatorId = vm.testatorId;
    dto.status = vm.status;
    dto.type = vm.type;
    dto.createdAt = vm.createdAt;
    dto.isRevoked = vm.isRevoked;
    dto.hasCodicils = vm.hasCodicils;
    dto.hasDisinheritance = vm.hasDisinheritance;
    dto.executionDate = vm.executionDate;
    dto.isValid = vm.isValid;
    dto.validationErrorsCount = vm.validationErrorsCount;

    return dto;
  }

  /**
   * Maps paginated result to response DTO
   */
  public static toPaginatedDto(result: PaginatedResult<WillSummaryVm>): PaginatedWillResponseDto {
    const dto = new PaginatedWillResponseDto();

    dto.items = result.items.map((item) => this.toSummaryDto(item));
    dto.total = result.total;
    dto.page = result.page;
    dto.pageSize = result.pageSize;
    dto.totalPages = result.totalPages;
    dto.hasNext = result.hasNext;
    dto.hasPrevious = result.hasPrevious;

    return dto;
  }

  /**
   * Maps compliance report VM to response DTO
   */
  public static toComplianceReportDto(vm: ComplianceReportVm): ComplianceReportResponseDto {
    const dto = new ComplianceReportResponseDto();

    dto.willId = vm.willId;
    dto.generatedAt = vm.generatedAt;
    dto.overallStatus = vm.overallStatus;
    dto.riskScore = vm.riskScore;

    // Direct mapping as structures are identical by design,
    // but explicit assignment prevents future drift issues.
    dto.sectionAnalysis = {
      s5_capacity: vm.sectionAnalysis.s5_capacity,
      s11_execution: vm.sectionAnalysis.s11_execution,
      s26_dependants: vm.sectionAnalysis.s26_dependants,
      s83_executors: vm.sectionAnalysis.s83_executors,
    };

    dto.violations = vm.violations;
    dto.warnings = vm.warnings;
    dto.recommendations = vm.recommendations;

    return dto;
  }

  /**
   * Maps executor assignment VM to response DTO
   */
  public static toExecutorAssignmentDto(
    vm: ExecutorDashboardItemVm,
  ): ExecutorAssignmentResponseDto {
    const dto = new ExecutorAssignmentResponseDto();

    dto.willId = vm.willId;
    dto.testatorId = vm.testatorId;
    dto.willStatus = vm.willStatus;
    dto.myRole = vm.myRole;
    dto.myOrder = vm.myOrder;
    dto.appointmentDate = vm.appointmentDate;
    dto.consentStatus = vm.consentStatus;
    dto.isQualified = vm.isQualified;
    dto.disqualificationRisk = vm.disqualificationRisk;
    dto.compensationSummary = vm.compensationSummary;
    dto.actionRequired = vm.actionRequired;
    dto.actionLabel = vm.actionLabel;

    return dto;
  }
}
