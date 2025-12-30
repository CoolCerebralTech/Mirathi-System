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


src/succession-automation/src/application/roadmap/
│
├── commands/                                  # ⚡ WRITE SIDE (State Mutations)
│   ├── dtos/                                  # Data Transfer Objects (Input Validation)
│   │   // --- Lifecycle & Generation ---
│   │   ├── generate-roadmap.dto.ts            # "Auto-Generate" trigger (Input: Readiness ID)
│   │   ├── regenerate-roadmap.dto.ts          # "Context Changed" trigger (e.g., Will found later)
│   │   ├── optimize-roadmap.dto.ts            # "AI Optimize" trigger (re-orders based on court load)
│   │
│   │   // --- Task Execution (The Daily Work) ---
│   │   ├── start-task.dto.ts                  # Tracks time/status
│   │   ├── submit-task-proof.dto.ts           # Uploads doc/receipt to complete task
│   │   ├── complete-task-manually.dto.ts      # For non-proof tasks
│   │   ├── skip-task.dto.ts                   # Requires reason (Audit trail)
│   │   ├── waive-task.dto.ts                  # Requires Court Order ID
│   │
│   │   // --- Phase Management ---
│   │   ├── transition-phase.dto.ts            # Move from PRE_FILING -> FILING
│   │   ├── force-phase-override.dto.ts        # Admin/Legal Team intervention
│   │
│   │   // --- Risk & Blocker Integration ---
│   │   ├── link-risk-to-task.dto.ts           # "This task is blocked by Risk X"
│   │   ├── unlock-blocked-task.dto.ts         # "Risk X resolved, unlocking task"
│   │   ├── escalate-stalled-task.dto.ts       # "Help! I'm stuck" (Triggers human legal review)
│   │
│   ├── handlers/                              # Command Handlers (Orchestration)
│   │   // --- Lifecycle ---
│   │   ├── generate-roadmap.handler.ts        # Orchestrates Context + Readiness -> Roadmap Factory
│   │   ├── optimize-roadmap.handler.ts        # Calls PredictiveService -> Updates Dates/Priorities
│   │
│   │   // --- Execution ---
│   │   ├── execute-task-action.handler.ts     # Handles Start/Complete/Fail logic
│   │   ├── verify-task-proof.handler.ts       # Checks doc upload with Document Service before completing
│   │
│   │   // --- Safety ---
│   │   ├── handle-task-escalation.handler.ts  # Notifies legal team + updates Aggregate status
│   │
│   └── impl/                                  # NestJS CQRS Command Classes
│       ├── generate-roadmap.command.ts
│       ├── submit-task-proof.command.ts
│       └── ... (matching handlers)
│
├── queries/                                   # 🔍 READ SIDE (UI & Reporting)
│   ├── dtos/
│   │   ├── get-roadmap-dashboard.dto.ts
│   │   ├── get-upcoming-tasks.dto.ts          # Filter by "Next 7 Days"
│   │   ├── get-critical-path.dto.ts           # "Show me only what blocks filing"
│   │   ├── get-proof-history.dto.ts           # Audit log for a specific task
│   │
│   ├── handlers/
│   │   ├── get-executor-dashboard.handler.ts  # The Main UI View (Progress, Phase, Next Step)
│   │   ├── get-smart-next-step.handler.ts     # The "GPS" Logic (Returns single best action)
│   │   ├── get-roadmap-analytics.handler.ts   # Time/Cost estimates vs Actuals
│   │   ├── get-task-dependencies.handler.ts   # Visualization graph (D3.js data structure)
│   │
│   ├── impl/
│   │   ├── get-executor-dashboard.query.ts
│   │   └── ... (matching handlers)
│   │
│   └── view-models/                           # Specialized Return Objects
│       ├── roadmap-dashboard.vm.ts            # Phase progress bars, alerts
│       ├── task-detail.vm.ts                  # Instructions, links, proof status
│       ├── legal-timeline.vm.ts               # Gantt chart data
│       └── smart-recommendation.vm.ts         # "Do this because..." (AI reasoning)
│
├── services/                                  # 🧠 DOMAIN SERVICES (Pure Logic & Orchestration)
│   ├── smart-navigation/                      # INNOVATION CORE
│   │   ├── predictive-analysis.service.ts     # ML: "Cases like this take 45 days"
│   │   ├── critical-path-engine.service.ts    # Graph algo: Finds bottlenecks
│   │   └── efficiency-scorer.service.ts       # Compares user speed vs benchmarks
│   │
│   ├── task-automation/
│   │   ├── proof-validator.service.ts         # Validates uploaded proofs (e.g., Receipt OCR)
│   │   ├── dependency-resolver.service.ts     # Unlocks children when parent completes
│   │   └── auto-generator.service.ts          # Maps SuccessionContext -> Task Templates
│   │
│   └── external-integration/
│       ├── court-backlog-monitor.service.ts   # Adjusts estimates based on Judiciary data
│       └── legal-resource-linker.service.ts   # Attaches dynamic help guides/videos
│
├── events/                                    # 📢 EVENT SUBSCRIBERS
│   // --- Internal Reactions ---
│   ├── unlock-next-tasks.subscriber.ts        # Listens to: RoadmapTaskCompleted
│   ├── check-phase-completion.subscriber.ts   # Listens to: RoadmapTaskCompleted
│   ├── update-analytics.subscriber.ts         # Listens to: RoadmapTaskCompleted (Recalcs efficiency)
│
│   // --- Readiness/Risk Integration ---
│   ├── blocking-risk-detected.subscriber.ts   # Listens to: RiskIdentified (Blocks tasks)
│   ├── risk-resolved.subscriber.ts            # Listens to: RiskResolved (Unblocks tasks)
│
│   // --- Document Integration ---
│   ├── document-approved.subscriber.ts        # Listens to: DocumentVerified (Auto-completes "Collect Doc" tasks)
│   ├── document-rejected.subscriber.ts        # Listens to: DocumentRejected (Re-opens task as FAILED)
│
│   // --- Court/External Integration ---
│   ├── court-date-scheduled.subscriber.ts     # Updates "Attend Hearing" task due date
│
├── jobs/                                      # ⏰ BACKGROUND TASKS
│   ├── overdue-task-monitor.job.ts            # Marks tasks overdue, sends reminders
│   ├── auto-escalation-daemon.job.ts          # Checks blocked tasks > threshold -> Alerts Legal
│   ├── weekly-executor-digest.job.ts          # Generates "Week in Review" email
│   └── stale-roadmap-refresher.job.ts         # Re-runs optimization for inactive roadmaps
│
└── interfaces/                                # 🔌 EXTERNAL PORTS
    ├── i-readiness-service.adapter.ts         # To fetch latest Risk profile
    ├── i-document-service.adapter.ts          # To verify proofs/attachments
    ├── i-notification-service.adapter.ts      # To send push/email reminders
    └── i-ai-prediction.adapter.ts             # Interface for the ML Time Estimation model

