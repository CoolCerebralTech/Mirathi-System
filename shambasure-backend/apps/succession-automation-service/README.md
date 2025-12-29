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


src/succession-automation/src/application/readiness/
│
├── commands/                                  # ⚡ WRITE SIDE (State Mutations)
│   ├── dtos/                                  # Data Transfer Objects (Input Validation)
│   │   // --- Lifecycle Management ---
│   │   ├── initialize-assessment.dto.ts       # Triggers first run (e.g., new Estate created)
│   │   ├── complete-assessment.dto.ts         # "I am filing today" (Locks the state)
│   │   ├── force-recalculation.dto.ts         # Manual "Refresh" button
│   │
│   │   // --- Risk Management (The "Digital Lawyer" Interaction) ---
│   │   ├── resolve-risk-manually.dto.ts       # User says "I fixed this offline"
│   │   ├── dispute-risk.dto.ts                # User says "This law doesn't apply to me"
│   │   ├── acknowledge-warning.dto.ts         # For non-blocking LOW risks
│   │   ├── update-risk-mitigation.dto.ts      # Tracking user notes/progress
│   │
│   │   // --- Context & Strategy ---
│   │   ├── update-succession-context.dto.ts   # Critical: "We found a Will" / "Polygamy detected"
│   │   ├── override-strategy.dto.ts           # Admin override for edge cases
│   │
│   ├── handlers/                              # Command Handlers (Orchestration)
│   │   // --- Lifecycle ---
│   │   ├── initialize-assessment.handler.ts   # Factory.create()
│   │   ├── complete-assessment.handler.ts     # Validates > 80% & No Blockers -> Emits Completed
│   │   ├── force-recalculation.handler.ts     # Re-runs Rules Engine
│   │
│   │   // --- Risk Handling ---
│   │   ├── resolve-risk.handler.ts            # Updates RiskFlag entity
│   │   ├── manage-risk-dispute.handler.ts     # Flags risk as DISPUTED
│   │
│   │   // --- Context ---
│   │   ├── update-context.handler.ts          # Changes Court Jurisdiction logic
│   │
│   └── impl/                                  # NestJS CQRS Command Classes
│       ├── initialize-assessment.command.ts
│       ├── resolve-risk.command.ts
│       └── ... (matching handlers)
│
├── queries/                                   # 🔍 READ SIDE (UI & Reporting)
│   ├── dtos/
│   │   ├── get-assessment.dto.ts
│   │   ├── filter-risks.dto.ts                # By Severity, Category, Source
│   │   ├── simulate-score.dto.ts              # "What if I fix X?" (Innovation)
│   │
│   ├── handlers/
│   │   ├── get-assessment-dashboard.handler.ts # Main Traffic Light View
│   │   ├── get-blocking-issues.handler.ts      # The "To-Do List" for filing
│   │   ├── get-document-checklist.handler.ts   # Extracted from DocumentGaps
│   │   ├── simulate-resolution-impact.handler.ts # Returns projected score
│   │
│   ├── impl/
│   │   ├── get-assessment-dashboard.query.ts
│   │   └── ... (matching handlers)
│   │
│   └── view-models/                           # Specialized Return Objects
│       ├── readiness-dashboard.vm.ts          # Score, Status, Strategy Text
│       ├── risk-detail.vm.ts                  # Legal Basis, Mitigation Steps
│       ├── filing-checklist.vm.ts             # Grouped by "Critical" vs "Optional"
│       └── strategy-roadmap.vm.ts             # The "Digital Lawyer" advice block
│
├── services/                                  # 🧠 DOMAIN SERVICES (Pure Logic Injectables)
│   ├── compliance-rule-engine.service.ts      # The "Engine". Runs ALL rules against Estate/Family data
│   │                                          # Returns: RiskFlag[]
│   │
│   ├── strategy-generator.service.ts          # Generates the Markdown advice based on Context
│   │
│   ├── gap-analysis.service.ts                # Maps RiskFlags -> DocumentGaps
│   │
│   └── context-analyzer.service.ts            # Determines High Court vs Magistrate vs Kadhi
│
├── events/                                    # 📢 EVENT SUBSCRIBERS (Cross-Context Listeners)
│   // --- Family Service Listeners ---
│   ├── family-member-created.subscriber.ts    # Triggers: Minor check, Polygamy check
│   ├── guardian-appointed.subscriber.ts       # Triggers: Auto-resolve MINOR_WITHOUT_GUARDIAN
│   ├── marriage-verified.subscriber.ts        # Triggers: Resolve COHABITATION_CLAIM
│
│   // --- Estate Service Listeners ---
│   ├── asset-created.subscriber.ts            # Triggers: Asset Verification Risk
│   ├── asset-verified.subscriber.ts           # Triggers: Auto-resolve ASSET_VERIFICATION_FAILED
│   ├── debt-added.subscriber.ts               # Triggers: Solvency Check
│   ├── death-cert-uploaded.subscriber.ts      # Triggers: Auto-resolve MISSING_DEATH_CERT
│
│   // --- Document Service Listeners ---
│   ├── document-verified.subscriber.ts        # Triggers: Resolve specific document gaps
│
├── jobs/                                      # ⏰ BACKGROUND TASKS
│   ├── daily-readiness-refresh.job.ts         # Recalculates stale assessments (> 7 days)
│   ├── risk-expiration-monitor.job.ts         # Cleans up expired risks (Time-based resolution)
│   └── auto-resolve-retry.job.ts              # Retries resolving risks waiting on external APIs
│
└── interfaces/                                # 🔌 EXTERNAL PORTS (Dependency Inversion)
    ├── i-family-service.adapter.ts            # For fetching fresh Family data during recalculation
    ├── i-estate-service.adapter.ts            # For fetching fresh Estate data
    └── i-document-service.adapter.ts          # For checking document existence


