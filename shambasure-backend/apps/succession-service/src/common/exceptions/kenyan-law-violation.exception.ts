/**
 * A custom exception to be thrown when an action violates a specific
 * provision of the Kenyan Law of Succession Act (Cap. 160).
 *
 * This exception carries rich, structured data about the legal violation,
 * which is then caught by the KenyanLawViolationFilter to produce a
 * detailed, client-friendly error response.
 *
 * @example
 * // In a service:
 * throw new KenyanLawViolationException(
 *   'A will must have at least two witnesses.',
 *   '11', // The relevant section of the Act
 *   'WILL_FORMALITIES',
 *   ['Provided only 1 witness out of the required 2.']
 * );
 */
export class KenyanLawViolationException extends Error {
  constructor(
    /**
     * A human-readable summary of the violation.
     */
    public readonly requirement: string,
    /**
     * The specific section of the Law of Succession Act that was violated.
     */
    public readonly lawSection: string,
    /**
     * A machine-readable code for the type of legal rule violated.
     */
    public readonly rule: string,
    /**
     * An array of specific error messages detailing the violations.
     */
    public readonly violations: string[],
  ) {
    // The main error message is a combination of the rule and the requirement.
    super(`Legal Violation [${rule}]: ${requirement}`);
    this.name = 'KenyanLawViolationException';
  }
}
