src/estate-service/src/domain/
│
├── aggregates/
│   ├── estate.aggregate.ts             # [ROOT 1] The "Net Worth" Manager.
│   │                                   # RESPONSIBILITY: Enforces Solvency (Assets >= Debts).
│   │                                   # INVARIANT: An asset cannot belong to two estates.
│   │
│   └── will.aggregate.ts               # [ROOT 2] The "Instruction" Manager.
│                                       # RESPONSIBILITY: Validates S.11 LSA (Witnessing).
│                                       # INVARIANT: Only one Will can be active per user.
│
├── entities/
│   // =========================================================================
│   // 🟢 OWNED BY ESTATE AGGREGATE (Inventory & Claims)
│   // =========================================================================
│   │
│   // --- Asset Core & Details (Polymorphic) ---
│   ├── asset.entity.ts                 # The generic parent (ID, Type, Value, Owner).
│   ├── land-asset-details.entity.ts    # Specifics: Title Deed No, County, Acreage.
│   ├── vehicle-asset-details.entity.ts # Specifics: Logbook No, Chassis No.
│   ├── financial-asset-details.entity.ts # Specifics: Bank Name, Account No.
│   ├── business-asset-details.entity.ts  # Specifics: Shares, Registration No.
│   │
│   // --- Asset Metadata & History ---
│   ├── asset-valuation.entity.ts       # History: Tracks value changes over time.
│   ├── asset-co-owner.entity.ts        # Facts: "Owned 50% with Spouse".
│   ├── asset-liquidation.entity.ts     # Process: Tracks conversion from Property -> Cash.
│   │                                   # WHY: Keeps Net Value accurate after a sale.
│   │
│   // --- Liabilities & Compliance ---
│   ├── debt.entity.ts                  # Liabilities.
│   │                                   # LOGIC: Categorized by S.45 Priority (Funeral > Secured > Unsecured).
│   ├── estate-tax-compliance.entity.ts # KRA Status.
│   │                                   # WHY: Distribution is blocked until this is "Clear".
│   │
│   // --- S.35 & S.26 Specifics ---
│   ├── gift-inter-vivos.entity.ts      # Past Gifts.
│   │                                   # WHY: Required for "Hotchpot" (S.35(3)) math.
│   ├── legal-dependant.entity.ts       # S.29 Claimant (Spouse/Child claiming support).
│   │                                   # WHY: Moved inside Estate because a claim must target an Estate.
│   └── dependant-evidence.entity.ts    # Proof: School receipts, medical reports.
│
│   // =========================================================================
│   // 🔵 OWNED BY WILL AGGREGATE (Instructions)
│   // =========================================================================
│   ├── codicil.entity.ts               # Amendments. Changes specific clauses without rewriting the Will.
│   ├── executor-nomination.entity.ts   # "I nominate John". (Not yet an administrator).
│   ├── will-witness.entity.ts          # "I saw him sign". (Validation).
│   ├── beneficiary-assignment.entity.ts # The Link: "Give Asset A to Person B".
│   └── disinheritance-record.entity.ts # "I leave nothing to X because...".
│
├── services/
│   // =========================================================================
│   // 🧠 DOMAIN SERVICES (Pure Logic / The "Brain")
│   // =========================================================================
│   ├── distribution-calculator.service.ts 
│   │   # The Engine. Takes Inventory + Instructions -> Outputs Shares.
│   │   # Implements: S.35 (Intestate), S.40 (Polygamy), and Will Rules.
│   │
│   └── solvency-checker.service.ts
│       # Checks if Estate has enough liquidity to pay S.45 priority debts.
│
├── value-objects/
│   // =========================================================================
│   // 🧱 VALUE OBJECTS (Immutable Standards)
│   // =========================================================================
│   ├── money.vo.ts                     # Prevents floating-point math errors.
│   ├── asset-type.vo.ts                # Enum: LAND, VEHICLE, etc.
│   ├── debt-priority.vo.ts             # Enum: S.45(a), S.45(b), etc.
│   ├── tax-status.vo.ts                # Enum: PENDING, CLEARED.
│   ├── kenyan-county.vo.ts             # List of 47 Counties.
│   └── succession-law-section.vo.ts    # Enum: S35, S40, S26.
│
└── read-models/
    // =========================================================================
    // 📸 READ MODELS (Snapshots for UI/Reporting)
    // =========================================================================
    ├── distribution-scenario.read-model.ts # A saved "What-If" calculation.
    └── computed-share.read-model.ts        # The final result row: "Wanjiku gets 20%".

