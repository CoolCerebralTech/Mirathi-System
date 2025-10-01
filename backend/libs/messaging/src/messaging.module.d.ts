import { DynamicModule } from '@nestjs/common';
export declare class MessagingModule {
    /**
     * Configures the MessagingModule for a specific service.
     * This is the entry point for using the messaging system.
     *
     * @param config An object containing the queue name for the service.
     */
    static register(config: {
        queue?: string;
    }): DynamicModule;
}
//# sourceMappingURL=messaging.module.d.ts.map