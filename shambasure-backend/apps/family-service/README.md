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
│   ├── next-of-kin.entity.ts          # Emergency Contact
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
│   └── kinship-verification.service.ts # Biological logic validation
│
└── repositories/
    ├── i-family.repository.ts
    └── i-guardianship.repository.ts