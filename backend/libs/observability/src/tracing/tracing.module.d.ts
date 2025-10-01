import { DynamicModule, OnApplicationShutdown } from '@nestjs/common';
export declare class TracingModule implements OnApplicationShutdown {
    private static readonly logger;
    /**
     * Configures and initializes the OpenTelemetry SDK for the application.
     * This should be imported once in the root module of each microservice.
     */
    static register(config: {
        serviceName: string;
        version: string;
    }): DynamicModule;
    /**
     * Gracefully shuts down the SDK when the NestJS application closes.
     */
    onApplicationShutdown(signal?: string): Promise<void>;
}
//# sourceMappingURL=tracing.module.d.ts.map