src/estate-service/src/domain/
│
├── aggregates/
│   ├── estate.aggregate.ts             # [ROOT] The Financial Ledger.
│   │                                   # RESPONSIBILITY: Enforces Solvency & Readiness.
│   │                                   # METHODS: getNetValue(), freeze(), isSolvent().
│   │
│   └── will.aggregate.ts               # [ROOT] The Instructions.
│                                       # (unchanged from previous agreement)
│
├── entities/
│   // =========================================================================
│   // 1. INVENTORY (The "What")
│   // =========================================================================
│   ├── asset.entity.ts                 # The Wrapper (ID, Type, Status).
│   ├── asset-liquidation.entity.ts     # The Event: Asset -> Cash conversion.
│   │
│   // --- Asset Polymorphism (The Details) ---
│   // These are Value Objects or Child Entities attached to 'Asset'
│   ├── land-asset-details.entity.ts    # Title Deed, LR Number, County.
│   ├── vehicle-asset-details.entity.ts # Logbook, Chassis, Make/Model.
│   ├── financial-asset-details.entity.ts # Bank Name, Account, Shares.
│   ├── business-asset-details.entity.ts  # Company Reg, Shareholding %.
│   │
│   // --- Asset Economics ---
│   ├── asset-valuation.entity.ts       # History: Value at Date X vs Date Y.
│   ├── asset-co-owner.entity.ts        # Fact: "Deceased owned only 50%".
│
│   // =========================================================================
│   // 2. LIABILITIES (The "Owed")
│   // =========================================================================
│   ├── debt.entity.ts                  # The Liability.
│   │                                   # LOGIC: S.45 Priorities (Funeral > Secured).
│   ├── estate-tax-compliance.entity.ts # The "KRA Gate".
│   │                                   # LOGIC: Blocks distribution until cleared.
│
│   // =========================================================================
│   // 3. CLAIMS & ADJUSTMENTS (The "adjustments")
│   // =========================================================================
│   ├── legal-dependant.entity.ts       # S.29 Claimant (The Person).
│   ├── dependant-evidence.entity.ts    # The Proof (School Fees, Medical Reports).
│   │                                   # WHY: You cannot claim without evidence.
│   ├── gift-inter-vivos.entity.ts      # S.35(3) Hotchpot.
│   │                                   # LOGIC: Adds phantom value back for math.
│
├── services/
│   ├── solvency-calculator.service.ts  # Logic: Can we pay the debts?
│   └── distribution-math.service.ts    # Logic: Who gets what %?
│


