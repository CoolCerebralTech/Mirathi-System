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