import { OnModuleInit } from '@nestjs/common';
export declare class MetricsModule implements OnModuleInit {
    private static readonly logger;
    /**
     * Configures the shared MetricsModule.
     * This should be imported once in the root module of each microservice.
     */
    static register(config: {
        serviceName: string;
        version: string;
    }): any;
    onModuleInit(): void;
}
//# sourceMappingURL=metrics.module.d.ts.map