// domain/events/family-events/index.ts
export { FamilyMemberCreatedEvent } from './family-member-created.event';
export { FamilyMemberDeceasedEvent } from './family-member-deceased.event';
export { FamilyMemberPersonalInfoUpdatedEvent } from './family-member-personal-info-updated.event';
export { FamilyMemberContactInfoUpdatedEvent } from './family-member-contact-info-updated.event';
export {
  FamilyMemberIdentityVerifiedEvent,
  IdentityDocumentType,
} from './family-member-identity-verified.event';
export { FamilyMemberDisabilityStatusUpdatedEvent } from './family-member-disability-status-updated.event';
export { FamilyMemberPolygamousHouseAssignedEvent } from './family-member-polygamous-house-assigned.event';
export { FamilyMemberMissingStatusChangedEvent } from './family-member-missing-status-changed.event';
export { FamilyMemberArchivedEvent } from './family-member-archived.event';
export { FamilyMemberAgeRecalculatedEvent } from './family-member-age-recalculated.event';
export { FamilyMemberDependencyStatusAssessedEvent } from './family-member-dependency-status-assessed.event';
export { FamilyMemberS40PolygamousStatusChangedEvent } from './family-member-s40-polygamous-status-changed.event';
