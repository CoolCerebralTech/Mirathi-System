import { NotificationChannel } from '../../enums';
import { PaginationQueryDto } from '../shared/pagination.dto';
export declare class CreateTemplateRequestDto {
    name: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    variables: string[];
    isActive?: boolean;
}
export declare class UpdateTemplateRequestDto {
    name?: string;
    subject?: string;
    body?: string;
    variables?: string[];
    isActive?: boolean;
}
export declare class TemplateQueryDto extends PaginationQueryDto {
    channel?: NotificationChannel;
}
//# sourceMappingURL=template.dto.d.ts.map