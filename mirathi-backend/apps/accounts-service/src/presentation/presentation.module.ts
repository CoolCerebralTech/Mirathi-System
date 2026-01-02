import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
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

@Module({
  imports: [
    ApplicationModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/presentation/graphql/schema.gql'),
      sortSchema: true,

      // ✅ APOLLO 5 CONFIG
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],

      // ❌ REMOVE THIS (We went back to root path)
      // useGlobalPrefix: true,

      // ✅ FIX FOR PLAYGROUND BEHIND PROXY
      // This allows the playground to load correctly even if accessed via /api/accounts/graphql
      path: '/graphql',

      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
      formatError: (error) => {
        // ... keep your error formatting
        return error;
      },
    }),
  ],
  controllers: [HealthController],
  providers: [
    DateTimeScalar,
    PhoneNumberScalar,
    UserPresenterMapper,
    UserIdentityPresenterMapper,
    UserProfilePresenterMapper,
    UserSettingsPresenterMapper,
    StatisticsPresenterMapper,
    AuthResolver,
    UserResolver,
    AdminResolver,
  ],
  exports: [UserPresenterMapper],
})
export class PresentationModule {}
