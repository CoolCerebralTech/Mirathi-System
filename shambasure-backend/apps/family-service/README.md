src/
└── domain/
    ├── aggregates/
    │   ├── family.aggregate.ts            # The Kinship Graph
    │   └── guardianship.aggregate.ts      # The Legal Authority Lifecycle
    │
    ├── entities/
    │   // --- Belongs to Family Aggregate ---
    │   ├── family-member.entity.ts        # The Person (Identity)
    │   ├── marriage.entity.ts             # The Union (Civil/Customary)
    │   ├── polygamous-house.entity.ts     # S.40 Structure (Wife + Kids grouping)
    │   ├── family-relationship.entity.ts  # The Edges (Parent/Child/Sibling)
    │   ├── cohabitation-record.entity.ts  # Fact of living together (Not yet a marriage)
    │   ├── adoption-record.entity.ts      # Legal adoption details
    │   ├── next-of-kin.entity.ts          # Designated NOK
    │
    │   // --- Belongs to Guardianship Aggregate ---
    │   ├── guardian-assignment.entity.ts  # Who is acting? (The User)
    │   └── compliance-check.entity.ts     # Annual report filing status
    │
    └── value-objects/