src/estate-service/src/application/will/
│
├── commands/                                  # ⚡ WRITE SIDE (State Changes)
│   ├── dtos/                                  # Data Transfer Objects (Validation Layer)
│   │   ├── create-will.dto.ts
│   │   ├── execute-will.dto.ts
│   │   ├── beneficiary-assignment.dto.ts
│   │   ├── executor-appointment.dto.ts
│   │   ├── witness-management.dto.ts
│   │   ├── disinheritance.dto.ts
│   │   └── codicil.dto.ts
│   │
│   ├── handlers/                              # Business Logic (The "How")
│   │   ├── create-draft-will.handler.ts
│   │   ├── execute-will.handler.ts            # 🛡️ Critical: S.11 Logic here
│   │   ├── revoke-will.handler.ts
│   │   ├── add-beneficiary.handler.ts
│   │   ├── appoint-executor.handler.ts
│   │   ├── add-witness.handler.ts             # Pre-execution nomination
│   │   ├── record-witness-signature.handler.ts # During execution
│   │   ├── record-disinheritance.handler.ts   # 🛡️ Critical: S.26 Logic here
│   │   ├── add-codicil.handler.ts
│   │   └── update-capacity-declaration.handler.ts
│   │
│   └── impl/                                  # Command Objects (The "What")
│       ├── create-draft-will.command.ts
│       ├── execute-will.command.ts
│       ├── ... (matching handlers)
│
├── queries/                                   # 🔍 READ SIDE (Data Retrieval)
│   ├── dtos/
│   │   ├── will-search.dto.ts
│   │   └── compliance-report-request.dto.ts
│   │
│   ├── handlers/
│   │   ├── get-will-by-id.handler.ts
│   │   ├── get-active-will.handler.ts
│   │   ├── get-testator-history.handler.ts    # Audit trail for probate
│   │   ├── get-will-compliance-report.handler.ts # 🛡️ The "Radar"
│   │   └── search-wills.handler.ts
│   │
│   ├── impl/
│   │   ├── get-will-by-id.query.ts
│   │   ├── ... (matching handlers)
│   │
│   └── view-models/                           # Read Models (Optimized for UI)
│       ├── will-detail.vm.ts
│       ├── will-summary.vm.ts
│       ├── compliance-report.vm.ts            # Warnings/Violations list
│       └── executor-dashboard.vm.ts
│
├── services/                                  # 🧩 ORCHESTRATION & DOMAIN LOGIC BRIDGES
│   ├── will-compliance.service.ts             # Runs the "Radar" logic across Aggregate
│   ├── will-pdf-generator.service.ts          # Orchestrates PDF creation (Adapter pattern)
│   └── audit-logger.service.ts                # Legal audit trail specific to Wills
│
├── events/                                    # 📢 EVENT SUBSCRIBERS (Side Effects)
│   ├── will-executed.subscriber.ts            # Triggers Succession Automation Service
│   ├── will-revoked.subscriber.ts
│   └── beneficiary-added.subscriber.ts        # Validates against Family Service
│
└── interfaces/                                # 🔌 PORTS (External Dependencies)
    ├── family-service.interface.ts            # To validate "Who is this person?"
    └── notification-service.interface.ts      # To alert Executors/Witnesses

src/estate-service/src/presentation/will/
│
├── controllers/
│   ├── will.command.controller.ts         # [WRITE API]
│   │                                      # Handles all state changes (Drafting, Signing, Revoking).
│   │                                      # Endpoints: POST /wills, POST /wills/{id}/execute, etc.
│   │
│   └── will.query.controller.ts           # [READ API]
│                                          # Handles data retrieval and reports.
│                                          # Endpoints: GET /wills/{id}, GET /wills/{id}/compliance-report
│
├── dtos/
│   ├── request/                           # [INPUTS] Validated via class-validator
│   │   # --- Lifecycle Management ---
│   │   ├── create-draft-will.dto.ts       # Initial setup (S.5 Capacity inputs)
│   │   ├── execute-will.dto.ts            # The "Ceremony" inputs (S.11 Witnesses)
│   │   ├── revoke-will.dto.ts             # Reason & Method (Marriage/Destruction)
│   │
│   │   # --- Asset & Beneficiary Mgmt ---
│   │   ├── add-beneficiary.dto.ts         # Bequests & Gifts
│   │   ├── record-disinheritance.dto.ts   # S.26 Exclusion Records
│   │
│   │   # --- Administrative Appointments ---
│   │   ├── appoint-executor.dto.ts        # Nomination details
│   │   ├── add-witness.dto.ts             # Nomination of witnesses (Draft phase)
│   │   ├── record-witness-signature.dto.ts # Digital signing event
│   │
│   │   # --- Amendments & Updates ---
│   │   ├── add-codicil.dto.ts             # Formal amendment to executed will
│   │   ├── update-capacity.dto.ts         # Uploading medical evidence
│   │   └── will-search-filter.dto.ts      # For the advanced search query
│   │
│   └── response/                          # [OUTPUTS] Swagger documented (@ApiProperty)
│       ├── will-detail.response.dto.ts    # Full Aggregate view (Deep)
│       ├── will-summary.response.dto.ts   # List view (Lightweight)
│       ├── compliance-report.response.dto.ts # The "Radar" (Violations/Warnings)
│       ├── executor-assignment.response.dto.ts # "My Jobs" dashboard item
│       └── paginated-will.response.dto.ts # Generic wrapper for search results
│
└── mappers/
    └── will-presenter.mapper.ts           # [TRANSFORMER]
                                           # Decouples Application ViewModels from API JSON.
                                           # Handles date formatting and status code mapping.
                                           
