/**
 * Probate Process and Court Case Interfaces
 */

// Probate Case Management
export interface ProbateCase {
  id: string;
  caseNumber: string;
  deceasedId: string;
  deceasedName: string;
  caseType: ProbateCaseType;
  jurisdiction: CourtJurisdiction;
  applicationDate: Date;
  deceasedDate: Date;
  applicants: ProbateApplicant[];
  estateValue: number;
  grantType: GrantType;
  status: ProbateStatus;
  hearings: CourtHearing[];
  documents: ProbateDocument[];
  executors: CaseExecutor[];
  disputes: CaseDispute[];
  timeline: ProbateTimeline;
  fees: CourtFees;
  metadata: ProbateMetadata;
}

export interface ProbateApplicant {
  id: string;
  applicantId: string;
  relationship: string;
  eligibility: ApplicantEligibility;
  contact: ContactInfo;
  application: ApplicantSubmission;
  status: ApplicantStatus;
}

export interface ApplicantEligibility {
  isEligible: boolean;
  priority: number;
  relationshipType: string;
  grounds: string[];
  limitations?: string[];
}

export interface ApplicantSubmission {
  applicationDate: Date;
  affidavit: Affidavit;
  supportingDocuments: DocumentReference[];
  verification: VerificationStatus;
}

export interface Affidavit {
  content: string;
  swornDate: Date;
  commissioner: string;
  location: string;
}

export interface CaseExecutor {
  executorId: string;
  nominationSource: 'WILL' | 'COURT' | 'FAMILY';
  appointmentDate: Date;
  powers: ExecutorPowers;
  limitations?: string[];
  status: ExecutorCaseStatus;
  duties: ExecutorCaseDuty[];
}

export interface ExecutorPowers {
  general: boolean;
  specific: string[];
  restricted: string[];
  requiresCourtApproval: string[];
}

export interface ExecutorCaseStatus {
  status: string;
  appointed: Date;
  accepted?: Date;
  declined?: Date;
  removed?: Date;
  removalReason?: string;
}

export interface ExecutorCaseDuty {
  duty: string;
  deadline: Date;
  completed: boolean;
  completedDate?: Date;
  notes?: string;
}

export interface CaseDispute {
  id: string;
  disputantId: string;
  grounds: DisputeGrounds[];
  filingDate: Date;
  status: DisputeCaseStatus;
  resolution?: DisputeResolution;
  hearings: DisputeHearing[];
  documents: DisputeDocument[];
}

export interface DisputeCaseStatus {
  status: string;
  filed: Date;
  underMediation?: Date;
  inCourt?: Date;
  resolved?: Date;
  appealed?: Date;
}

export interface DisputeDocument {
  type: string;
  name: string;
  filedDate: Date;
  served: boolean;
  servedDate?: Date;
}

// Court Hearing Management
export interface CourtHearing {
  id: string;
  caseId: string;
  hearingDate: Date;
  hearingType: HearingType;
  purpose: string;
  judge: string;
  court: string;
  room: string;
  attendees: HearingAttendee[];
  agenda: HearingAgendaItem[];
  outcomes: HearingOutcome[];
  orders: CourtOrder[];
  minutes: string;
  nextHearing?: Date;
  documents: HearingDocument[];
}

export interface HearingAttendee {
  id: string;
  name: string;
  role: string;
  representedBy?: string;
  present: boolean;
  representation: string;
}

export interface HearingAgendaItem {
  item: string;
  presenter: string;
  duration: number;
  documents: string[];
  completed: boolean;
}

export interface HearingOutcome {
  item: string;
  decision: string;
  reasons: string[];
  orders: string[];
}

export interface CourtOrder {
  type: string;
  content: string;
  effectiveDate: Date;
  complianceDeadline?: Date;
  served: boolean;
  servedDate?: Date;
}

export interface HearingDocument {
  type: string;
  name: string;
  filedBy: string;
  filedDate: Date;
  documentId: string;
}

// Grant Management
export interface Grant {
  id: string;
  caseId: string;
  grantType: GrantType;
  grantNumber: string;
  issueDate: Date;
  issuingCourt: string;
  issuingJudge: string;
  executors: GrantExecutor[];
  powers: GrantPowers;
  limitations: string[];
  conditions: string[];
  status: GrantStatus;
  validity: GrantValidity;
  amendments: GrantAmendment[];
}

export interface GrantExecutor {
  executorId: string;
  name: string;
  powers: string[];
  limitations?: string[];
  bond?: ExecutorBond;
}

export interface ExecutorBond {
  required: boolean;
  amount?: number;
  surety?: string;
  bondNumber?: string;
  issueDate?: Date;
}

export interface GrantPowers {
  general: boolean;
  specific: string[];
  requiresCourtApproval: string[];
  prohibited: string[];
}

export interface GrantStatus {
  active: boolean;
  issued: Date;
  activated?: Date;
  suspended?: Date;
  revoked?: Date;
  expiration?: Date;
}

