# @shamba/observability

Comprehensive observability library for Shamba Sure platform.

## Features

- **Structured logging** with Pino
- **Metrics collection** with Prometheus
- **Health checks** with Terminus
- **Distributed tracing** with OpenTelemetry
- **Performance monitoring**
- **Request/response logging**

## Usage

```typescript
import { 
  ObservabilityModule,
  LoggerService,
  MetricsService,
  TrackPerformance 
} from '@shamba/observability';

@Module({
  imports: [ObservabilityModule.forRoot()],
})
export class AppModule {}

@Injectable()
export class UserService {
  constructor(
    private logger: LoggerService,
    private metrics: MetricsService,
  ) {}

  @TrackPerformance('createUser')
  async createUser(userData: CreateUserDto) {
    this.logger.info('Creating user', 'UserService', { email: userData.email });
    
    // Business logic...
    
    this.metrics.recordUserRegistration(userData.role);
  }
}