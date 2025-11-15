/**
 * Family Relationships and HeirLink™ Interfaces
 */

// Family Structure
export interface Family {
  id: string;
  name: string;
  description?: string;
  creator: FamilyCreator;
  members: FamilyMember[];
  relationships: FamilyRelationship[];
  marriages: Marriage[];
  treeData: FamilyTreeData;
  metadata: FamilyMetadata;
}

export interface FamilyCreator {
  userId: string;
  createdDate: Date;
  role: string;
}

export interface FamilyMetadata {
  created: Date;
  updated: Date;
  isActive: boolean;
  privacy: FamilyPrivacy;
  settings: FamilySettings;
}

export interface FamilyPrivacy {
  level: 'PRIVATE' | 'SHARED' | 'PUBLIC';
  sharedWith: string[];
  visibility: FamilyVisibility;
}

export interface FamilyVisibility {
  members: boolean;
  relationships: boolean;
  assets: boolean;
  documents: boolean;
}

export interface FamilySettings {
  allowMemberAdditions: boolean;
  allowRelationshipChanges: boolean;
  requireVerification: boolean;
  notificationPreferences: NotificationPreferences;
}

// Family Tree Structure
export interface FamilyTreeData {
  rootMemberId: string;
  structure: TreeStructure;
  visualization: TreeVisualization;
  statistics: TreeStatistics;
}

export interface TreeStructure {
  nodes: TreeNode[];
  edges: TreeEdge[];
  hierarchies: Hierarchy[];
}

export interface TreeNode {
  id: string;
  type: 'PERSON' | 'MARRIAGE' | 'OTHER';
  data: TreeNodeData;
  position?: TreePosition;
}

export interface TreeNodeData {
  label: string;
  relationship: string;
  isDeceased: boolean;
  isMinor: boolean;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  avatar?: string;
}

export interface TreePosition {
  x: number;
  y: number;
  level: number;
}

export interface TreeEdge {
  from: string;
  to: string;
  type: 'PARENT_CHILD' | 'MARRIAGE' | 'OTHER';
  label?: string;
  data: EdgeData;
}

export interface EdgeData {
  relationship: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface Hierarchy {
  rootId: string;
  generations: number;
  members: string[];
}

export interface TreeVisualization {
  layout: 'HIERARCHICAL' | 'RADIAL' | 'CUSTOM';
  orientation: 'HORIZONTAL' | 'VERTICAL';
  spacing: VisualizationSpacing;
  styles: VisualizationStyles;
}

export interface VisualizationSpacing {
  nodeWidth: number;
  nodeHeight: number;
  levelSeparation: number;
  siblingSeparation: number;
  subtreeSeparation: number;
}

export interface VisualizationStyles {
  nodeStyle: NodeStyle;
  edgeStyle: EdgeStyle;
  marriageStyle: MarriageStyle;
}

export interface NodeStyle {
  shape: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
}

export interface EdgeStyle {
  color: string;
  width: number;
  style: 'SOLID' | 'DASHED' | 'DOTTED';
  arrowType: string;
}

export interface MarriageStyle {
  nodeShape: string;
  nodeColor: string;
  connectionStyle: string;
}

export interface TreeStatistics {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  minorMembers: number;
  generations: number;
  marriages: number;
  averageAge: number;
  oldestMember: string;
  youngestMember: string;
}

// Marriage and Relationships
export interface Marriage {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageType: MarriageType;
  marriageDate: Date;
  certificate: MarriageCertificate;
  status: MarriageStatus;
  dissolution?: MarriageDissolution;
  children: string[];
  metadata: MarriageMetadata;
}

export interface MarriageType {
  type: string;
  subType?: string;
  customaryDetails?: CustomaryMarriageDetails;
  religiousDetails?: ReligiousMarriageDetails;
}

export interface CustomaryMarriageDetails {
  community: string;
  traditions: string[];
  bridePrice?: BridePrice;
  elderApproval: boolean;
  registration: CustomaryRegistration;
}

export interface BridePrice {
  paid: boolean;
  amount?: number;
  items?: string[];
  status: 'FULL' | 'PARTIAL' | 'PENDING';
}

export interface CustomaryRegistration {
  registered: boolean;
  registrationDate?: Date;
  certificateNumber?: string;
}

export interface ReligiousMarriageDetails {
  religion: string;
  denomination?: string;
  ceremonyDate: Date;
  officiant: string;
  placeOfWorship: string;
}

export interface MarriageCertificate {
  number?: string;
  issueDate?: Date;
  issuingAuthority: string;
  verified: boolean;
  documentId?: string;
}

export interface MarriageStatus {
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  status: 'MARRIED' | 'DIVORCED' | 'ANNULLED' | 'SEPARATED';
}

export interface MarriageDissolution {
  type: 'DIVORCE' | 'DEATH' | 'ANNULLMENT';
  date: Date;
  certificate?: DissolutionCertificate;
  settlement?: DivorceSettlement;
}

export interface DissolutionCertificate {
  number?: string;
  issueDate?: Date;
  issuingAuthority: string;
}

export interface DivorceSettlement {
  finalized: boolean;
  settlementDate?: Date;
  childCustody: ChildCustody[];
  assetDivision: AssetDivision[];
}

export interface ChildCustody {
  childId: string;
  custodyType: 'SOLE' | 'JOINT' | 'SPLIT';
  primaryResidence: string;
  visitation: VisitationSchedule;
  childSupport?: ChildSupport;
}

export interface VisitationSchedule {
  schedule: string;
  holidays: string;
  specialArrangements?: string;
}

export interface ChildSupport {
  amount: number;
  frequency: string;
  startDate: Date;
  endDate?: Date;
}

export interface AssetDivision {
  assetId: string;
  spouse1Share: number;
  spouse2Share: number;
  transferRequired: boolean;
  transferDate?: Date;
}

export interface MarriageMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  notes?: string;
}

