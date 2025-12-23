src/succession-automation/src/domain/
│
├── aggregates/
│   ├── readiness-assessment.aggregate.ts # [ROOT 1] The Audit. "Can I file?"
│   ├── probate-application.aggregate.ts  # [ROOT 2] The Output. "Generate P&A 80"
│   └── executor-roadmap.aggregate.ts     # [ROOT 3] The Guide. "What next?"
│
├── entities/
│   // --- Owned by READINESS ---
│   ├── risk-flag.entity.ts               # "High Risk: Minor with no guardian"
│   ├── document-gap.entity.ts            # "Missing: Chief's Letter"
│
│   // --- Owned by PROBATE APPLICATION ---
│   ├── generated-form.entity.ts          # Metadata of the PDF (S3 URL)
│   ├── family-consent.entity.ts          # Tracking P&A 38 signatures
│
│   // --- Owned by ROADMAP ---
│   ├── roadmap-task.entity.ts            # "Go to bank", "File at registry"
│
├── services/
│   ├── context-detector.service.ts       # [CRITICAL] Determines Testate/Poly/Islamic status
│   ├── compliance-engine.service.ts      # Logic: Runs rules to create RiskFlags
│   └── form-strategy.service.ts          # Logic: Decides WHICH forms to generate
│
├── value-objects/
│   ├── succession-context.vo.ts          # The "Lens" we view the case through
│   ├── risk-source.vo.ts                 # Traceability (Family/Estate/Will)
│   ├── kenyan-form-type.vo.ts            # Enum of P&A Forms
│   └── readiness-score.vo.ts             # 0-100% logic
│
└── repositories/
    ├── i-readiness.repository.ts
    ├── i-probate-application.repository.ts
    └── i-roadmap.repository.ts