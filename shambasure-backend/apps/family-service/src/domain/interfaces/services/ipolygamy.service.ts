import { PolygamousHouse } from '../../entities/polygamous-house.entity';

export interface IPolygamyService {
  // S.40 LSA compliance
  validatePolygamousStructure(family: {
    husbandId: string;
    wives: Array<{
      wifeId: string;
      marriageDate: Date;
      marriageType: string;
    }>;
  }): Promise<{
    compliant: boolean;
    issues: string[];
    requirements: string[];
  }>;

  // House creation and management
  createPolygamousHouse(house: {
    familyId: string;
    houseName: string;
    houseOrder: number;
    houseHeadId?: string;
    establishedDate: Date;
  }): Promise<PolygamousHouse>;

  // House dissolution
  dissolvePolygamousHouse(houseId: string, reason: string): Promise<void>;

  // Asset allocation per house
  allocateAssetsToHouses(
    familyId: string,
    assets: Array<{
      assetId: string;
      value: number;
      description: string;
    }>,
  ): Promise<Map<string, number>>; // houseId -> share percentage

  // Succession planning for polygamous families
  calculatePolygamousSuccession(
    deceasedId: string,
    houses: PolygamousHouse[],
    estateValue: number,
  ): Promise<{
    perHouseShare: number;
    houseAllocations: Map<
      string,
      {
        share: number;
        spouseShare: number;
        childrenShare: number;
      }
    >;
    unallocatedSurplus?: number;
  }>;

  // Wife consent management
  manageWifeConsent(
    husbandId: string,
    action: 'NEW_MARRIAGE' | 'ASSET_TRANSFER' | 'ESTATE_PLANNING',
  ): Promise<{
    consentRequired: boolean;
    wivesToConsult: string[];
    consentMethod: 'WRITTEN' | 'VERBAL' | 'CUSTOMARY';
  }>;

  // Customary polygamy validation
  validateCustomaryPolygamy(
    ethnicGroup: string,
    marriageDetails: {
      bridePricePaid: boolean;
      elderWitnesses: string[];
      clanApproval: boolean;
    },
  ): Promise<{
    valid: boolean;
    recognitionLevel: 'FULL' | 'PARTIAL' | 'NONE';
    documentationRequirements: string[];
  }>;

  // Court recognition process
  initiateCourtRecognition(polygamousHouse: PolygamousHouse): Promise<{
    process: string[];
    documentsRequired: string[];
    estimatedTimeline: string;
  }>;

  // House-specific estate planning
  createHouseSpecificPlan(
    houseId: string,
    plan: {
      successionInstructions: string;
      assetPreferences: string[];
      guardianPreferences?: string[];
    },
  ): Promise<void>;

  // Conflict resolution between houses
  mediateInterHouseConflicts(
    familyId: string,
    conflict: {
      type: 'ASSET' | 'INHERITANCE' | 'STATUS';
      parties: string[];
      issue: string;
    },
  ): Promise<{
    resolution: string;
    mediator?: string;
    agreementTerms: string[];
  }>;
}
