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

src/account-service/src/application/user/
│
├── commands/                          # ⚡ WRITE SIDE (state changes)
│   ├── dtos/                          # Input DTOs (validated in handlers)
│   │   ├── register-user.dto.ts
│   │   ├── link-identity.dto.ts
│   │   ├── update-profile.dto.ts
│   │   ├── verify-phone.dto.ts
│   │   ├── update-settings.dto.ts
│   │   └── admin-suspend-user.dto.ts
│   │
│   ├── handlers/                      # Business logic orchestration
│   │   ├── register-user.handler.ts
│   │   ├── link-identity.handler.ts
│   │   ├── update-profile.handler.ts
│   │   ├── verify-phone.handler.ts
│   │   ├── update-settings.handler.ts
│   │   └── suspend-user.handler.ts
│   │
│   └── impl/                          # Command objects (The "What")
│       ├── register-user.command.ts
│       ├── link-identity.command.ts
│       ├── update-profile.command.ts
│       ├── verify-phone.command.ts
│       ├── update-settings.command.ts
│       └── suspend-user.command.ts
│
├── queries/                           # 🔍 READ SIDE
│   ├── dtos/                          # Input DTOs for queries
│   │   ├── get-user.dto.ts
│   │   ├── list-sessions.dto.ts
│   │   └── get-audit-log.dto.ts
│   │
│   ├── handlers/                      # Query handlers
│   │   ├── get-user.handler.ts
│   │   ├── list-sessions.handler.ts
│   │   └── get-audit-log.handler.ts
│   │
│   ├── impl/                          # Query objects (The "What")
│   │   ├── get-user.query.ts
│   │   ├── list-sessions.query.ts
│   │   └── get-audit-log.query.ts
│   │
│   └── view-models/                   # Read models for UI
│       ├── user-summary.vm.ts
│       ├── user-detail.vm.ts
│       ├── session.vm.ts
│       └── audit-log.vm.ts
│
├── services/                          # Application orchestration / domain bridges
│   ├── auth.service.ts                # OAuth orchestration
│   ├── phone-verification.service.ts  # Bridges to Domain Service
│   └── audit.service.ts               # Login history / auditing
│
├── events/                            # Event subscribers (side-effects)
│   ├── user-registered.subscriber.ts
│   ├── profile-updated.subscriber.ts
│   └── phone-verified.subscriber.ts
│
└── interfaces/                        # Ports to external systems
    ├── oauth-provider.interface.ts
    └── sms-provider.interface.ts

src/account-service/src/presentation/user/
│
├── controllers/                       #  GraphQL
│   ├── user.command.controller.ts     # Handles commands (write)
│   └── user.query.controller.ts       # Handles queries (read)
│
├── dtos/
│   ├── request/                       # API input (validated)
│   │   ├── register-user.request.dto.ts
│   │   ├── update-profile.request.dto.ts
│   │   ├── verify-phone.request.dto.ts
│   │   ├── update-settings.request.dto.ts
│   │   └── suspend-user.request.dto.ts
│   │
│   └── response/                      # API output
│       ├── user-summary.response.dto.ts
│       ├── user-detail.response.dto.ts
│       ├── session.response.dto.ts
│       └── audit-log.response.dto.ts
│
└── mappers/                           # Presentation → Application → Domain
    └── user-presenter.mapper.ts       # Converts VM / DTOs
