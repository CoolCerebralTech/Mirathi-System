import { Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { JwtPayload } from '../interfaces/auth.interface';
declare const JwtStrategy_base: new (...args: [opt: StrategyOptions] | [opt: StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    /**
     * This method is called by Passport after it has successfully verified
     * the JWT's signature and expiration. Its job is to perform any additional
     * validation and return the payload that will be attached to `request.user`.
     */
    validate(payload: JwtPayload): Promise<JwtPayload>;
}
export {};
//# sourceMappingURL=jwt.strategy.d.ts.map