/**
 * Core Succession Domain Interfaces
 */

// Will Management
export interface Will {
  id: string;
  title: string;
  status: WillStatus;
  testator: Testator;
  willDate: Date;
  lastModified: Date;
  version: WillVersion;
  formalities: WillFormalities;
  assets: Asset[];
  beneficiaries: Beneficiary[];
  executors: Executor[];
  witnesses: Witness[];
  specialInstructions?: string;
  funeralWishes?: string;
  digitalAssetInstructions?: string;
  metadata: WillMetadata;
}

export interface Testator {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  dateOfDeath?: Date;
  address: PostalAddress;
  identification: Identification;
  capacity: TestatorCapacity;
}

export interface WillVersion {
  number: number;
  created: Date;
  changes: string[];
  changedBy: string;
  snapshot: any;
}

export interface WillMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  isActive: boolean;
  storageLocation: string;
  accessLog: AccessLogEntry[];
}

// Asset Management
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description?: string;
  ownership: AssetOwnership;
  valuation: AssetValuation;
  location?: AssetLocation;
  identification: AssetIdentification;
  documents: AssetDocument[];
  status: AssetStatus;
  metadata: AssetMetadata;
}

export interface AssetOwnership {
  ownerId: string;
  ownershipType: string;
  sharePercentage: number;
  coOwners: CoOwner[];
  isEncumbered: boolean;
  encumbranceDetails?: string;
}

export interface CoOwner {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  sharePercentage: number;
  relationship: string;
}

export interface AssetValuation {
  currentValue: number;
  currency: string;
  valuationDate: Date;
  valuationMethod: string;
  valuedBy: string;
  confidence: string;
  history: HistoricalValuation[];
}

export interface HistoricalValuation {
  value: number;
  date: Date;
  method: string;
  notes?: string;
}

export interface AssetLocation {
  county: string;
  subCounty: string;
  ward: string;
  parcelNumber?: string;
  coordinates?: GeoCoordinates;
  address?: string;
}

export interface AssetIdentification {
  registrationNumber?: string;
  serialNumber?: string;
  titleDeedNumber?: string;
  accountNumber?: string;
  otherIdentifiers: Record<string, string>;
}

export interface AssetDocument {
  id: string;
  type: string;
  name: string;
  verified: boolean;
  verificationDate?: Date;
}

export interface AssetStatus {
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
}

export interface AssetMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  tags: string[];
  notes?: string;
}

// Beneficiary Management
export interface Beneficiary {
  id: string;
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  relationship: string;
  bequest: Bequest;
  conditions: Condition[];
  status: BeneficiaryStatus;
  contact?: ContactInfo;
}

export interface Bequest {
  type: string;
  assetId?: string;
  sharePercentage?: number;
  specificAmount?: number;
  description: string;
  priority: number;
}

export interface Condition {
  type: string;
  description: string;
  isMet: boolean;
  metDate?: Date;
  alternateBeneficiary?: string;
}

export interface BeneficiaryStatus {
  distributionStatus: string;
  distributedDate?: Date;
  distributionNotes?: string;
  isEligible: boolean;
  eligibilityReason?: string;
}

// Executor Management
export interface Executor {
  id: string;
  type: 'USER' | 'EXTERNAL';
  fullName: string;
  relationship: string;
  role: ExecutorRole;
  contact: ContactInfo;
  status: ExecutorStatus;
  duties: ExecutorDuty[];
  compensation?: ExecutorCompensation;
}

export interface ExecutorRole {
  isPrimary: boolean;
  orderOfPriority: number;
  powers: string[];
  limitations?: string[];
}

export interface ExecutorStatus {
  status: string;
  appointedDate?: Date;
  acceptedDate?: Date;
  declinedDate?: Date;
  declineReason?: string;
  completedDate?: Date;
}

// Witness Management
export interface Witness {
  id: string;
  type: 'USER' | 'EXTERNAL';
  fullName: string;
  relationship: string;
  contact: ContactInfo;
  status: WitnessStatus;
  eligibility: WitnessEligibility;
  signature?: WitnessSignature;
}

export interface WitnessEligibility {
  isEligible: boolean;
  reasons: string[];
  verification: WitnessVerification;
}

export interface WitnessVerification {
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date;
  method: string;
}

export interface WitnessSignature {
  signed: boolean;
  signedDate?: Date;
  signatureType: string;
  signatureData?: string;
}

// Family Relationships
export interface FamilyMember {
  id: string;
  userId?: string;
  familyId: string;
  personalInfo: PersonalInfo;
  relationship: FamilyRelationship;
  legalStatus: LegalStatus;
  metadata: FamilyMemberMetadata;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: string;
  identification: Identification;
  contact?: ContactInfo;
}

export interface FamilyRelationship {
  type: string;
  relationshipTo: string;
  marriage?: MarriageInfo;
  parents: string[];
  children: string[];
  spouses: string[];
}

export interface MarriageInfo {
  spouseId: string;
  marriageDate: Date;
  marriageType: string;
  isActive: boolean;
  divorceDate?: Date;
}

export interface LegalStatus {
  isMinor: boolean;
  isDeceased: boolean;
  guardians: Guardian[];
  dependantStatus: DependantStatus;
}

export interface Guardian {
  guardianId: string;
  type: string;
  appointedBy: string;
  appointmentDate: Date;
  validUntil?: Date;
}

export interface DependantStatus {
  isDependant: boolean;
  dependencyType?: string;
  maintainedBy: string[];
}

export interface FamilyMemberMetadata {
  addedBy: string;
  addedDate: Date;
  lastUpdated: Date;
  verification: VerificationStatus;
}

// Common Shared Interfaces
export interface Identification {
  type: string;
  number: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingCountry: string;
  verified: boolean;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface AccessLogEntry {
  userId: string;
  timestamp: Date;
  action: string;
  ipAddress: string;
  userAgent: string;
}

export interface VerificationStatus {
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date;
  method: string;
  notes?: string;
}

// Status Enums (for reference)
export type WillStatus =
  | 'DRAFT'
  | 'PENDING_WITNESS'
  | 'WITNESSED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'EXECUTED'
  | 'CONTESTED'
  | 'PROBATE';

export type AssetType =
  | 'LAND_PARCEL'
  | 'PROPERTY'
  | 'FINANCIAL_ASSET'
  | 'DIGITAL_ASSET'
  | 'BUSINESS_INTEREST'
  | 'VEHICLE'
  | 'LIVESTOCK'
  | 'PERSONAL_EFFECTS'
  | 'OTHER';

export type WitnessStatus = 'PENDING' | 'SIGNED' | 'VERIFIED' | 'REJECTED';

export type ExecutorStatus = 'NOMINATED' | 'ACTIVE' | 'DECLINED' | 'REMOVED' | 'COMPLETED';
