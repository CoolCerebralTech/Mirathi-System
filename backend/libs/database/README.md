# @shamba/database

Database layer for Shamba Sure platform using Prisma ORM.

## Features

- Type-safe database operations
- Connection pooling and management
- Health checks and monitoring
- Transaction support with retry logic
- Migration management
- Seed data for development

## Usage

```typescript
import { DatabaseModule, PrismaService } from '@shamba/database';

@Module({
  imports: [DatabaseModule],
  providers: [YourService],
})
export class YourModule {}

// In your service
constructor(private prisma: PrismaService) {}

async yourMethod() {
  return this.prisma.user.findMany();
}