src/succession-automation/src/presentation/roadmap/
│
├── controllers/
│   ├── roadmap.command.controller.ts      # [WRITE API] Central Hub for Roadmap Mutations.
│   │                                      # Endpoints: POST /roadmaps (Generate)
│   │                                      # POST /roadmaps/{id}/optimize (AI Re-calc)
│   │                                      #
│   │                                      # Task Ops: POST /roadmaps/{id}/tasks/{taskId}/start
│   │                                      #           POST /roadmaps/{id}/tasks/{taskId}/proof
│   │                                      #           POST /roadmaps/{id}/tasks/{taskId}/skip
│   │                                      #           POST /roadmaps/{id}/tasks/{taskId}/waive
│   │                                      #
│   │                                      # Phase: PATCH /roadmaps/{id}/phase/transition
│   │                                      # Risk:  POST /roadmaps/{id}/risks/link
│   │
│   └── roadmap.query.controller.ts        # [READ API] Dashboard & Executor Insights.
│                                          # Endpoints: GET /roadmaps/{id}/dashboard (Main Cockpit)
│                                          # GET /roadmaps/{id}/tasks (Paginated & Filtered List)
│                                          # GET /roadmaps/{id}/tasks/{taskId} (Deep Detail)
│                                          # GET /roadmaps/{id}/analytics (Time/Cost Stats)
│                                          # GET /roadmaps/{id}/critical-path (Bottleneck View)
│
├── dtos/
│   ├── request/                           # [INPUTS] Validated & Swagger Decorated (@ApiProperty)
│   │   // --- Lifecycle & Generation ---
│   │   ├── generate-roadmap.request.dto.ts    # Initial trigger (estateId, readinessId)
│   │   ├── regenerate-roadmap.request.dto.ts  # Context change trigger
│   │   ├── optimize-roadmap.request.dto.ts    # AI Trigger (Speed vs Cost preference)
│   │
│   │   // --- Task Execution (The Daily Work) ---
│   │   ├── submit-task-proof.request.dto.ts   # Uploads, Receipts, Notes
│   │   ├── skip-task.request.dto.ts           # Requires reason
│   │   ├── waive-task.request.dto.ts          # Requires court order ref
│   │   ├── escalate-task.request.dto.ts       # "Help me" trigger
│   │
│   │   // --- Phase Management ---
│   │   ├── transition-phase.request.dto.ts    # Explicit move to next stage
│   │
│   │   // --- Risk Integration ---
│   │   ├── link-risk.request.dto.ts           # Blocking logic
│   │
│   │   // --- Query Filters (GET Params) ---
│   │   ├── task-filter.request.dto.ts         # Phase, Status, Priority, Overdue
│   │
│   └── response/                          # [OUTPUTS] ViewModels mapped to Clean JSON
│       ├── roadmap-dashboard.response.dto.ts  # Progress bars, Phase Status, Next Action
│       ├── task-list.response.dto.ts          # Paginated summary list
│       ├── task-detail.response.dto.ts        # Instructions, Links, History, Dependencies
│       ├── roadmap-analytics.response.dto.ts  # Charts: Estimated vs Actual, Efficiency
│       ├── critical-path.response.dto.ts      # Linear list of blocking tasks
│
└── mappers/
    └── roadmap-presenter.mapper.ts        # [TRANSFORMER]
                                           # Converts App ViewModels -> Response DTOs
                                           # Handles:
                                           # - Date ISO string formatting
                                           # - Task Status Icons/Colors
                                           # - Localized Phase Names
                                           # - Hiding internal IDs/Metadata
                                           
