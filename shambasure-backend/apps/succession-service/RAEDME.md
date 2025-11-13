# Succession Service - DDD Architecture

```
succession-service/
└── src/
    ├── 1_presentation/              # API Layer (Controllers & HTTP)
    │   ├── controllers/
    │   │   ├── family.controller.ts           # Family & relationship management
    │   │   ├── asset.controller.ts            # Asset CRUD & valuation
    │   │   ├── will.controller.ts             # Will lifecycle management
    │   │   ├── beneficiary.controller.ts      # Beneficiary assignments
    │   │   ├── executor.controller.ts         # Executor management
    │   │   ├── witness.controller.ts          # Witness management
    │   │   ├── guardian.controller.ts         # Guardian assignments
    │   │   ├── dispute.controller.ts          # Dispute handling
    │   │   └── succession.controller.ts       # Estate distribution workflow
    │   │
    │   ├── health/
    │   │   ├── health.controller.ts
    │   │   └── health.module.ts
    │   │
    │   └── filters/                           # Exception handling
    │       └── succession-exception.filter.ts
    │
    ├── 2_application/               # Use Case Layer (Business Orchestration)
    │   ├── services/
    │   │   ├── family.service.ts              # Family tree operations
    │   │   ├── asset.service.ts               # Asset management logic
    │   │   ├── will.service.ts                # Will creation, activation, execution
    │   │   ├── beneficiary.service.ts         # Beneficiary assignment logic
    │   │   ├── executor.service.ts            # Executor nomination & management
    │   │   ├── witness.service.ts             # Witness signature workflow
    │   │   ├── guardian.service.ts            # Guardian assignment for minors
    │   │   ├── valuation.service.ts           # Asset valuation tracking
    │   │   ├── debt.service.ts                # Debt & liability management
    │   │   ├── dispute.service.ts             # Dispute resolution workflow
    │   │   ├── succession-workflow.service.ts # Estate distribution orchestration
    │   │   └── compliance.service.ts          # Legal validation checks
    │   │
    │   ├── dtos/
    │   │   ├── family.dto.ts                  # Family & member DTOs
    │   │   ├── asset.dto.ts                   # Asset creation, valuation DTOs
    │   │   ├── will.dto.ts                    # Will creation, update DTOs
    │   │   ├── beneficiary.dto.ts             # Beneficiary assignment DTOs
    │   │   ├── executor.dto.ts                # Executor nomination DTOs
    │   │   ├── witness.dto.ts                 # Witness signature DTOs
    │   │   ├── guardian.dto.ts                # Guardian assignment DTOs
    │   │   ├── debt.dto.ts                    # Debt tracking DTOs
    │   │   ├── dispute.dto.ts                 # Dispute filing DTOs
    │   │   └── succession.dto.ts              # Estate distribution DTOs
    │   │
    │   ├── mappers/
    │   │   ├── family.mapper.ts               # Family entity <-> DTO
    │   │   ├── asset.mapper.ts                # Asset entity <-> DTO
    │   │   ├── will.mapper.ts                 # Will entity <-> DTO
    │   │   ├── beneficiary.mapper.ts          # Beneficiary entity <-> DTO
    │   │   └── succession.mapper.ts           # Estate distribution mapping
    │   │
    │   └── validators/                        # Custom validation logic
    │       ├── will.validator.ts              # Will completeness checks
    │       ├── beneficiary.validator.ts       # Share % validation (total = 100%)
    │       ├── executor.validator.ts          # Executor eligibility checks
    │       └── compliance.validator.ts        # Legal requirement validation
    │
    ├── 3_domain/                    # Core Business Logic Layer
    │   ├── aggregates/              # Rich domain models (grouped entities)
    │   │   ├── family/
    │   │   │   ├── family.aggregate.ts        # Family aggregate root
    │   │   │   ├── family-member.entity.ts    # Family member entity
    │   │   │   └── marriage.entity.ts         # Marriage entity
    │   │   │
    │   │   ├── estate/
    │   │   │   ├── will.aggregate.ts          # Will aggregate root
    │   │   │   ├── asset.entity.ts            # Asset entity
    │   │   │   ├── beneficiary.entity.ts      # Beneficiary assignment
    │   │   │   ├── executor.entity.ts         # Executor entity
    │   │   │   ├── witness.entity.ts          # Witness entity
    │   │   │   ├── guardian.entity.ts         # Guardian entity
    │   │   │   └── debt.entity.ts             # Debt entity
    │   │   │
    │   │   └── succession/
    │   │       ├── estate-distribution.aggregate.ts  # Distribution process
    │   │       └── dispute.entity.ts          # Dispute entity
    │   │
    │   ├── value-objects/           # Immutable business concepts
    │   │   ├── share-percentage.vo.ts         # 0-100% with validation
    │   │   ├── asset-valuation.vo.ts          # Value + currency + date
    │   │   ├── relationship.vo.ts             # Relationship type with rules
    │   │   ├── beneficiary-condition.vo.ts    # Conditional bequest logic
    │   │   ├── estate-value.vo.ts             # Total estate worth
    │   │   └── legal-status.vo.ts             # Will status with transitions
    │   │
    │   ├── interfaces/              # Ports (abstractions)
    │   │   ├── repositories/
    │   │   │   ├── family.repository.interface.ts
    │   │   │   ├── asset.repository.interface.ts
    │   │   │   ├── will.repository.interface.ts
    │   │   │   ├── beneficiary.repository.interface.ts
    │   │   │   ├── succession.repository.interface.ts
    │   │   │   └── dispute.repository.interface.ts
    │   │   │
    │   │   └── services/
    │   │       ├── document-verification.interface.ts  # Doc service contract
    │   │       ├── notification.interface.ts           # Notification contract
    │   │       └── audit.interface.ts                  # Audit service contract
    │   │
    │   ├── events/                  # Domain events
    │   │   ├── family.events.ts                # FamilyCreated, MemberAdded
    │   │   ├── asset.events.ts                 # AssetCreated, AssetValued
    │   │   ├── will.events.ts                  # WillCreated, WillActivated, WillExecuted
    │   │   ├── beneficiary.events.ts           # HeirAssigned, BequestCreated
    │   │   ├── succession.events.ts            # EstateDistributed, DisputeFiled
    │   │   └── index.ts                        # Event registry
    │   │
    │   ├── enums/                   # Business enums (re-export from Prisma)
    │   │   └── index.ts                        # All succession enums
    │   │
    │   └── exceptions/              # Domain-specific exceptions
    │       ├── will.exceptions.ts              # WillNotActiveException, etc.
    │       ├── beneficiary.exceptions.ts       # InvalidSharePercentageException
    │       └── succession.exceptions.ts        # EstateNotReadyException
    │
    └── 4_infrastructure/            # Technical Details Layer
        ├── persistence/
        │   ├── mappers/             # Prisma <-> Domain model mapping
        │   │   ├── family.prisma-mapper.ts
        │   │   ├── asset.prisma-mapper.ts
        │   │   ├── will.prisma-mapper.ts
        │   │   ├── beneficiary.prisma-mapper.ts
        │   │   └── succession.prisma-mapper.ts
        │   │
        │   ├── repositories/        # Concrete repository implementations
        │   │   ├── family.repository.ts
        │   │   ├── asset.repository.ts
        │   │   ├── will.repository.ts
        │   │   ├── beneficiary.repository.ts
        │   │   ├── succession.repository.ts
        │   │   └── dispute.repository.ts
        │   │
        │   └── entities/            # Prisma types (from @shamba/database)
        │       └── index.ts                    # Re-export Prisma types
        │
        ├── messaging/               # Event publishing (RabbitMQ)
        │   ├── publishers/
        │   │   ├── family.publisher.ts
        │   │   ├── asset.publisher.ts
        │   │   ├── will.publisher.ts
        │   │   └── succession.publisher.ts
        │   │
        │   └── listeners/           # Event subscribers
        │       ├── user-created.listener.ts    # From accounts-service
        │       └── document-verified.listener.ts # From documents-service
        │
        ├── external-services/       # Adapters for other microservices
        │   ├── document.client.ts              # Calls documents-service
        │   ├── notification.client.ts          # Calls notifications-service
        │   └── audit.client.ts                 # Calls auditing-service
        │
        └── config/
            └── succession.config.ts            # Service-specific config

```

---

## 📁 Key Design Decisions

### **1. Aggregates Over Entities**
- **Family Aggregate**: `Family` + `FamilyMember` + `Marriage` (family cohesion)
- **Estate Aggregate**: `Will` + `Asset` + `Beneficiary` + `Executor` + `Witness` (will management)
- **Succession Aggregate**: `EstateDistribution` + `Dispute` (distribution process)

**Why?** DDD aggregates group related entities that change together. This ensures consistency and reduces complexity.

---

### **2. Value Objects for Business Rules**
- `SharePercentage` - Validates 0-100%, immutable
- `AssetValuation` - Combines value + currency + date as one concept
- `BeneficiaryCondition` - Encapsulates conditional bequest logic
- `LegalStatus` - Will status transitions with validation

---


