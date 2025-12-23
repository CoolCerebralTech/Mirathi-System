// domain/value-objects/index.ts

/**
 * Estate Service - Value Objects
 *
 * Immutable, self-validating domain primitives
 * These replace primitive types (strings, numbers) with rich domain concepts
 *
 * Legal Compliance:
 * - All VOs enforce Kenyan legal requirements
 * - Validation errors prevent illegal states
 * - Immutability ensures audit trail integrity
 */

// ============================================================================
// FINANCIAL VALUE OBJECTS
// ============================================================================
export { Money } from './money.vo';
export { SharePercentage } from './share-percentage.vo';

// ============================================================================
// ASSET VALUE OBJECTS
// ============================================================================
export { AssetType, AssetTypeEnum } from './asset-type.vo';

export { AssetOwnershipType, AssetOwnershipTypeEnum } from './asset-ownership-type.vo';

export {
  AssetVerificationStatus,
  AssetVerificationStatusEnum,
} from './asset-verification-status.vo';

// ============================================================================
// DEBT VALUE OBJECTS
// ============================================================================
export { DebtPriority, DebtTier } from './debt-priority.vo';

// ============================================================================
// LEGAL REFERENCE VALUE OBJECTS
// ============================================================================
export { SuccessionLawSection, KenyanLawSection } from './succession-law-section.vo';

// ============================================================================
// KENYAN CONTEXT VALUE OBJECTS
// ============================================================================
export { KenyanCountyVO, KenyanCounty } from './kenyan-county.vo';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// 1. Money calculations (prevents floating-point errors)
const assetValue = Money.fromKES(1_500_000); // 1.5M KES
const debt = Money.fromKES(500_000);
const netValue = assetValue.subtract(debt); // 1M KES

// 2. Share distribution (S.35 LSA - intestate)
const spouseShare = SharePercentage.fromPercentage(50); // Life interest
const childShares = SharePercentage.allocateEqually(3); // 33.33% each

// 3. Debt priority ordering (S.45 LSA)
const funeralDebt = DebtPriority.funeralExpenses(); // Highest priority
const mortgage = DebtPriority.securedDebts();       // Second priority

// 4. Asset type-specific logic
const assetType = AssetType.landParcel();
if (assetType.requiresRegistryTransfer()) {
  console.log('Lands Registry transfer required');
}

// 5. Ownership type determination
const ownership = AssetOwnershipType.jointTenancy();
if (ownership.bypassesEstate()) {
  console.log('Asset passes to survivor - not distributable');
}

// 6. Legal references
const section = SuccessionLawSection.s35SpousalChildShare();
console.log(section.getFullCitation()); 
// "Section 35, Law of Succession Act (Cap 160), Laws of Kenya"

// 7. County-specific requirements
const county = KenyanCountyVO.nairobi();
console.log(county.getMainCourtStation()); // "Milimani Law Courts"
console.log(county.getLandsRegistryOffice()); // "Nairobi Lands Registry"
*/
