import { Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@shamba/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interfaces/auth.interface';
declare const RefreshTokenStrategy_base: new (...args: [opt: StrategyOptions] | [opt: StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private readonly configService;
    constructor(configService: ConfigService);
    /**
     * This method is called by Passport after it has successfully verified
     * the refresh token's signature and expiration.
     */
    validate(req: Request, payload: RefreshTokenPayload): any;
}
export {};
//# sourceMappingURL=refresh-token.strategy.d.ts.map