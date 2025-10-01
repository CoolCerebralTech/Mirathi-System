import { UserRole } from '../../enums';
import { BaseResponseDto } from '../shared/base.response.dto';
export declare class LoginRequestDto {
    email: string;
    password: string;
}
export declare class RegisterRequestDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: UserRole;
}
export declare class ChangePasswordRequestDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ResetPasswordRequestDto {
    token: string;
    newPassword: string;
}
export declare class ForgotPasswordRequestDto {
    email: string;
}
/**
 * Defines the shape of the User object returned upon successful authentication.
 */
declare class AuthUserResponseDto extends BaseResponseDto {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}
/**
 * Defines the response body for a successful login or registration.
 */
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: AuthUserResponseDto;
}
export {};
//# sourceMappingURL=auth.dto.d.ts.map