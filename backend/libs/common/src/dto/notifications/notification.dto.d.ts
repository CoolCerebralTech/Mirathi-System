import { NotificationStatus, NotificationChannel } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';
/**
 * Defines the query parameters for filtering a list of notifications.
 */
export declare class NotificationQueryDto extends PaginationQueryDto {
    status?: NotificationStatus;
    channel?: NotificationChannel;
}
/**
 * Defines the shape of a single Notification object returned by the API.
 */
export declare class NotificationResponseDto extends BaseResponseDto {
    channel: NotificationChannel;
    status: NotificationStatus;
    sentAt?: Date | null;
    failReason?: string | null;
    recipientId: string;
    templateName: string;
}
//# sourceMappingURL=notification.dto.d.ts.map