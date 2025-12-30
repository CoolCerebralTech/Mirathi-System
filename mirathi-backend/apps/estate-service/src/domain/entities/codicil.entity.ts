// src/estate-service/src/domain/entities/codicil.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  CodicilContentUpdatedEvent,
  CodicilCreatedEvent,
  CodicilWitnessAddedEvent,
} from '../events/codicil.events';
import { CodicilException } from '../exceptions/codicil.exceptions';
import { ExecutionDate } from '../value-objects/execution-date.vo';

/**
 * Codicil Properties Interface
 */
export interface CodicilProps {
  willId: string; // Reference to parent Will aggregate
  title: string;
  content: string;
  codicilDate: Date;
  versionNumber: number;
  executionDate: ExecutionDate;
  witnesses: string[]; // Array of witness IDs or names
  amendmentType: 'ADDITION' | 'MODIFICATION' | 'REVOCATION';
  affectedClauses?: string[]; // References to clauses in the will
  legalBasis?: string; // Legal justification for amendment
  isDependent: boolean; // Whether this codicil depends on the main will
}

/**
 * Codicil Entity
 *
 * Represents a formal amendment to an executed will in Kenya
 *
 * Legal Requirements (S.11 LSA):
 * - Must meet same formalities as original will (2 witnesses)
 * - Must reference the will it amends
 * - Cannot create contradictions without clarity
 * - Must be executed with testamentary capacity
 *
 * IMPORTANT: Codicils have NO independent legal life. They exist solely
 * as amendments to a Will aggregate.
 */
export class Codicil extends Entity<CodicilProps> {
  private constructor(props: CodicilProps, id?: UniqueEntityID) {
    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory method to create a new Codicil
   */
  public static create(props: CodicilProps, id?: UniqueEntityID): Codicil {
    const codicil = new Codicil(props, id);
    codicil.validate();

    // Apply domain event for Codicil creation
    codicil.addDomainEvent(
      new CodicilCreatedEvent(
        props.willId,
        codicil.id.toString(),
        props.title,
        props.amendmentType,
        props.versionNumber,
      ),
    );

    return codicil;
  }

  /**
   * Validate Codicil invariants
   *
   * Ensures:
   * - Has valid title and content
   * - Properly executed with witnesses
   * - Does not violate Kenyan legal requirements
   */
  public validate(): void {
    // Title validation
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new CodicilException('Codicil must have a title', 'title');
    }

    if (this.props.title.length > 200) {
      throw new CodicilException('Codicil title cannot exceed 200 characters', 'title');
    }

    // Content validation
    if (!this.props.content || this.props.content.trim().length === 0) {
      throw new CodicilException('Codicil must have content', 'content');
    }

    if (this.props.content.length > 10000) {
      throw new CodicilException('Codicil content cannot exceed 10,000 characters', 'content');
    }

    // Date validation
    if (this.props.codicilDate > new Date()) {
      throw new CodicilException('Codicil date cannot be in the future', 'codicilDate');
    }

    // Version validation
    if (this.props.versionNumber < 1) {
      throw new CodicilException('Version number must be at least 1', 'versionNumber');
    }

    // Witness validation (S.11 LSA)
    if (this.props.witnesses.length < 2) {
      throw new CodicilException('Codicil must have at least 2 witnesses (S.11 LSA)', 'witnesses');
    }

    // Amendment type validation
    const validTypes = ['ADDITION', 'MODIFICATION', 'REVOCATION'];
    if (!validTypes.includes(this.props.amendmentType)) {
      throw new CodicilException(
        `Invalid amendment type. Must be one of: ${validTypes.join(', ')}`,
        'amendmentType',
      );
    }

    // Check for contradictory amendments
    this.validateAmendmentLogic();
  }

  /**
   * Validate amendment logic
   *
   * Ensures amendments don't create contradictions
   * Example: Cannot both add and revoke same clause
   */
  private validateAmendmentLogic(): void {
    if (this.props.amendmentType === 'REVOCATION') {
      if (!this.props.affectedClauses || this.props.affectedClauses.length === 0) {
        throw new CodicilException(
          'Revocation codicil must specify affected clauses',
          'affectedClauses',
        );
      }
    }

    // If this is a dependent codicil, ensure it references valid clauses
    if (this.props.isDependent && !this.props.affectedClauses) {
      throw new CodicilException(
        'Dependent codicil must specify affected clauses',
        'affectedClauses',
      );
    }
  }

