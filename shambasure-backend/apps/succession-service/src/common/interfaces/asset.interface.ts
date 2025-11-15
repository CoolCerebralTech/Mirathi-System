/**
 * Asset Management and Valuation Interfaces
 */

// Core Asset Management
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  description?: string;
  category: AssetCategory;
  ownership: AssetOwnership;
  valuation: AssetValuation;
  location: AssetLocation;
  identification: AssetIdentification;
  documents: AssetDocument[];
  status: AssetStatus;
  metadata: AssetMetadata;
}

export interface AssetOwnership {
  ownerId: string;
  ownershipType: AssetOwnershipType;
  sharePercentage: number;
  acquisition: AcquisitionDetails;
  coOwners: CoOwner[];
  isEncumbered: boolean;
  encumbrances: Encumbrance[];
  transferRestrictions: string[];
}

export interface AcquisitionDetails {
  date: Date;
  method: AcquisitionMethod;
  cost: number;
  source: string;
  documentation: string[];
}

export interface CoOwner {
  id?: string;
  type: 'USER' | 'EXTERNAL';
  fullName: string;
  email?: string;
  phone?: string;
  sharePercentage: number;
  relationship: string;
  ownershipType: CoOwnershipType;
  acquisitionDate: Date;
}

export interface Encumbrance {
  type: string;
  description: string;
  amount?: number;
  creditor?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  documentation: string[];
}

export interface AssetValuation {
  currentValue: number;
  currency: string;
  valuationDate: Date;
  valuationMethod: ValuationMethod;
  valuedBy: string;
  confidence: ValuationConfidence;
  marketData: MarketData;
  assumptions: ValuationAssumption[];
  history: HistoricalValuation[];
  nextValuationDate?: Date;
}

export interface MarketData {
  marketValue: number;
  comparableSales: ComparableSale[];
  marketTrend: MarketTrend;
  economicFactors: EconomicFactor[];
}

export interface ComparableSale {
  description: string;
  salePrice: number;
  saleDate: Date;
  location: string;
  adjustments: Adjustment[];
  adjustedValue: number;
}

export interface Adjustment {
  factor: string;
  amount: number;
  direction: 'UP' | 'DOWN';
}

export interface MarketTrend {
  direction: 'UP' | 'DOWN' | 'STABLE';
  percentage: number;
  timeframe: string;
  factors: string[];
}

