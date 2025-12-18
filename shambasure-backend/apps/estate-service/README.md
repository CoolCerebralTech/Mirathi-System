src/domain/
├── aggregates/
│   ├── estate/                     # ASSET CATALOG & VALUATION (Pre-death)
│   │   ├── estate.aggregate.ts     # Root: Manages net worth, liability summary
│   │   ├── entities/
│   │   │   ├── asset.entity.ts     # Base asset with polymorphic details
│   │   │   ├── debt.entity.ts      # For planning/debt categorization
│   │   │   └── gift-inter-vivos.entity.ts # For S.35(3) Hotchpot tracking
│   │   ├── value-objects/
│   │   │   ├── asset-details.vo.ts # Polymorphic: Land, Vehicle, Business, etc.
│   │   │   ├── liability-tier.vo.ts # Pre-categorization for S.45 planning
│   │   │   └── valuation.vo.ts     # Value + date + method + valuer info
│   │   └── events/
│   │       ├── estate-created.event.ts
│   │       ├── asset-added.event.ts
│   │       └── debt-recorded.event.ts
│   │
│   ├── will/                       # LEGAL INSTRUMENT AGGREGATE
│   │   ├── will.aggregate.ts       # Root: Manages validity, execution, revocation
│   │   ├── entities/
│   │   │   ├── codicil.entity.ts   # Amendments
│   │   │   ├── testamentary-executor.entity.ts  # Will-appointed executor
│   │   │   ├── will-witness.entity.ts
│   │   │   └── bequest.entity.ts   # Testamentary disposition (renamed)
│   │   ├── value-objects/
│   │   │   ├── witness-signature.vo.ts
│   │   │   ├── legal-capacity.vo.ts # Section 7 LSA compliance
│   │   │   └── revocation-details.vo.ts
│   │   └── events/
│   │       ├── will-executed.event.ts
│   │       ├── bequest-added.event.ts
│   │       └── will-revoked.event.ts
│   │
│   └── inheritance-calculation/    # THE BLUEPRINT ENGINE
│       ├── inheritance-calculation.aggregate.ts  # Root: Computed distribution PLAN
│       ├── entities/
│       │   ├── computed-share.entity.ts     # Calculated entitlement
│       │   └── distribution-scenario.entity.ts # "What-if" scenarios
│       ├── value-objects/
│       │   ├── section35-calculation.vo.ts  # Spouse + children math
│       │   ├── section40-calculation.vo.ts  # Polygamous house ratios
│       │   ├── hotchpot-adjustment.vo.ts    # S.35(3) calculations
│       │   └── dependency-entitlement.vo.ts # S.29 calculations
│       └── events/
│           ├── inheritance-calculated.event.ts
│           └── hotchpot-applied.event.ts
│
├── shared/                         # SHARED KERNEL (Cross-Aggregate)
│   ├── money.vo.ts                 # Amount + Currency (KES-focused)
│   ├── kenyan-id.vo.ts            # National ID/KRA PIN validation
│   ├── kenyan-location.vo.ts      # County/SubCounty/Ward structure
│   ├── ownership-percentage.vo.ts
│   ├── court-reference.vo.ts      # Case numbers, grant numbers
│   └── document-reference.vo.ts   # Title deeds, registration numbers
│
├── services/                       # DOMAIN SERVICES (Stateless business logic)
│   ├── kenyan-intestacy-calculator.service.ts  # Pure S.35, 36, 38, 40 math
│   ├── hotchpot-calculation.service.ts         # S.35(3) implementation
│   ├── dependency-entitlement.service.ts       # S.29 implementation
│   ├── will-legal-compliance.service.ts        # Validates against LSA
│   └── asset-classification.service.ts         # Matrimonial vs. separate property
│
├── policies/                       # BUSINESS RULES ENFORCEMENT
│   ├── legal-policies/
│   │   ├── section-7-policy.ts    # Testator capacity rules
│   │   ├── section-11-policy.ts   # Undue influence detection
│   │   ├── section-26-policy.ts   # Dependant provision
│   │   ├── section-35-policy.ts   # Intestate distribution
│   │   ├── section-40-policy.ts   # Polygamous succession
│   │   └── section-45-policy.ts   # Debt priority (PLANNING version)
│   ├── validation-policies/
│   │   ├── will-execution-policy.ts
│   │   ├── witness-eligibility-policy.ts
│   │   └── asset-verification-policy.ts
│
└── repositories/                   # REPOSITORY INTERFACES
    ├── estate-repository.interface.ts
    ├── will-repository.interface.ts
    ├── inheritance-calculation-repository.interface.ts
