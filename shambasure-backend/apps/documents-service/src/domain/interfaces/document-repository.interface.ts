import { Document } from '../models/document.model';
import { DocumentId } from '../value-objects';

/**
 * Repository for the Document aggregate root (Command Side).
 *
 * This interface adheres to the Command Query Responsibility Segregation (CQRS) pattern.
 * Its purpose is strictly to manage the lifecycle and persistence of the full Document aggregate.
 * It is responsible for transactional consistency and enforcing invariants through the aggregate.
 *
 * @see IDocumentQueryRepository for read, search, and reporting operations.
 */
export interface IDocumentRepository {
  /**
   * Generates a new unique identity for a Document aggregate.
   * This is used by the application service to assign an ID before creation.
   */
  nextIdentity(): DocumentId;

  /**
   * Saves a Document aggregate (handles both insert and update).
   * The implementation of this method MUST handle optimistic locking by checking the
   * aggregate's version number to prevent concurrent modification conflicts.
   *
   * @param document The Document aggregate instance to persist.
   * @throws {ConcurrentModificationError} if the version in the database does not match the version of the aggregate.
   */
  save(document: Document): Promise<void>;

  /**
   * Saves multiple Document aggregates within a single transaction.
   * If any one of the saves fails, the entire transaction should be rolled back.
   *
   * @param documents An array of Document aggregate instances to persist.
   */
  saveMany(documents: Document[]): Promise<void>;

  /**
   * Finds a single Document aggregate by its unique identifier.
   * This method should always return the full, consistent aggregate root, ready to
   * perform business operations.
   *
   * @param id The DocumentId of the aggregate.
   * @returns A promise resolving to the Document aggregate or null if not found.
   */
  findById(id: DocumentId): Promise<Document | null>;

  /**
   * Finds multiple Document aggregates by their unique identifiers (batch fetch).
   *
   * @param ids An array of DocumentIds.
   * @returns A promise resolving to an array of found Document aggregates.
   */
  findByIds(ids: DocumentId[]): Promise<Document[]>;

  /**
   * Deletes a document record permanently from the persistence store.
   * This is a hard-delete operation and should be used with caution, typically for
   * GDPR compliance or other legal requirements.
   *
   * @param id The DocumentId of the aggregate to delete.
   */
  hardDelete(id: DocumentId): Promise<void>;
}