src/succession-automation/src/presentation/readiness/
│
├── controllers/
│   ├── readiness.command.controller.ts    # [WRITE API] Central Hub for Assessment Mutations.
│   │                                      # Endpoints: POST /readiness (Initialize)
│   │                                      # PATCH /readiness/{id}/complete
│   │                                      # POST /readiness/{id}/recalculate
│   │                                      #
│   │                                      # Risk Ops: PATCH /readiness/{id}/risks/{riskId}/resolve
│   │                                      #           PATCH /readiness/{id}/risks/{riskId}/dispute
│   │                                      #           POST /readiness/{id}/risks/{riskId}/mitigation
│   │                                      #
│   │                                      # Context: PUT /readiness/{id}/context
│   │
│   └── readiness.query.controller.ts      # [READ API] Dashboard & Legal Insights.
│                                          # Endpoints: GET /readiness/{id}/dashboard (Traffic Light)
│                                          # GET /readiness/{id}/strategy (Markdown Roadmap)
│                                          # GET /readiness/{id}/checklist (Document Gaps)
│                                          # GET /readiness/{id}/risks (Filtered Register)
│                                          # POST /readiness/{id}/simulate (What-If Analysis)
│
├── dtos/
│   ├── request/                           # [INPUTS] Validated & Swagger Decorated (@ApiProperty)
│   │   // --- Lifecycle Management ---
│   │   ├── initialize-assessment.request.dto.ts   # Trigger analysis for Estate
│   │   ├── complete-assessment.request.dto.ts     # Lock & Prepare for Filing
│   │   ├── force-recalculation.request.dto.ts     # Manual "Refresh" from Estate Data
│   │
│   │   // --- Risk Management (The "Digital Lawyer" Interaction) ---
│   │   ├── resolve-risk.request.dto.ts        # Manual Resolution Notes
│   │   ├── dispute-risk.request.dto.ts        # "This law doesn't apply because..."
│   │   ├── acknowledge-warning.request.dto.ts # For Low/Medium non-blocking risks
│   │   ├── update-mitigation.request.dto.ts   # Logging progress steps
│   │
│   │   // --- Context & Strategy ---
│   │   ├── update-context.request.dto.ts      # Changing the Legal Lens (e.g., Will found)
│   │   ├── override-strategy.request.dto.ts   # Lawyer/Admin Override
│   │
│   │   // --- Simulation ---
│   │   ├── simulate-score.request.dto.ts      # List of Risk IDs to tentatively fix
│   │
│   └── response/                          # [OUTPUTS] ViewModels mapped to Clean JSON
│       ├── readiness-dashboard.response.dto.ts # The "Cockpit" (Score, Status, Top Risks)
│       ├── risk-detail.response.dto.ts         # Rich UI Object (Colors, Icons, Legal Basis)
│       ├── strategy-roadmap.response.dto.ts    # Full Markdown Text & Milestones
│       ├── filing-checklist.response.dto.ts    # Separated by "Mandatory" vs "Optional"
│       ├── simulation-result.response.dto.ts   # "Ghost Score" comparison
│       └── document-gap.response.dto.ts        # Instructions on how to get missing docs
│
└── mappers/
    └── readiness-presenter.mapper.ts      # [TRANSFORMER]
                                           # Converts Application ViewModels -> Response DTOs
                                           # Handles date formatting, currency display,
                                           # and mapping Domain Enums to UI-friendly strings.