export interface EconomicFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  magnitude: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ValuationAssumption {
  assumption: string;
  impact: string;
  certainty: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HistoricalValuation {
  value: number;
  date: Date;
  method: ValuationMethod;
  valuedBy: string;
  notes?: string;
  documentation: string[];
}

export interface AssetLocation {
  type: 'PHYSICAL' | 'DIGITAL' | 'FINANCIAL';
  physical?: PhysicalLocation;
  digital?: DigitalLocation;
  financial?: FinancialLocation;
}

export interface PhysicalLocation {
  address: PostalAddress;
  coordinates?: GeoCoordinates;
  parcel?: LandParcel;
  building?: BuildingDetails;
}

export interface LandParcel {
  titleNumber: string;
  parcelNumber: string;
  size: number;
  unit: 'ACRES' | 'HECTARES';
  boundaries: string[];
  landUse: string;
  zoning: string;
  improvements: string[];
}

export interface BuildingDetails {
  type: string;
  size: number;
  units: number;
  condition: string;
  yearBuilt: number;
  features: string[];
}

export interface DigitalLocation {
  platform: string;
  url: string;
  account: string;
  accessDetails: string;
}

export interface FinancialLocation {
  institution: string;
  branch: string;
  accountNumber: string;
  accountType: string;
}

export interface AssetIdentification {
  registrationNumber?: string;
  serialNumber?: string;
  titleDeedNumber?: string;
  accountNumber?: string;
  vin?: string;
  engineNumber?: string;
  otherIdentifiers: Record<string, string>;
}

export interface AssetDocument {
  id: string;
  type: AssetDocumentType;
  name: string;
  issueDate: Date;
  expiryDate?: Date;
  issuingAuthority: string;
  verified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  documentUrl: string;
}

export interface AssetStatus {
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  verifiedBy?: string;
  lastUpdated: Date;
  updateReason?: string;
}

export interface AssetMetadata {
  created: Date;
  updated: Date;
  createdBy: string;
  tags: string[];
  notes?: string;
  customFields: Record<string, any>;
}

// Asset Specific Types
export interface LandAsset extends Asset {
  landDetails: LandDetails;
}

export interface LandDetails {
  titleType: TitleType;
  registration: LandRegistration;
  survey: SurveyDetails;
  landUse: LandUse;
  environmental: EnvironmentalFactors;
}

export interface LandRegistration {
  district: string;
  division: string;
  location: string;
  sublocation: string;
  registrationDate: Date;
  leasehold?: LeaseholdDetails;
}

export interface LeaseholdDetails {
  term: number;
  startDate: Date;
  endDate: Date;
  lessor: string;
  conditions: string[];
}

export interface SurveyDetails {
  surveyPlan: string;
  surveyor: string;
  surveyDate: Date;
  beacons: Beacon[];
  area: number;
}

export interface Beacon {
  number: string;
  type: string;
  condition: string;
  coordinates: GeoCoordinates;
}

export interface LandUse {
  current: string;
  permitted: string[];
  restrictions: string[];
  developmentPotential: string;
}

export interface EnvironmentalFactors {
  floodRisk: boolean;
  erosionRisk: boolean;
  conservationArea: boolean;
  protectedSpecies: boolean;
}

export interface PropertyAsset extends Asset {
  propertyDetails: PropertyDetails;
}

export interface PropertyDetails {
  propertyType: string;
  construction: ConstructionDetails;
  amenities: Amenity[];
  occupancy: OccupancyDetails;
  rental?: RentalDetails;
}

export interface ConstructionDetails {
  yearBuilt: number;
  materials: string[];
  condition: string;
  lastRenovation?: number;
  floorArea: number;
  rooms: RoomDetails[];
}

export interface RoomDetails {
  type: string;
  count: number;
  sizes: number[];
  features: string[];
}

export interface Amenity {
  type: string;
  description: string;
  condition: string;
}

export interface OccupancyDetails {
  occupied: boolean;
  occupant?: string;
  relationship?: string;
  since?: Date;
}

export interface RentalDetails {
  rented: boolean;
  rentAmount?: number;
  tenant?: string;
  leaseStart?: Date;
  leaseEnd?: Date;
}

export interface VehicleAsset extends Asset {
  vehicleDetails: VehicleDetails;
}

export interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  color: string;
  registration: VehicleRegistration;
  technical: TechnicalDetails;
  usage: UsageDetails;
}

export interface VehicleRegistration {
  number: string;
  expiry: Date;
  class: string;
  country: string;
}

export interface TechnicalDetails {
  engineSize: number;
  fuelType: string;
  transmission: string;
  mileage: number;
  condition: string;
  serviceHistory: ServiceRecord[];
}

export interface ServiceRecord {
  date: Date;
  mileage: number;
  serviceType: string;
  cost: number;
  garage: string;
}

export interface UsageDetails {
  primaryUse: string;
  annualMileage: number;
  storage: string;
  condition: string;
}

export interface FinancialAsset extends Asset {
  financialDetails: FinancialDetails;
}

export interface FinancialDetails {
  institution: FinancialInstitution;
  account: AccountDetails;
  performance: PerformanceData;
  transactions: Transaction[];
}

export interface FinancialInstitution {
  name: string;
  type: string;
  branch: string;
  contact: ContactInfo;
}

export interface AccountDetails {
  type: string;
  number: string;
  currency: string;
  openingDate: Date;
  interestRate?: number;
  terms: string[];
}

export interface PerformanceData {
  currentBalance: number;
  historicalPerformance: PerformanceRecord[];
  riskLevel: string;
  growth: number;
}

export interface PerformanceRecord {
  date: Date;
  value: number;
  return: number;
}

export interface Transaction {
  date: Date;
  type: string;
  amount: number;
  description: string;
  balance: number;
}

export interface BusinessAsset extends Asset {
  businessDetails: BusinessDetails;
}

export interface BusinessDetails {
  businessType: string;
  registration: BusinessRegistration;
  operations: BusinessOperations;
  financials: BusinessFinancials;
  employees: Employee[];
}

export interface BusinessRegistration {
  name: string;
  number: string;
  date: Date;
  authority: string;
  type: string;
}

export interface BusinessOperations {
  industry: string;
  location: string;
  premises: PremisesDetails;
  licenses: BusinessLicense[];
}