export interface GrantValidity {
  validFrom: Date;
  validUntil?: Date;
  territorialLimit: string;
  subjectToReview: boolean;
  reviewDate?: Date;
}

export interface GrantAmendment {
  amendmentDate: Date;
  amendedBy: string;
  changes: string[];
  reason: string;
  documentId: string;
}

// Estate Administration
export interface EstateAdministration {
  caseId: string;
  executors: ActiveExecutor[];
  estateInventory: EstateInventory;
  debts: EstateDebt[];
  distributions: EstateDistribution[];
  accounts: EstateAccounts;
  timeline: AdministrationTimeline;
  status: AdministrationStatus;
}

export interface ActiveExecutor {
  executorId: string;
  role: string;
  startDate: Date;
  responsibilities: string[];
  compensation: ExecutorCompensation;
  performance: ExecutorPerformance;
}

export interface EstateInventory {
  compiled: Date;
  compiledBy: string;
  assets: InventoryAsset[];
  totalValue: number;
  verification: InventoryVerification;
  updates: InventoryUpdate[];
}

export interface InventoryAsset {
  assetId: string;
  description: string;
  value: number;
  location: string;
  ownership: string;
  encumbrances: string[];
  verified: boolean;
}

export interface InventoryVerification {
  verified: boolean;
  verifiedBy?: string;
  verificationDate?: Date;
  method: string;
  notes?: string;
}

export interface InventoryUpdate {
  date: Date;
  changes: string[];
  reason: string;
  approvedBy?: string;
}

export interface EstateDebt {
  id: string;
  creditor: string;
  description: string;
  amount: number;
  priority: DebtPriority;
  verified: boolean;
  paid: boolean;
  paidDate?: Date;
  paymentMethod?: string;
  receipt?: string;
}

export interface EstateDistribution {
  id: string;
  beneficiaryId: string;
  assetId: string;
  share: number;
  value: number;
  status: DistributionStatus;
  scheduledDate: Date;
  actualDate?: Date;
  method: string;
  receipt?: string;
  taxes: DistributionTax[];
}

export interface DistributionTax {
  type: string;
  amount: number;
  paid: boolean;
  paidDate?: Date;
  certificate?: string;
}

export interface EstateAccounts {
  periodStart: Date;
  periodEnd: Date;
  income: AccountItem[];
  expenses: AccountItem[];
  distributions: AccountItem[];
  balance: number;
  reviewed: boolean;
  reviewedBy?: string;
  reviewDate?: Date;
}

export interface AccountItem {
  date: Date;
  description: string;
  amount: number;
  category: string;
  supportingDoc?: string;
}

export interface AdministrationTimeline {
  startDate: Date;
  inventoryCompleted?: Date;
  debtsPaid?: Date;
  taxesFiled?: Date;
  distributionsStarted?: Date;
  distributionsCompleted?: Date;
  accountsFiled?: Date;
  estateClosed?: Date;
}

export interface AdministrationStatus {
  phase: AdministrationPhase;
  progress: number;
  blocked: boolean;
  blockReasons: string[];
  estimatedCompletion: Date;
}

// Probate Timeline and Deadlines
export interface ProbateTimeline {
  application: Date;
  citation: Date;
  grantIssued?: Date;
  inventoryDue: Date;
  debtsDue: Date;
  distributionDue: Date;
  accountsDue: Date;
  closureDue: Date;
  actualClosure?: Date;
}

export interface CourtFees {
  filingFee: number;
  adValoremFee: number;
  miscellaneousFees: FeeItem[];
  total: number;
  paid: boolean;
  paidDate?: Date;
  receipt?: string;
}

export interface FeeItem {
  description: string;
  amount: number;
  dueDate: Date;
  paid: boolean;
  paidDate?: Date;
}

export interface ProbateMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  courtFileNumber: string;
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string[];
}

// Type Definitions
export type ProbateCaseType = 'TESTATE' | 'INTESTATE' | 'MIXED';
export type CourtJurisdiction = 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHIS_COURT';
export type GrantType =
  | 'PROBATE'
  | 'LETTERS_OF_ADMINISTRATION'
  | 'LETTERS_OF_ADMINISTRATION_WITH_WILL';
export type ProbateStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'HEARING_SCHEDULED'
  | 'GRANT_ISSUED'
  | 'OBJECTION_FILED'
  | 'APPEALED'
  | 'CLOSED';
export type HearingType = 'MENTION' | 'DIRECTIONS' | 'HEARING' | 'RULING' | 'JUDGMENT';
export type DebtPriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DistributionStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
export type AdministrationPhase =
  | 'INITIAL'
  | 'INVENTORY'
  | 'DEBT_PAYMENT'
  | 'TAX_FILING'
  | 'DISTRIBUTION'
  | 'ACCOUNTS'
  | 'CLOSURE';
