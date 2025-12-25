src/family-service/src/domain/
│
├── aggregates/
│   ├── family.aggregate.ts            # [ROOT] Kinship Graph & S.40 Houses
│   └── guardianship.aggregate.ts      # [ROOT] Care Authority (Children Act)
│
├── entities/
│   // --- Owned by FAMILY Aggregate ---
│   ├── family-member.entity.ts        # Identity & Vital Status
│   ├── marriage.entity.ts             # Union (Civil/Customary/Islamic)
│   ├── polygamous-house.entity.ts     # S.40 Unit (Wife + Kids)
│   ├── family-relationship.entity.ts  # Biological/Legal Edges
│   ├── cohabitation-record.entity.ts  # "Come-we-stay" facts
│   ├── adoption-record.entity.ts      # Legal adoption
│
│   // --- Owned by GUARDIANSHIP Aggregate ---
│   ├── guardian-assignment.entity.ts  # The Actor (User/Member)
│   ├── compliance-check.entity.ts     # Annual Welfare Reports
│
├── value-objects/
│   ├── person-name.vo.ts
│   ├── kenyan-identity.vo.ts          # ID Validation
│   ├── family-enums.vo.ts             # Enums
│   └── guardianship-status.vo.ts
│
├── services/
│
└── repositories/
    ├── i-family.repository.ts
    └── i-guardianship.repository.ts


src/application/
├── common/                         # Shared application logic
│   ├── application.error.ts        # Standardized Error Handling
│   └── result.wrapper.ts           # The Result<T, E> Monad pattern
│
└── family/
    ├── commands/                   # [WRITE SIDE] Intentions to change state
    │   ├── handlers/
    │   │   ├── create-family.handler.ts
    │   │   ├── add-family-member.handler.ts
    │   │   ├── register-marriage.handler.ts         # Handles Civil & Customary
    │   │   ├── establish-polygamous-house.handler.ts # S.40 Logic
    │   │   ├── define-relationship.handler.ts       # Graph Edges
    │   │   ├── record-cohabitation.handler.ts       # S.29 Evidence
    │   │   ├── record-adoption.handler.ts           # Children Act
    │   │   ├── verify-member-identity.handler.ts    # Integration Command
    │   │   └── archive-family.handler.ts
    │   │
    │   └── impl/                   # The Command Classes (Pure Data)
    │       ├── create-family.command.ts
    │       ├── add-family-member.command.ts
    │       ├── register-marriage.command.ts
    │       ├── establish-polygamous-house.command.ts
    │       ├── define-relationship.command.ts
    │       ├── record-cohabitation.command.ts
    │       ├── record-adoption.command.ts
    │       ├── verify-member-identity.command.ts
    │       └── archive-family.command.ts
    │
    ├── queries/                    # [READ SIDE] Questions to the system
    │   ├── handlers/
    │   │   ├── get-family-dashboard.handler.ts      # Aggregates Stats & Health
    │   │   ├── get-family-graph.handler.ts          # Visual Tree Data
    │   │   ├── get-succession-readiness.handler.ts  # The "Digital Lawyer" Analysis
    │   │   ├── get-s40-distribution.handler.ts      # Polygamy Grouping
    │   │   └── search-families.handler.ts
    │   │
    │   ├── impl/                   # The Query Classes
    │   │   ├── get-family-dashboard.query.ts
    │   │   ├── get-family-graph.query.ts
    │   │   ├── get-succession-readiness.query.ts
    │   │   ├── get-s40-distribution.query.ts
    │   │   └── search-families.query.ts
    │   │
    │   └── read-models/            # [OUTPUT] View-optimized POJOs
    │       ├── family-dashboard.vm.ts
    │       ├── family-graph-node.vm.ts              # For D3.js/Visualizations
    │       ├── succession-readiness.vm.ts           # Analysis Result
    │       └── s40-house-group.vm.ts                # Property Distribution View
    │
    └── services/                   # [ORCHESTRATION]
        └── family-audit.service.ts # Captures changes for legal audit trails