export interface PremisesDetails {
  owned: boolean;
  size: number;
  lease?: LeaseDetails;
}

export interface LeaseDetails {
  landlord: string;
  term: number;
  rent: number;
  expiry: Date;
}

export interface BusinessLicense {
  type: string;
  number: string;
  expiry: Date;
  authority: string;
}

export interface BusinessFinancials {
  revenue: number;
  profit: number;
  assets: number;
  liabilities: number;
  valuation: BusinessValuation;
}

export interface BusinessValuation {
  method: string;
  value: number;
  multiples: ValuationMultiple[];
  assumptions: string[];
}

export interface ValuationMultiple {
  type: string;
  value: number;
  industryAverage: number;
}

export interface Employee {
  name: string;
  position: string;
  startDate: Date;
  salary: number;
  fullTime: boolean;
}

// Asset Verification and Validation
export interface AssetVerification {
  assetId: string;
  verified: boolean;
  verificationDate: Date;
  verifiedBy: string;
  method: VerificationMethod;
  documents: VerificationDocument[];
  findings: VerificationFinding[];
  status: VerificationStatus;
}

export interface VerificationDocument {
  type: string;
  name: string;
  verified: boolean;
  issues: string[];
}

export interface VerificationFinding {
  aspect: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  recommendation?: string;
}

export interface VerificationStatus {
  overall: 'VERIFIED' | 'PENDING' | 'FAILED';
  aspects: Record<string, 'VERIFIED' | 'PENDING' | 'FAILED'>;
  score: number;
}

// Asset Transfer and Distribution
export interface AssetTransfer {
  assetId: string;
  fromOwner: string;
  toOwner: string;
  transferType: TransferType;
  transferDate: Date;
  value: number;
  consideration: number;
  taxes: TransferTax[];
  documents: TransferDocument[];
  status: TransferStatus;
}

export interface TransferTax {
  type: string;
  amount: number;
  paid: boolean;
  paidDate?: Date;
  certificate?: string;
}

export interface TransferDocument {
  type: string;
  name: string;
  executed: boolean;
  executedDate?: Date;
  filed: boolean;
  filedDate?: Date;
}

export interface TransferStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  steps: TransferStep[];
  currentStep: number;
}

export interface TransferStep {
  step: string;
  completed: boolean;
  completedDate?: Date;
  required: boolean;
}

// Type Definitions
export type AssetType =
  | 'LAND_PARCEL'
  | 'PROPERTY'
  | 'FINANCIAL_ASSET'
  | 'DIGITAL_ASSET'
  | 'BUSINESS_INTEREST'
  | 'VEHICLE'
  | 'LIVESTOCK'
  | 'PERSONAL_EFFECTS'
  | 'INTELLECTUAL_PROPERTY'
  | 'OTHER';

export type AssetCategory = 'IMMOVABLE' | 'MOVABLE' | 'FINANCIAL' | 'DIGITAL' | 'INTANGIBLE';
export type AssetOwnershipType =
  | 'SOLE'
  | 'JOINT_TENANCY'
  | 'TENANCY_IN_COMMON'
  | 'COMMUNITY_PROPERTY';
export type CoOwnershipType = 'JOINT_TENANT' | 'TENANT_IN_COMMON';
export type AcquisitionMethod = 'PURCHASE' | 'INHERITANCE' | 'GIFT' | 'SETTLEMENT' | 'OTHER';
export type ValuationMethod =
  | 'MARKET_COMPARISON'
  | 'INCOME_APPROACH'
  | 'COST_APPROACH'
  | 'PROFESSIONAL_APPRAISAL';
export type ValuationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type AssetDocumentType =
  | 'TITLE_DEED'
  | 'SALE_AGREEMENT'
  | 'VALUATION_REPORT'
  | 'REGISTRATION_CERTIFICATE';
export type TitleType = 'ABSOLUTE' | 'LEASEHOLD' | 'CUSTOMARY' | 'GROUP_REPRESENTATIVE';
export type VerificationMethod =
  | 'DOCUMENT_REVIEW'
  | 'SITE_VISIT'
  | 'THIRD_PARTY_VERIFICATION'
  | 'AUTOMATED';
export type TransferType = 'SALE' | 'GIFT' | 'INHERITANCE' | 'SETTLEMENT' | 'DISTRIBUTION';
