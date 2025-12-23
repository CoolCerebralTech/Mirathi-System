// application/guardianship/queries/read-models/customary-guardianship.read-model.ts
export class ElderApprovalDto {
  elderName: string;
  role: string; // e.g. "Clan Head"
  approvalDate: Date;
}

export class CustomaryGuardianshipReadModel {
  guardianshipId: string;

  ethnicGroup: string; // e.g. "KIKUYU", "LUO"
  customaryAuthority: string; // e.g. "Council of Elders"

  ceremonyDate?: Date;
  witnesses: string[];

  elderApprovals: ElderApprovalDto[];
  specialConditions: Record<string, any>;

  // Conflicts check
  hasConflictWithStatutoryLaw: boolean; // Flag if customary rules clash with LSA
}
