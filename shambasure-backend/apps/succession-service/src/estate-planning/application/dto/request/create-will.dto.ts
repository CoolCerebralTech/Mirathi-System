// estate-planning/application/dto/request/create-will.dto.ts
export class CreateWillRequestDto {
  title: string;
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
  requiresWitnesses?: boolean;
}
