import { DynamicModule } from '@nestjs/common';
export declare class ObservabilityModule {
    /**
     * Configures and registers all observability features for a service.
     * @param config An object containing the service's name and version.
     */
    static register(config: {
        serviceName: string;
        version: string;
    }): DynamicModule;
}
//# sourceMappingURL=observability.module.d.ts.map