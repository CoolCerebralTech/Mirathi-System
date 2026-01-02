// src/presentation/presentation.module.ts
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

import { ApplicationModule } from '../application/application.module';
import { HealthController } from './controllers/health.controller';
import { DateTimeScalar } from './graphql/scalars/date-time.scalar';
import { PhoneNumberScalar } from './graphql/scalars/phone-number.scalar';
import {
  StatisticsPresenterMapper,
  UserIdentityPresenterMapper,
  UserPresenterMapper,
  UserProfilePresenterMapper,
  UserSettingsPresenterMapper,
} from './mappers';
import { AdminResolver, AuthResolver, UserResolver } from './resolvers';

// <--- IMPORT

/**
 * Presentation Module
 *
 * Configures GraphQL and wires resolvers/controllers with application services.
 */
@Module({
  imports: [
    ApplicationModule,
    // Note: ObservabilityModule (providing HealthService) is likely Global.
    // If not, import it here or in AccountModule.

    GraphQLModule.forRoot<ApolloDriverConfig>({
      // ... (your existing config)
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/presentation/graphql/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        if (process.env.NODE_ENV === 'production') {
          return {
            message: error.message,
            extensions: {
              code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
            },
          };
        }
        return error;
      },
    }),
  ],
  controllers: [
    HealthController, // <--- REGISTER CONTROLLER
  ],
  providers: [
    // Scalars
    DateTimeScalar,
    PhoneNumberScalar,

    // Mappers
    UserPresenterMapper,
    UserIdentityPresenterMapper,
    UserProfilePresenterMapper,
    UserSettingsPresenterMapper,
    StatisticsPresenterMapper,

    // Resolvers
    AuthResolver,
    UserResolver,
    AdminResolver,
  ],
  exports: [UserPresenterMapper],
})
export class PresentationModule {}
