accounts-service/
└── src/
    ├── 1_presentation/       (The API Layer)
    │   ├── controllers/
    │   │   └── admin.controller.ts, user.controller.ts, auth.controller.ts
    │   ├── health/
    │   │   └── health.controller.ts, health.module.ts
    │
    │
    ├── 2_application/        (The Use Case Layer)
    │   ├── services/
    │   │   └── admin.service.ts, auth.service.ts, user.service.ts
    │   ├── dtos/
    │   │   ├── auth.dto.ts, profile.dto.ts
    │   │   └── user.dto.ts, token.dto.ts
    │   └── mappers/
    │       └── user.mapper.ts,auth.mapper.ts, profile.mapper.ts,token.mapper.ts
    │
    ├── 3_domain/             (The Core Business Logic Layer)
    │   ├── models/           (or aggregates)
    │   │   └── user.model.ts, token.model.ts,user-profile.model.ts
    │   ├── value-objects/
    │   │   ├── email.vo.ts
    │   │   └── password.vo.ts, phone-number.vo.ts
    │   ├── interfaces/       (or ports)
    │   │   └── repository.interface.ts, services.interface.ts
    │   └── events/
    │       └── index.ts
    │
    └── 4_infrastructure/     (The Technical Details Layer)
        └── persistence
            |   mappers/  user.mapper.ts, token.mapper.ts           
            ├── repositories/
            │   └── user.repository.ts, token.repository.ts
            └── entities/
                └── account.entity.ts (Prisma types can act as this)