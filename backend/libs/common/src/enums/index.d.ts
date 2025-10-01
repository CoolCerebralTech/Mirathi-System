export { UserRole, RelationshipType, WillStatus, AssetType, DocumentStatus, NotificationChannel, NotificationStatus, } from '@shamba/database';
export declare enum EventPattern {
    USER_CREATED = "accounts.user.created",
    USER_UPDATED = "accounts.user.updated",
    USER_DELETED = "accounts.user.deleted",
    PASSWORD_RESET_REQUESTED = "accounts.password.reset_requested",
    WILL_CREATED = "succession.will.created",
    WILL_ACTIVATED = "succession.will.activated",
    ASSET_CREATED = "succession.asset.created",
    HEIR_ASSIGNED = "succession.heir.assigned",
    DOCUMENT_UPLOADED = "documents.document.uploaded",
    DOCUMENT_VERIFIED = "documents.document.verified"
}
export declare enum ErrorCode {
    VALIDATION_FAILED = 1000,
    UNKNOWN_ERROR = 1999,
    UNAUTHENTICATED = 2000,
    INVALID_CREDENTIALS = 2001,
    JWT_EXPIRED = 2002,
    JWT_INVALID = 2003,
    FORBIDDEN = 2004,
    NOT_FOUND = 3000,
    CONFLICT = 3001,// e.g., email already exists
    INVALID_OPERATION = 4000,
    SERVICE_UNAVAILABLE = 5000
}
//# sourceMappingURL=index.d.ts.map