import { UserRole } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
import { PaginationQueryDto } from '../shared/pagination.dto';
declare class AddressDto {
    street?: string;
    city?: string;
    postCode?: string;
    country?: string;
}
declare class NextOfKinDto {
    fullName: string;
    relationship: string;
    phoneNumber: string;
}
export declare class UpdateUserRequestDto {
    firstName?: string;
    lastName?: string;
    email?: string;
}
export declare class UpdateUserProfileRequestDto {
    bio?: string;
    phoneNumber?: string;
    address?: AddressDto;
    nextOfKin?: NextOfKinDto;
}
/**
 * Defines the query parameters for filtering a list of users.
 * Extends the base PaginationQueryDto.
 */
export declare class UserQueryDto extends PaginationQueryDto {
    role?: UserRole;
}
declare class UserProfileResponseDto {
    bio?: string;
    phoneNumber?: string;
    address?: object;
    nextOfKin?: object;
}
export declare class UserResponseDto extends BaseResponseDto {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profile?: UserProfileResponseDto;
}
export {};
//# sourceMappingURL=user.dto.d.ts.map