// Guardian and Ward Relationships
export interface Guardianship {
  id: string;
  guardianId: string;
  wardId: string;
  type: GuardianshipType;
  appointment: GuardianshipAppointment;
  responsibilities: GuardianResponsibilities;
  status: GuardianshipStatus;
  metadata: GuardianshipMetadata;
}

export interface GuardianshipType {
  type: string;
  scope: 'FULL' | 'FINANCIAL' | 'MEDICAL' | 'EDUCATIONAL';
  limitations?: string[];
}

export interface GuardianshipAppointment {
  appointedBy: string;
  appointmentDate: Date;
  effectiveDate: Date;
  expirationDate?: Date;
  courtOrder?: CourtOrder;
  testamentary?: TestamentaryAppointment;
}

export interface CourtOrder {
  caseNumber: string;
  court: string;
  judge: string;
  orderDate: Date;
}

export interface TestamentaryAppointment {
  willId: string;
  clause: string;
  conditions?: string[];
}

export interface GuardianResponsibilities {
  financial: FinancialResponsibilities;
  medical: MedicalResponsibilities;
  educational: EducationalResponsibilities;
  personal: PersonalResponsibilities;
}

export interface FinancialResponsibilities {
  manageAssets: boolean;
  makeInvestments: boolean;
  payExpenses: boolean;
  accountReporting: boolean;
}

export interface MedicalResponsibilities {
  consentToTreatment: boolean;
  chooseProviders: boolean;
  accessRecords: boolean;
}

export interface EducationalResponsibilities {
  chooseSchool: boolean;
  consentToActivities: boolean;
  accessRecords: boolean;
}

export interface PersonalResponsibilities {
  determineResidence: boolean;
  religiousUpbringing: boolean;
  travelConsent: boolean;
}

export interface GuardianshipStatus {
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  reasonEnded?: string;
  reviewDate?: Date;
}

export interface GuardianshipMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  reviewSchedule: ReviewSchedule;
  reports: GuardianReport[];
}

export interface ReviewSchedule {
  frequency: string;
  nextReview: Date;
  lastReview?: Date;
}

export interface GuardianReport {
  date: Date;
  type: string;
  submittedBy: string;
  summary: string;
  documentId?: string;
}

// Family Analysis and Insights
export interface FamilyAnalysis {
  familyId: string;
  analysisDate: Date;
  dependants: DependantAnalysis;
  succession: SuccessionAnalysis;
  risks: RiskAnalysis;
  recommendations: Recommendation[];
}

export interface DependantAnalysis {
  totalDependants: number;
  minorDependants: number;
  adultDependants: number;
  specialNeeds: number;
  financialDependants: number;
  dependantCategories: DependantCategory[];
}

export interface DependantCategory {
  category: string;
  count: number;
  provisionRequired: boolean;
  averageProvision: number;
}

export interface SuccessionAnalysis {
  intestateScenario: IntestateScenario;
  testateScenario: TestateScenario;
  comparison: ScenarioComparison;
  recommendations: string[];
}

export interface IntestateScenario {
  applicable: boolean;
  distribution: IntestateDistribution;
  issues: string[];
  compliance: KenyanLawValidation;
}

export interface TestateScenario {
  applicable: boolean;
  willExists: boolean;
  willStatus: string;
  coverage: number;
  issues: string[];
}

export interface ScenarioComparison {
  differences: ScenarioDifference[];
  advantages: string[];
  disadvantages: string[];
  recommendation: string;
}

export interface ScenarioDifference {
  aspect: string;
  intestate: string;
  testate: string;
  impact: string;
}

export interface RiskAnalysis {
  financialRisks: FinancialRisk[];
  legalRisks: LegalRisk[];
  familyRisks: FamilyRisk[];
  overallRisk: RiskLevel;
}

export interface FinancialRisk {
  type: string;
  severity: RiskLevel;
  probability: RiskLevel;
  impact: string;
  mitigation: string;
}

export interface LegalRisk {
  type: string;
  severity: RiskLevel;
  probability: RiskLevel;
  impact: string;
  mitigation: string;
}

export interface FamilyRisk {
  type: string;
  severity: RiskLevel;
  probability: RiskLevel;
  impact: string;
  mitigation: string;
}

export interface Recommendation {
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  action: string;
  timeline: string;
  resources: string[];
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Notification Preferences
export interface NotificationPreferences {
  email: NotificationSettings;
  sms: NotificationSettings;
  push: NotificationSettings;
  frequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
}

export interface NotificationSettings {
  enabled: boolean;
  categories: string[];
  quietHours?: QuietHours;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: string[];
}