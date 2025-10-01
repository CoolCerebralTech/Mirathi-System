import { EventPattern } from '../../enums';
import { UserRole, WillStatus, DocumentStatus, AssetType } from '@shamba/database';
/**
 * The base structure for all events published within the Shamba Sure ecosystem.
 */
export interface BaseEvent<T extends EventPattern, D> {
    /** The unique type identifier for the event. */
    type: T;
    /** The ISO 8601 timestamp when the event was generated. */
    timestamp: Date;
    /** The version of this event's data schema. */
    version: '1.0';
    /** The name of the microservice that published the event (e.g., "accounts-service"). */
    source: string;
    /** A unique ID for tracing a request's flow across multiple services. */
    correlationId?: string;
    /** The actual data payload of the event. */
    data: D;
}
export interface UserCreatedData {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}
export interface UserUpdatedData {
    userId: string;
    profile?: {
        bio?: string | null;
        phoneNumber?: string | null;
    };
}
export interface PasswordResetRequestedData {
    userId: string;
    email: string;
    firstName: string;
    resetToken: string;
}
export interface WillCreatedData {
    willId: string;
    testatorId: string;
    title: string;
    status: WillStatus;
}
export interface AssetCreatedData {
    assetId: string;
    ownerId: string;
    name: string;
    type: AssetType;
}
export interface DocumentUploadedData {
    documentId: string;
    uploaderId: string;
    filename: string;
    status: DocumentStatus;
}
export interface DocumentVerifiedData {
    documentId: string;
    uploaderId: string;
    filename: string;
    status: DocumentStatus;
}
export type UserCreatedEvent = BaseEvent<EventPattern.USER_CREATED, UserCreatedData>;
export type UserUpdatedEvent = BaseEvent<EventPattern.USER_UPDATED, UserUpdatedData>;
export type PasswordResetRequestedEvent = BaseEvent<EventPattern.PASSWORD_RESET_REQUESTED, PasswordResetRequestedData>;
export type WillCreatedEvent = BaseEvent<EventPattern.WILL_CREATED, WillCreatedData>;
export type DocumentVerifiedEvent = BaseEvent<EventPattern.DOCUMENT_VERIFIED, DocumentVerifiedData>;
export type DocumentUploadedEvent = BaseEvent<EventPattern.DOCUMENT_UPLOADED, DocumentUploadedData>;
export type AssetCreatedEvent = BaseEvent<EventPattern.ASSET_CREATED, AssetCreatedData>;
export type ShambaEvent = UserCreatedEvent | UserUpdatedEvent | PasswordResetRequestedEvent | DocumentUploadedEvent | WillCreatedEvent | DocumentVerifiedEvent | AssetCreatedEvent;
//# sourceMappingURL=index.d.ts.map