src/estate-service/src/application/estate/
│
├── commands/                                  # ⚡ WRITE SIDE (State Changes & Business Rules)
│   ├── dtos/                                  # Data Transfer Objects (Input Validation)
│   │   // --- Estate Lifecycle ---
│   │   ├── create-estate.dto.ts
│   │   ├── freeze-estate.dto.ts               # Requires reason (e.g., "Court Order")
│   │   ├── unfreeze-estate.dto.ts
│   │   ├── close-estate.dto.ts
│   │
│   │   // --- Asset Management (Polymorphic) ---
│   │   ├── add-asset.dto.ts                   # Generic wrapper
│   │   ├── add-land-asset.dto.ts              # Specifics: LR Number, Title Deed
│   │   ├── add-financial-asset.dto.ts         # Specifics: Bank, Account No
│   │   ├── update-asset-value.dto.ts          # Valuation history
│   │   ├── encumber-asset.dto.ts              # Mark as collateral
│   │   ├── manage-asset-co-ownership.dto.ts   # Add/Remove co-owners
│   │
│   │   // --- Liquidation (The Cash Converter) ---
│   │   ├── initiate-liquidation.dto.ts
│   │   ├── approve-liquidation.dto.ts         # Court/Executor approval
│   │   ├── record-liquidation-sale.dto.ts     # Sale details & buyer info
│   │
│   │   // --- Debt Management (S.45 Engine) ---
│   │   ├── add-debt.dto.ts
│   │   ├── pay-debt.dto.ts                    # Manual single payment
│   │   ├── execute-s45-waterfall.dto.ts       # 🚀 Auto-pay highest priority debts
│   │   ├── dispute-debt.dto.ts
│   │   ├── write-off-debt.dto.ts
│   │
│   │   // --- Tax Compliance (The Gatekeeper) ---
│   │   ├── record-tax-assessment.dto.ts
│   │   ├── record-tax-payment.dto.ts
│   │   ├── upload-clearance-certificate.dto.ts
│   │   ├── apply-for-tax-exemption.dto.ts
│   │
│   │   // --- Dependants (S.26/S.29) ---
│   │   ├── file-dependant-claim.dto.ts
│   │   ├── verify-dependant-evidence.dto.ts
│   │   ├── adjudicate-claim.dto.ts            # Approve/Reject logic
│   │
│   │   // --- Gifts (S.35 Hotchpot) ---
│   │   ├── record-gift-inter-vivos.dto.ts
│   │   ├── contest-gift.dto.ts
│   │   └── resolve-gift-dispute.dto.ts
│   │
│   ├── handlers/                              # Use Cases / Business Logic
│   │   // --- Lifecycle Handlers ---
│   │   ├── create-estate.handler.ts
│   │   ├── manage-estate-freeze.handler.ts
│   │
│   │   // --- Inventory Handlers ---
│   │   ├── add-asset.handler.ts               # Uses Factory Methods based on type
│   │   ├── manage-asset-valuation.handler.ts  # Enforces professional valuation rules
│   │   ├── liquidation-process.handler.ts     # Manages the complex liquidation state machine
│   │
│   │   // --- Liability Handlers ---
│   │   ├── manage-debt-registry.handler.ts    # Add/Update debts
│   │   ├── debt-payment.handler.ts            # 🛡️ Critical: Enforces S.45 Priority
│   │   ├── manage-tax-compliance.handler.ts
│   │
│   │   // --- Claimant Handlers ---
│   │   ├── manage-dependants.handler.ts       # S.29 Risk Analysis
│   │   └── manage-hotchpot-gifts.handler.ts   # S.35 Calculations
│   │
│   └── impl/                                  # NestJS CQRS Command Classes
│       ├── create-estate.command.ts
│       ├── execute-s45-waterfall.command.ts
│       └── ... (matching handlers)
│
├── queries/                                   # 🔍 READ SIDE (Reporting & Analytics)
│   ├── dtos/
│   │   ├── estate-search.dto.ts               # Filter by Status, Date, Net Worth
│   │   ├── financial-report.dto.ts
│   │   └── solvency-check.dto.ts
│   │
│   ├── handlers/
│   │   ├── get-estate-by-id.handler.ts
│   │   ├── get-estate-financials.handler.ts   # Net Worth, Liquidity, Solvency Ratio
│   │   ├── get-s45-priority-list.handler.ts   # "Who gets paid next?"
│   │   ├── check-distribution-readiness.handler.ts # 🚦 The 7-point check
│   │   └── get-hotchpot-analysis.handler.ts   # Impact of gifts on distribution
│   │
│   ├── impl/
│   │   ├── get-estate-financials.query.ts
│   │   └── ... (matching handlers)
│   │
│   └── view-models/                           # Specialized Return Objects
│       ├── estate-dashboard.vm.ts             # High-level overview
│       ├── asset-inventory.vm.ts              # Detailed list with co-ownership info
│       ├── debt-waterfall.vm.ts               # Visualizing S.45 priority
│       ├── solvency-radar.vm.ts               # 🚀 Insolvency warning system
│       └── distribution-preview.vm.ts         # "If we distributed today, who gets what?"
│
├── services/                                  # 🧠 DOMAIN ORCHESTRATION & CALCULATORS
│   ├── estate-solvency.service.ts             # The "Solvency Radar" Engine
│   │                                          # Monitors Assets vs Liabilities in real-time
│   │
│   ├── s45-priority.service.ts                # The "Waterfall" Engine
│   │                                          # Calculates exact payment order
│   │
│   ├── distribution-readiness.service.ts      # The "Gatekeeper"
│   │                                          # Runs the 7-point validation check
│   │
│   ├── hotchpot-calculator.service.ts         # The "S.35 Math"
│   │                                          # Adjusts shares based on Gifts Inter Vivos
│   │
│   └── document-verification.service.ts       # Integration with external AI/Manual verification
│
├── events/                                    # 📢 EVENT SUBSCRIBERS (Side Effects)
│   ├── estate-insolvency-alert.subscriber.ts  # Notifications when Net Worth dips < 0
│   ├── high-risk-dependant.subscriber.ts      # Alerts legal team on S.29 disputes
│   └── tax-clearance.subscriber.ts            # Unlocks distribution when Tax Cleared
│
├── jobs/                                      # ⏰ BACKGROUND TASKS (Cron)
│   ├── statute-barred-debt-checker.job.ts     # Auto-flags debts > 6/12 years old
│   └── liquidation-deadline-monitor.job.ts    # Alerts if assets aren't sold in time
│
└── interfaces/                                # 🔌 PORTS (External Dependencies)
    ├── storage.interface.ts                   # For Document URLs
    ├── notification.interface.ts              # Email/SMS
    └── family-service.interface.ts            # Validating kinship