accounts-service/
└── src/
    ├── 1_presentation/       (The API Layer)
    │   ├── controllers/
    │   │   └── accounts.controller.ts
    │   ├── health/
    │   │   └── health.controller.ts
    │   └── accounts.module.ts
    │
    ├── 2_application/        (The Use Case Layer)
    │   ├── services/
    │   │   └── accounts.service.ts
    │   ├── dtos/
    │   │   ├── auth.dto.ts
    │   │   └── user.dto.ts
    │   └── mappers/
    │       └── user.mapper.ts
    │
    ├── 3_domain/             (The Core Business Logic Layer)
    │   ├── models/           (or aggregates)
    │   │   └── user.model.ts
    │   ├── value-objects/
    │   │   ├── email.vo.ts
    │   │   └── password.vo.ts
    │   ├── interfaces/       (or ports)
    │   │   └── user.repository.interface.ts
    │   └── events/
    │       └── user-created.event.ts
    │
    └── 4_infrastructure/     (The Technical Details Layer)
        └──
            ├── repositories/
            │   └── prisma-user.repository.ts
            └── entities/
                └── user.entity.ts (Prisma types can act as this)