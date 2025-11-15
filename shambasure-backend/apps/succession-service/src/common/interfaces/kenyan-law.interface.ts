/**
 * Kenyan Law of Succession Act Compliance Interfaces
 */

// Legal Compliance Validation
export interface KenyanLawValidation {
  lawSection: string;
  requirement: string;
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
}

// Will Formalities (Section 11)
export interface WillFormalities {
  isInWriting: boolean;
  testatorSignature: boolean;
  witnessCount: number;
  witnessesPresent: boolean;
  attestationClause?: string;
  compliance: KenyanLawValidation;
}

// Testator Capacity (Section 7)
export interface TestatorCapacity {
  isOfAge: boolean;
  isSoundMind: boolean;
  understanding: boolean;
  freeWill: boolean;
  evidence?: string[];
  capacityAssessment?: CapacityAssessment;
}

export interface CapacityAssessment {
  assessedBy: string;
  assessmentDate: Date;
  result: 'CAPABLE' | 'INCAPABLE' | 'MARGINAL';
  notes?: string;
}

// Intestate Succession Distribution (Part V)
export interface IntestateDistribution {
  lawSection: string;
  spouseShare: DistributionShare;
  childrenShare: DistributionShare;
  otherHeirs: DistributionShare[];
  totalEstate: number;
  calculationMethod: string;
}

export interface DistributionShare {
  beneficiaryType: string;
  shareType: 'PERSONAL_EFFECTS' | 'LIFE_INTEREST' | 'ABSOLUTE_INTEREST';
  percentage: number;
  amount: number;
  conditions?: string[];
}

// Dependant Provision (Section 26-29)
export interface DependantProvision {
  dependants: Dependant[];
  reasonableProvision: number;
  actualProvision: number;
  isAdequate: boolean;
  courtOrderPossible: boolean;
}

export interface Dependant {
  id: string;
  relationship: string;
  age: number;
  isMinor: boolean;
  wasMaintained: boolean;
  provisionAmount: number;
  provisionType: string;
}

// Probate Process (Part VI)
export interface ProbateProcess {
  caseType: 'TESTATE' | 'INTESTATE';
  jurisdiction: string;
  applicationDate: Date;
  deceasedDate: Date;
  applicants: Applicant[];
  grantType: GrantType;
  status: ProbateStatus;
  hearings: CourtHearing[];
  documents: ProbateDocument[];
}

export interface Applicant {
  id: string;
  relationship: string;
  eligibility: 'PRIMARY' | 'SECONDARY' | 'ALTERNATE';
  applicationDate: Date;
}

export interface GrantType {
  type: 'PROBATE' | 'LETTERS_OF_ADMINISTRATION';
  withWill?: boolean;
  limited?: boolean;
}

export interface CourtHearing {
  date: Date;
  purpose: string;
  outcome?: string;
  nextHearing?: Date;
  documentsFiled: string[];
}

export interface ProbateDocument {
  type: string;
  name: string;
  filed: boolean;
  filingDate?: Date;
  required: boolean;
}

// Executor Duties (Part VII)
export interface ExecutorDuties {
  executorId: string;
  duties: ExecutorDuty[];
  timeline: ExecutorTimeline;
  compensation: ExecutorCompensation;
  status: ExecutorStatus;
}

export interface ExecutorDuty {
  duty: string;
  completed: boolean;
  dueDate?: Date;
  completedDate?: Date;
  notes?: string;
}

export interface ExecutorTimeline {
  appointmentDate: Date;
  acceptanceDate?: Date;
  startDate?: Date;
  expectedCompletion: Date;
  actualCompletion?: Date;
}

export interface ExecutorCompensation {
  percentage: number;
  amount: number;
  courtApproved: boolean;
  paymentDate?: Date;
}

// Dispute Resolution
export interface SuccessionDispute {
  id: string;
  grounds: DisputeGrounds[];
  disputant: Disputant;
  filingDate: Date;
  status: DisputeStatus;
  resolution?: DisputeResolution;
  hearings: DisputeHearing[];
}

export interface DisputeGrounds {
  type: string;
  description: string;
  evidence: string[];
  strength: 'WEAK' | 'MEDIUM' | 'STRONG';
}

export interface Disputant {
  id: string;
  relationship: string;
  legalRepresentation?: LegalRepresentation;
  contact: ContactInfo;
}

export interface LegalRepresentation {
  lawyerName: string;
  firm: string;
  contact: ContactInfo;
  barNumber: string;
}

export interface DisputeResolution {
  method: string;
  outcome: string;
  date: Date;
  binding: boolean;
}

export interface DisputeHearing {
  date: Date;
  court: string;
  judge: string;
  summary: string;
  orders: string[];
}

// Common Legal Interfaces
export interface ContactInfo {
  phone: string;
  email: string;
  address: PostalAddress;
}

export interface PostalAddress {
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
}

export interface LegalDocument {
  id: string;
  type: string;
  name: string;
  issueDate: Date;
  expiryDate?: Date;
  issuingAuthority: string;
  documentNumber: string;
  verified: boolean;
}

// Kenyan Court Interfaces
export interface KenyanCourt {
  name: string;
  jurisdiction: string;
  location: string;
  contact: ContactInfo;
  filingRequirements: string[];
  feeStructure: CourtFees;
}

export interface CourtFees {
  filingFee: number;
  adValoremFee: number;
  miscellaneousFees: CourtFeeItem[];
  total: number;
}

export interface CourtFeeItem {
  description: string;
  amount: number;
  mandatory: boolean;
}
