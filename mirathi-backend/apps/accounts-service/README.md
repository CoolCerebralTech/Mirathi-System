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

src/account-service/src/
├── domain/                           # ✅ Already done (Complete)
│   ├── aggregates/
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   ├── invariants/
│   ├── errors/
│   ├── ports/                       # ✅ UserRepositoryPort, OAuthProviderPort, SmsProviderPort
│   └── services/
│
├── application/
│   ├── user/                        # Focus on User use cases
│   │   ├── commands/                # ⚡ WRITE operations
│   │   │   ├── register-user.command.ts
│   │   │   ├── update-profile.command.ts
│   │   │   ├── verify-phone.command.ts
│   │   │   ├── update-settings.command.ts
│   │   │   ├── link-identity.command.ts
│   │   │   └── suspend-user.command.ts
│   │   │
│   │   ├── queries/                 # 🔍 READ operations
│   │   │   ├── get-user.query.ts
│   │   │   ├── list-sessions.query.ts
│   │   │   └── get-audit-log.query.ts
│   │   │
│   │   ├── handlers/                # Command/Query handlers
│   │   │   ├── register-user.handler.ts
│   │   │   ├── update-profile.handler.ts
│   │   │   ├── verify-phone.handler.ts
│   │   │   ├── update-settings.handler.ts
│   │   │   ├── link-identity.handler.ts
│   │   │   ├── suspend-user.handler.ts
│   │   │   ├── get-user.handler.ts
│   │   │   ├── list-sessions.handler.ts
│   │   │   └── get-audit-log.handler.ts
│   │   │
│   │   └── services/                # Application services (coordination)
│   │       ├── auth.service.ts      # OAuth flow coordination
│   │       ├── phone-verification.service.ts  # OTP coordination
│   │       └── audit.service.ts     # Audit coordination
│   │
│   └── admin/                       # Admin-specific use cases
│       ├── commands/
│       │   ├── change-role.command.ts
│       │   └── bulk-suspend.command.ts
│       └── handlers/
│           ├── change-role.handler.ts
│           └── bulk-suspend.handler.ts
│
├── infrastructure/
│   ├── persistence/                 # Database implementations
│   │   ├── repositories/
│   │   │   └── user.repository.ts   # Implements UserRepositoryPort
│   │   └── mappers/
│   │       └── user.mapper.ts       # Domain ↔ Database mapping
│   │
│   ├── adapters/                    # External service implementations
│   │   ├── oauth/
│   │   │   ├── google.adapter.ts    # Implements OAuthProviderPort
│   │   │   ├── apple.adapter.ts
│   │   │   └── oauth-adapter.factory.ts
│   │   └── sms/
│   │       ├── safaricom.adapter.ts # Implements SmsProviderPort
│   │       └── africastalking.adapter.ts
│   │
│   └── security/                    # Security implementations
│       └── jwt.strategy.ts          # Uses auth lib
│