  /**
   * Update codicil content
   *
   * Note: Once executed, codicils should generally be immutable.
   * This method is for draft codicils only.
   */
  public updateContent(newContent: string): void {
    if (this.isExecuted()) {
      throw new CodicilException(
        'Cannot modify executed codicil. Create a new codicil instead.',
        'updateContent',
      );
    }

    if (!newContent || newContent.trim().length === 0) {
      throw new CodicilException('Content cannot be empty', 'content');
    }
    // Capture previous version for the event
    const previousVersion = this.props.versionNumber;
    const newVersion = previousVersion + 1;

    this.updateState({
      content: newContent,
      versionNumber: this.props.versionNumber + 1,
    });

    // Add domain event for modification
    this.addDomainEvent(
      new CodicilContentUpdatedEvent(
        this.props.willId,
        this.id.toString(),
        previousVersion,
        newVersion,
        'Content updated via updateContent method',
      ),
    );
  }

  /**
   * Add witness to codicil
   *
   * Note: Can only add witnesses before execution
   */
  public addWitness(witnessId: string): void {
    if (this.isExecuted()) {
      throw new CodicilException('Cannot add witnesses to executed codicil', 'witnesses');
    }

    if (this.props.witnesses.includes(witnessId)) {
      throw new CodicilException('Witness already added to codicil', 'witnesses');
    }
    const newWitnessList = [...this.props.witnesses, witnessId];
    this.updateState({
      witnesses: [...this.props.witnesses, witnessId],
    });
    this.addDomainEvent(
      new CodicilWitnessAddedEvent(
        this.props.willId,
        this.id.toString(),
        witnessId,
        newWitnessList.length,
      ),
    );
  }

  /**
   * Check if codicil has been executed
   *
   * Execution means it has been properly witnessed and dated
   */
  public isExecuted(): boolean {
    return this.props.witnesses.length >= 2 && this.props.executionDate !== undefined;
  }

  /**
   * Get summary of amendment
   */
  public getAmendmentSummary(): string {
    const typeMap = {
      ADDITION: 'Adds new provisions',
      MODIFICATION: 'Modifies existing provisions',
      REVOCATION: 'Revokes existing provisions',
    };

    const baseSummary = `${typeMap[this.props.amendmentType]}: ${this.props.title}`;

    if (this.props.affectedClauses && this.props.affectedClauses.length > 0) {
      const clauses = this.props.affectedClauses.join(', ');
      return `${baseSummary} (Affects: ${clauses})`;
    }

    return baseSummary;
  }

  /**
   * Check if this codicil affects specific clause
   */
  public affectsClause(clauseReference: string): boolean {
    if (!this.props.affectedClauses) {
      return false;
    }

    return this.props.affectedClauses.includes(clauseReference);
  }

  /**
   * Get legal validity assessment
   */
  public getValidityAssessment(): {
    isValid: boolean;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check witness count
    if (this.props.witnesses.length < 2) {
      reasons.push('Insufficient witnesses (minimum 2 required)');
    }

    // Check content
    if (!this.props.content || this.props.content.trim().length === 0) {
      reasons.push('Codicil has no content');
    }

    // Check for proper reference to will
    if (!this.props.willId) {
      reasons.push('Codicil does not reference a valid will');
    }

    // Check if codicil is too long (warning)
    if (this.props.content.length > 5000) {
      warnings.push('Codicil is lengthy - consider separate codicils for clarity');
    }

    // Check amendment type clarity
    if (
      this.props.amendmentType === 'MODIFICATION' &&
      (!this.props.affectedClauses || this.props.affectedClauses.length === 0)
    ) {
      warnings.push('Modification codicil should specify affected clauses');
    }

    const isValid = reasons.length === 0;

    return { isValid, reasons, warnings };
  }

  /**
   * Calculate if codicil needs to be re-executed
   *
   * Based on Kenyan legal practice:
   * - If substantial changes are made after initial execution
   * - If witnesses become unavailable/ineligible
   * - If there are doubts about capacity
   */
  public needsReExecution(): boolean {
    // If not yet executed, doesn't need re-execution
    if (!this.isExecuted()) {
      return false;
    }

    // Check if codicil was executed more than 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (this.props.codicilDate < oneYearAgo) {
      return true; // Old codicil should be re-executed as precaution
    }

    // Check if any major changes were made after execution
    const hasPostExecutionChanges = this.props.versionNumber > 1 && this.isExecuted();

    return hasPostExecutionChanges;
  }

  // Getters
  get willId(): string {
    return this.props.willId;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get codicilDate(): Date {
    return this.props.codicilDate;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get executionDate(): ExecutionDate {
    return this.props.executionDate;
  }

  get witnesses(): string[] {
    return [...this.props.witnesses];
  }

  get amendmentType(): string {
    return this.props.amendmentType;
  }

  get affectedClauses(): string[] | undefined {
    return this.props.affectedClauses ? [...this.props.affectedClauses] : undefined;
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get isDependent(): boolean {
    return this.props.isDependent;
  }
}
