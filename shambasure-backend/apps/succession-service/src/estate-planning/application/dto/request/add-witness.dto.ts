// estate-planning/application/dto/request/add-witness.dto.ts
export class AddWitnessRequestDto {
  witnessType: 'USER' | 'EXTERNAL';
  witnessId?: string;
  externalWitness?: {
    fullName: string;
    idNumber: string;
    email: string;
    phone: string;
    relationship?: string;
    address?: {
      street?: string;
      city?: string;
      county?: string;
    };
  };
}
