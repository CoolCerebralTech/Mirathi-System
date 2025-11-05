export { DomainEvent } from './base.event';

// Core Document Lifecycle Events
export { DocumentUploadedEvent } from './document-uploaded.event';
export { DocumentVerifiedEvent } from './document-verified.event';
export { DocumentRejectedEvent } from './document-rejected.event';
export { DocumentVersionedEvent } from './document-versioned.event';
export { DocumentDeletedEvent } from './document-deleted.event';

// Security & Access Events
export { DocumentDownloadedEvent } from './document-downloaded.event';
export { DocumentViewedEvent } from './document-viewed.event';
export { DocumentSharedEvent } from './document-shared.event';

// Workflow & Business Events
export { DocumentExpiredEvent } from './document-expired.event';
export { DocumentRestoredEvent } from './document-restored.event';

// Metadata & Configuration Events
export { DocumentMetadataUpdatedEvent } from './document-metadata-updated.event';
export { DocumentVisibilityChangedEvent } from './document-visibility-changed.event';

// System & Integration Events
export { DocumentStorageMigratedEvent } from './document-storage-migrated.event';
