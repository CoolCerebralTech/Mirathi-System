import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ShambaEvent } from '@shamba/common';
import { BrokerHealth, PublishOptions } from './interfaces/messaging.interface';
export declare class MessagingService implements OnModuleInit, OnModuleDestroy {
    private readonly client;
    private readonly logger;
    private isConnected;
    constructor(client: ClientProxy);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    emit<T extends ShambaEvent>(event: T, options?: PublishOptions): void;
    getHealth(): BrokerHealth;
}
//# sourceMappingURL=messaging.service.d.ts.map