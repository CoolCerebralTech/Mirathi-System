succession-process-service/
└── src/domain/
    ├── aggregates/
    │   ├── succession-case/        # COURT PROCESS MANAGEMENT
    │   │   ├── succession-case.aggregate.ts
    │   │   ├── entities/
    │   │   │   ├── grant.entity.ts
    │   │   │   ├── gazette-notice.entity.ts
    │   │   │   ├── objection.entity.ts
    │   │   │   ├── hearing.entity.ts
    │   │   │   └── court-filing.entity.ts
    │   │   └── events/
    │   │
    │   ├── distribution-execution/ # ACTUAL ASSET TRANSFER (Builder)
    │   │   ├── distribution-execution.aggregate.ts
    │   │   ├── entities/
    │   │   │   ├── asset-transmission.entity.ts    # REAL transfer
    │   │   │   ├── creditor-claim.entity.ts        # ACTUAL claim processing
    │   │   │   ├── section45-payment.entity.ts     # REAL debt payment
    │   │   │   └── estate-inventory.entity.ts      # COURT-filed inventory
    │   │   └── events/
    │   │
    │   └── executor-workflow/      # S.83 DUTY TRACKING
    │       └── executor-duty.aggregate.ts
    │
    └── policies/
        ├── section-45-execution.policy.ts   # ACTUAL debt payment order
        ├── grant-confirmation.policy.ts     # S.71 compliance
        └── court-compliance.policy.ts       # Filing deadlines, forms