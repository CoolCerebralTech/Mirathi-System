import { Strategy } from 'passport-local';
import { User } from '@shamba/database';
export interface IAuthService {
    validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null>;
}
declare const LocalStrategy_base: new (...args: [] | [options: import("passport-local").IStrategyOptionsWithRequest] | [options: import("passport-local").IStrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: IAuthService);
    /**
     * This method is called by Passport when a user attempts to log in.
     * It delegates the actual email/password validation to the AuthService.
     */
    validate(email: string, password: string): Promise<Omit<User, 'password'>>;
}
export {};
//# sourceMappingURL=local.strategy.d.ts.map