src/succession-automation/src/application/probate-application/
│
├── commands/                                      # ⚡ WRITE SIDE (State Mutations)
│   ├── dtos/                                      # Data Transfer Objects (Validation)
│   │   // --- 1. Lifecycle & Initialization ---
│   │   ├── create-application.dto.ts              # Manual start
│   │   ├── auto-generate-from-readiness.dto.ts    # Triggered by Readiness Audit
│   │   ├── withdraw-application.dto.ts            # User exit
│   │
│   │   // --- 2. Smart Form Strategy (The "Engine") ---
│   │   ├── generate-form-bundle.dto.ts            # Triggers VO logic to pick forms
│   │   ├── regenerate-forms.dto.ts                # When Context/Estate Value changes
│   │   ├── review-form.dto.ts                     # User "Approves" a generated draft
│   │   ├── sign-form.dto.ts                       # Digital/Wet signature capture
│   │   ├── amend-form.dto.ts                      # Handling Court Rejections
│   │
│   │   // --- 3. Consent Management (S.56 Compliance) ---
│   │   ├── request-family-consent.dto.ts          # Triggers SMS/Email
│   │   ├── record-consent-grant.dto.ts            # OTP Verification / Upload
│   │   ├── record-consent-decline.dto.ts          # Captures dispute reason (Risk)
│   │   ├── mark-consent-not-required.dto.ts       # Legal override (with audit note)
│   │
│   │   // --- 4. Filing & Court Interaction ---
│   │   ├── pay-filing-fee.dto.ts                  # Integrates with Payment Gateway
│   │   ├── file-application.dto.ts                # The "Big Commit" (Locks aggregate)
│   │   ├── record-court-response.dto.ts           # Accepted / Rejected / Queries
│   │   ├── record-gazette-publication.dto.ts      # Starts 30-day timer
│   │   ├── record-grant-issuance.dto.ts           # The Goal (Terminal State)
│   │
│   ├── handlers/                                  # Command Handlers (Orchestration)
│   │   // --- Lifecycle ---
│   │   ├── create-application.handler.ts          # Factory: ProbateApplication.create()
│   │   ├── auto-generate.handler.ts               # Factory: ProbateApplication.autoGenerate()
│   │
│   │   // --- Forms ---
│   │   ├── generate-form-bundle.handler.ts        # CALLS: FormStrategyService + PdfService
│   │   ├── process-form-signature.handler.ts      # Validates signature -> Updates Entity
│   │
│   │   // --- Consents ---
│   │   ├── manage-consent-request.handler.ts      # CALLS: NotificationService (SMS/Email)
│   │   ├── process-consent-response.handler.ts    # Logic: Updates Entity -> Checks AllConsentsReceived
│   │
│   │   // --- Filing ---
│   │   ├── execute-filing.handler.ts              # Logic: Checks Readiness -> Fees -> Submits
│   │   ├── process-court-outcome.handler.ts       # Handles Rejection loops or Grant issuance
│   │
│   └── impl/                                      # NestJS Command Classes
│       ├── create-application.command.ts
│       ├── generate-form-bundle.command.ts
│       └── ... (matching handlers)
│
├── queries/                                       # 🔍 READ SIDE (UI & Reporting)
│   ├── dtos/
│   │   ├── get-application-dashboard.dto.ts
│   │   ├── get-form-preview.dto.ts                # Secure temporary URL generation
│   │   ├── get-consent-status.dto.ts              # Matrix of family responses
│   │   ├── check-filing-readiness.dto.ts          # Pre-flight check (Fees + Forms + Consents)
│   │   ├── get-filing-fees.dto.ts                 # Dynamic calculation based on Court/Forms
│   │
│   ├── handlers/
│   │   ├── get-application-dashboard.handler.ts   # Returns progress bars, status
│   │   ├── get-generated-forms.handler.ts         # Lists forms with their statuses/versions
│   │   ├── calculate-filing-fees.handler.ts       # Uses VO logic to sum up costs
│   │   ├── validate-filing-readiness.handler.ts   # Returns KenyanLegalResult (Warnings/Violations)
│   │
│   ├── impl/
│   │   ├── get-application-dashboard.query.ts
│   │   └── ... (matching handlers)
│   │
│   └── view-models/                               # Specialized Return Objects
│       ├── application-dashboard.vm.ts            # % Complete, Next Action
│       ├── form-bundle.vm.ts                      # Grouped by Category (Petition, Affidavit, etc.)
│       ├── consent-matrix.vm.ts                   # Who agreed, who declined, who is pending
│       ├── filing-preview.vm.ts                   # Fee breakdown, Court Station details
│
├── services/                                      # 🧠 DOMAIN SERVICES (Pure Logic)
│   ├── form-strategy/                             # THE INNOVATION ENGINE
│   │   ├── form-strategy-orchestrator.service.ts  # Uses KenyanFormType.generateFormBundle()
│   │   ├── pdf-assembler.service.ts               # Maps Domain Entities -> PDF Templates
│   │   └── form-validator.service.ts              # "Did they sign P&A 5? Is P&A 12 attached?"
│   │
│   ├── consent-management/
│   │   ├── consent-communication.service.ts       # Manages SMS/Email templates & tokens
│   │   └── otp-verification.service.ts            # Security for Digital Consents
│   │
│   └── court-integration/
│       ├── fee-calculator.service.ts              # Centralized fee logic (Court + Forms)
│       └── filing-validator.service.ts            # Final "Sanity Check" before locking
│
├── events/                                        # 📢 EVENT SUBSCRIBERS
│   // --- Internal Reactions ---
│   ├── on-readiness-assessed.subscriber.ts        # Trigger: Auto-generate Application
│   ├── on-forms-generated.subscriber.ts           # Trigger: Notify User to Review
│   ├── on-consent-received.subscriber.ts          # Trigger: Check "Is Ready To File?"
│   ├── on-filing-fee-paid.subscriber.ts           # Trigger: Unlock "File Now" button
│   ├── on-application-filed.subscriber.ts         # Trigger: Update Roadmap Phase
│
│   // --- External Integrations ---
│   ├── court-notification-listener.subscriber.ts  # Webhooks from Judiciary (if available)
│
├── jobs/                                          # ⏰ BACKGROUND TASKS
│   ├── consent-expiry-monitor.job.ts              # Checks PENDING consents > 30 days
│   ├── gazette-timeline-monitor.job.ts            # Tracks the 30-day Gazette period
│   ├── abandoned-application-cleaner.job.ts       # Flags Drafts inactive > 90 days
│   └── court-status-poller.job.ts                 # Periodically checks court portal (mock/real)
│
└── interfaces/                                    # 🔌 EXTERNAL PORTS
    ├── i-pdf-generator.adapter.ts                 # Adapter for PDF Engine (e.g., Puppeteer/DocRaptor)
    ├── i-payment-gateway.adapter.ts               # Adapter for M-PESA / Card
    ├── i-communication.adapter.ts                 # Adapter for SMS/Email
    └── i-storage.adapter.ts                       # Adapter for S3 (Forms)
    