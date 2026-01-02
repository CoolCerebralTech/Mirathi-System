domain/
├── aggregates/           # ✅ Complete
│   └── user.aggregate.ts
├── entities/             # ✅ Complete
│   ├── user-identity.entity.ts
│   ├── user-profile.entity.ts
│   └── user-settings.entity.ts
├── value-objects/        # ✅ Complete
│   ├── base.vo.ts
│   ├── phone-number.vo.ts
│   ├── county.vo.ts
│   ├── timestamp.vo.ts
│   └── contact-info.vo.ts
├── events/              # ✅ Complete
│   ├── domain-event.ts
│   ├── user-registered.event.ts
│   ├── identity-linked.event.ts
│   ├── profile-updated.event.ts
│   ├── phone-verified.event.ts
│   ├── user-suspended.event.ts
│   ├── user-deleted.event.ts
│   └── role-changed.event.ts
├── invariants/          # ✅ Complete
│   └── user.invariants.ts
├── errors/              # ✅ Complete
│   └── domain.errors.ts
├── ports/               # ✅ Complete
│   ├── user.repository.port.ts
│   ├── oauth-provider.port.ts
│   └── sms-provider.port.ts
├── services/            # ✅ Complete
│   └── phone-verification.domain-service.ts
└── index.ts            # ✅ Complete

src/application/
│
├── commands/                           # Write Operations (State Changes)
│   ├── handlers/
│   │   ├── auth/
│   │   │   ├── register-user-via-oauth.handler.ts
│   │   │   ├── link-identity.handler.ts
│   │   │   └── complete-onboarding.handler.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── update-profile.handler.ts
│   │   │   └── update-phone-number.handler.ts
│   │   │
│   │   ├── settings/
│   │   │   └── update-settings.handler.ts
│   │   │
│   │   └── admin/
│   │       ├── activate-user.handler.ts
│   │       ├── suspend-user.handler.ts
│   │       ├── unsuspend-user.handler.ts
│   │       ├── change-user-role.handler.ts
│   │       ├── delete-user.handler.ts
│   │       └── restore-user.handler.ts
│   │
│   └── impl/                           # Command DTOs
│       ├── auth/
│       │   ├── register-user-via-oauth.command.ts
│       │   ├── link-identity.command.ts
│       │   └── complete-onboarding.command.ts
│       │
│       ├── profile/
│       │   ├── update-profile.command.ts
│       │   └── update-phone-number.command.ts
│       │
│       ├── settings/
│       │   └── update-settings.command.ts
│       │
│       └── admin/
│           ├── activate-user.command.ts
│           ├── suspend-user.command.ts
│           ├── unsuspend-user.command.ts
│           ├── change-user-role.command.ts
│           ├── delete-user.command.ts
│           └── restore-user.command.ts
│
├── queries/                            # Read Operations (No State Changes)
│   ├── handlers/
│   │   ├── get-user-by-id.handler.ts
│   │   ├── get-user-by-email.handler.ts
│   │   ├── get-user-by-phone.handler.ts
│   │   ├── get-current-user.handler.ts
│   │   ├── search-users.handler.ts          # Admin only
│   │   ├── get-user-statistics.handler.ts   # Admin only
│   │   └── list-users-paginated.handler.ts  # Admin only
│   │
│   └── impl/
│       ├── get-user-by-id.query.ts
│       ├── get-user-by-email.query.ts
│       ├── get-user-by-phone.query.ts
│       ├── get-current-user.query.ts
│       ├── search-users.query.ts
│       ├── get-user-statistics.query.ts
│       └── list-users-paginated.query.ts
│
├── events/                             # Domain Event Handlers
│   ├── handlers/
│   │   ├── user-registered.handler.ts
│   │   ├── profile-updated.handler.ts
│   │   ├── user-suspended.handler.ts
│   │   ├── user-deleted.handler.ts
│   │   └── role-changed.handler.ts
│   │
│   └── event-publisher.service.ts      # Publishes to RabbitMQ via @shamba/messaging
│
├── services/                           # Application Services (Orchestration)
│   ├── user.service.ts                 # Main user orchestration
│   ├── oauth-auth.service.ts           # OAuth flow orchestration
│   └── user-admin.service.ts           # Admin operations orchestration
│
├── validators/                         # Input validation (separate from domain)
│   ├── user-input.validator.ts
│   ├── phone-number-input.validator.ts
│   └── county-input.validator.ts
│
├── exceptions/                         # Application-specific exceptions
│   ├── user-not-found.exception.ts
│   ├── duplicate-email.exception.ts
│   ├── duplicate-phone.exception.ts
│   ├── unauthorized-operation.exception.ts
│   └── oauth-provider.exception.ts
│
└── application.module.ts               # Main application module

src/presentation/
│
├── graphql/
│   ├── schema.graphql                 # GraphQL Schema Definition (SDL)
│   └── scalars/                       # Custom Scalars
│       ├── date-time.scalar.ts
│       ├── phone-number.scalar.ts
│       └── index.ts
│
├── resolvers/
│   ├── auth.resolver.ts               # Auth: Login, Register, OAuth
│   ├── user.resolver.ts               # User: Profile, Settings, Queries
│   ├── admin.resolver.ts              # Admin: User management
│   └── index.ts
│
├── dtos/
│   ├── inputs/                        # GraphQL Input Types
│   │   ├── auth/
│   │   │   ├── oauth-callback.input.ts
│   │   │   └── complete-onboarding.input.ts
│   │   ├── user/
│   │   │   ├── update-profile.input.ts
│   │   │   ├── update-phone.input.ts
│   │   │   └── update-settings.input.ts
│   │   ├── admin/
│   │   │   ├── suspend-user.input.ts
│   │   │   ├── change-role.input.ts
│   │   │   ├── search-users.input.ts
│   │   │   └── list-users.input.ts
│   │   └── index.ts
│   │
│   └── outputs/                       # GraphQL Object Types
│       ├── user.output.ts             # UserOutput (main type)
│       ├── user-profile.output.ts
│       ├── user-settings.output.ts
│       ├── user-identity.output.ts
│       ├── auth-response.output.ts    # OAuth response
│       ├── paginated-users.output.ts
│       ├── user-statistics.output.ts
│       └── index.ts
│
├── mappers/
│   ├── user-presenter.mapper.ts       # Domain User → GraphQL Output
│   ├── profile-presenter.mapper.ts
│   ├── settings-presenter.mapper.ts
│   └── index.ts
│
├── guards/
│   ├── gql-auth.guard.ts             # JWT guard for GraphQL
│   ├── gql-roles.guard.ts            # Roles guard for GraphQL
│   └── index.ts
│
├── decorators/
│   ├── current-user.decorator.ts     # @CurrentUser() for resolvers
│   ├── roles.decorator.ts            # @Roles() for RBAC
│   └── index.ts
│
├── filters/
│   └── graphql-exception.filter.ts   # Global error handling
│
└── presentation.module.ts            # Main presentation module