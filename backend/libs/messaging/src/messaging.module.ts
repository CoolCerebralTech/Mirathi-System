import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { RabbitMQTransport } from './transports/rabbitmq.transport';
import { MessagingService } from './services/messaging.service';
import { EventRegistryService } from './services/event-registry.service';
import { UserPublisher } from './publishers/user.publisher';
import { AuditConsumer } from './consumers/audit.consumer';

@Global()
@Module({})
export class MessagingModule {
  static forRoot(): DynamicModule {
    return {
      module: MessagingModule,
      imports: [ConfigModule, DatabaseModule],
      providers: [
        RabbitMQTransport,
        MessagingService,
        EventRegistryService,
        UserPublisher,
        AuditConsumer,
      ],
      exports: [
        MessagingService,
        UserPublisher,
        EventRegistryService,
      ],
    };
  }

  static forFeature(consumers: any[] = [], publishers: any[] = []): DynamicModule {
    return {
      module: MessagingModule,
      imports: [ConfigModule],
      providers: [
        ...consumers,
        ...publishers,
        {
          provide: 'REGISTER_CONSUMERS',
          useFactory: (registry: EventRegistryService) => {
            consumers.forEach(consumer => registry.registerConsumer(consumer));
            return null;
          },
          inject: [EventRegistryService],
        },
      ],
      exports: [...publishers],
    };
  }
}