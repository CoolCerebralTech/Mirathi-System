// estate-planning/application/dto/request/update-will.dto.ts
export class UpdateWillRequestDto {
  title?: string;
  funeralWishes?: {
    burialLocation?: string;
    funeralType?: string;
    specificInstructions?: string;
  };
  residuaryClause?: string;
  digitalAssetInstructions?: {
    socialMediaHandling?: string;
    emailAccountHandling?: string;
  };
  specialInstructions?: string;
}
