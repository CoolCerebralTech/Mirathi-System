/**
 * Data Transfer Object for Executing a Will.
 *
 * LEGAL CONTEXT (S.11 LSA):
 * Represents the details of the signing ceremony.
 * Must capture the "When", "Where", and "Who" (Witnesses).
 */
export interface ExecuteWillDto {
  /**
   * The actual date/time the signing occurred.
   * Cannot be in the future.
   */
  executionDate: Date;

  /**
   * Physical location of execution (City, Hospital, Law Firm).
   * Important for establishing jurisdiction.
   */
  location: string;

  /**
   * Timezone of the execution location.
   * Defaults to 'Africa/Nairobi' if not specified.
   */
  timezone?: string;

  /**
   * The list of witnesses present (Minimum 2 required by S.11).
   */
  witnesses: {
    fullName: string;
    nationalId: string; // Critical for identity verification
    email?: string;
    phone?: string;
    physicalAddress?: string;

    // Legal Declarations (The "Attestation Clause" requirements)
    declarations: {
      isNotBeneficiary: boolean;
      isNotSpouseOfBeneficiary: boolean;
      isOfSoundMind: boolean;
      understandsDocument: boolean;
      isActingVoluntarily: boolean;
    };
  }[];
}
