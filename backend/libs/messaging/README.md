# @shamba/messaging

Event-driven messaging system for Shamba Sure microservices using RabbitMQ.

## Features

- RabbitMQ-based message bus
- Event publishing and subscription
- Request-response pattern support
- Dead letter queue handling
- Connection resilience with retry logic
- Type-safe event handling
- Decorator-based event registration

## Usage

```typescript
import { 
  MessagingModule, 
  MessagingService, 
  EventHandler,
  EventType 
} from '@shamba/messaging';

@Module({
  imports: [MessagingModule.forRoot()],
})
export class AppModule {}

// Publishing events
@Injectable()
export class UserService {
  constructor(private messagingService: MessagingService) {}

  async createUser(userData: CreateUserDto) {
    // Create user logic...
    
    // Publish event
    await this.messagingService.publish(EventType.USER_CREATED, {
      userId: user.id,
      email: user.email,
      // ... other data
    });
  }
}

// Subscribing to events
@Injectable()
export class NotificationService {
  @EventHandler(EventType.USER_CREATED, { queue: 'notifications.user_created' })
  async handleUserCreated(data: any, envelope: MessageEnvelope) {
    // Send welcome email
    await this.emailService.sendWelcomeEmail(data.email);
  }
}