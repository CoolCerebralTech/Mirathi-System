import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { SuccessionComplianceInterceptor } from '../interceptors/kenyan-law-compliance.interceptor';

export const SUCCESSION_COMPLIANCE_METADATA = 'succession-compliance';

export interface SuccessionComplianceOptions {
  lawSection: string;
  complianceCheck: string;
  required?: boolean;
}

export function SuccessionCompliance(options: SuccessionComplianceOptions) {
  return applyDecorators(
    SetMetadata(SUCCESSION_COMPLIANCE_METADATA, options),
    UseInterceptors(SuccessionComplianceInterceptor),
  );
}

// Pre-defined compliance decorators for common Kenyan succession scenarios
export function IntestateSuccession() {
  return SuccessionCompliance({
    lawSection: '35-41',
    complianceCheck: 'intestate-distribution',
    required: true,
  });
}

export function ProbateProcess() {
  return SuccessionCompliance({
    lawSection: '51-66',
    complianceCheck: 'probate-requirements',
    required: true,
  });
}

export function DependantMaintenance() {
  return SuccessionCompliance({
    lawSection: '26-30',
    complianceCheck: 'dependant-provision',
    required: true,
  });
}

export function WillExecution() {
  return SuccessionCompliance({
    lawSection: '71-84',
    complianceCheck: 'will-execution',
    required: true,
  });
}
