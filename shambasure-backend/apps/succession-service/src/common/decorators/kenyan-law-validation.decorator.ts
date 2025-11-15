import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { KenyanLawValidationGuard } from '../guards/legal-compliance.guard';

export const KENYAN_LAW_METADATA = 'kenyan-law-validation';

export interface KenyanLawValidationOptions {
  section?: string; // Law of Succession Act section
  requirement?: string;
  minWitnesses?: number;
  maxAssets?: number;
  dependantProvision?: boolean;
}

export function KenyanLawValidation(options: KenyanLawValidationOptions = {}) {
  return applyDecorators(
    SetMetadata(KENYAN_LAW_METADATA, {
      minWitnesses: 2,
      dependantProvision: true,
      ...options,
    }),
    UseGuards(KenyanLawValidationGuard),
  );
}

// Specific decorators for common Kenyan law requirements
export function WillFormalities() {
  return KenyanLawValidation({
    section: '11',
    requirement: 'Will must be in writing, signed by testator, attested by 2+ witnesses',
    minWitnesses: 2,
  });
}

export function DependantProvision() {
  return KenyanLawValidation({
    section: '26-29',
    requirement: 'Reasonable provision for dependants (spouse/children)',
    dependantProvision: true,
  });
}

export function TestatorCapacity() {
  return KenyanLawValidation({
    section: '7',
    requirement: 'Testator must be of sound mind and above 18 years',
  });
}
