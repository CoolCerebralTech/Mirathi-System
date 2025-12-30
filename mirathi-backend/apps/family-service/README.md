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

src/application/guardianship/
├── commands/
│   ├── impl/
│   │   // --- Lifecycle & Setup ---
│   │   ├── create-guardianship.command.ts          # specific to Minor/Incaps
│   │   ├── activate-guardianship.command.ts        # Transition Pending -> Active
│   │   ├── terminate-guardianship.command.ts       # Closing the case
│   │
│   │   // --- Guardian Management ---
│   │   ├── appoint-guardian.command.ts             # Adding a guardian
│   │   ├── suspend-guardian.command.ts             # For misconduct/investigation
│   │   ├── reactivate-guardian.command.ts          # After suspension
│   │   ├── update-guardian-powers.command.ts       # Changing legal authority
│   │   ├── post-bond.command.ts                    # Financial security
│   │
│   │   // --- Conflict of Interest (Innovative) ---
│   │   ├── record-conflict-of-interest.command.ts  # Whistleblowing/Detection
│   │   ├── resolve-conflict-of-interest.command.ts # Mitigation plan
│   │
│   │   // --- Compliance & AI Reporting ---
│   │   ├── auto-generate-report-section.command.ts # The "AI" feature
│   │   ├── submit-compliance-report.command.ts     # E-filing
│   │   ├── review-compliance-report.command.ts     # Court/Lawyer review
│   │   └── request-report-amendment.command.ts     # Feedback loop
│   │
│   └── handlers/
│       ├── create-guardianship.handler.ts
│       ├── activate-guardianship.handler.ts
│       ├── terminate-guardianship.handler.ts
│       ├── appoint-guardian.handler.ts
│       ├── suspend-guardian.handler.ts
│       ├── reactivate-guardian.handler.ts
│       ├── update-guardian-powers.handler.ts
│       ├── post-bond.handler.ts
│       ├── record-conflict-of-interest.handler.ts
│       ├── resolve-conflict-of-interest.handler.ts
│       ├── auto-generate-report-section.handler.ts
│       ├── submit-compliance-report.handler.ts
│       ├── review-compliance-report.handler.ts
│       └── request-report-amendment.handler.ts
│
├── queries/
│   ├── impl/
│   │   ├── get-guardianship-by-id.query.ts
│   │   ├── search-guardianships.query.ts           # Advanced Filtering
│   │   ├── get-ward-compliance-history.query.ts    # Audit trail
│   │   ├── get-guardianship-risk-report.query.ts   # "Digital Lawyer" Analysis
│   │   └── get-court-document-preview.query.ts     # PDF Preview
│   │
│   ├── handlers/
│   │   ├── get-guardianship-by-id.handler.ts
│   │   ├── search-guardianships.handler.ts
│   │   ├── get-ward-compliance-history.handler.ts
│   │   ├── get-guardianship-risk-report.handler.ts
│   │   └── get-court-document-preview.handler.ts
│   │
│   └── read-models/
│       ├── guardianship-detail.vm.ts               # Full view
│       ├── guardianship-list-item.vm.ts            # Table view
│       ├── compliance-timeline.vm.ts               # Visual timeline
│       └── risk-assessment.vm.ts                   # Red/Yellow/Green indicators
│
└── services/
    ├── guardianship-mapper.service.ts              # Domain -> Read Model
    └── guardianship-notification.service.ts        # Reminders logic

src/presentation/guardianship/
├── controllers/
│   ├── guardianship.command.controller.ts    # [WRITE] All mutations (POST/PUT/PATCH)
│   └── guardianship.query.controller.ts      # [READ] All data retrieval (GET)
│
├── dto/
│   ├── request/
│   │   ├── lifecycle/                        # Setup & Teardown
│   │   │   ├── create-guardianship.dto.ts
│   │   │   ├── activate-guardianship.dto.ts
│   │   │   └── terminate-guardianship.dto.ts
│   │   │
│   │   ├── guardian-ops/                     # Managing the people
│   │   │   ├── appoint-guardian.dto.ts
│   │   │   ├── update-guardian-powers.dto.ts
│   │   │   ├── post-bond.dto.ts
│   │   │   └── suspend-guardian.dto.ts       # Includes Reactivate
│   │   │
│   │   ├── compliance/                       # The "Digital Lawyer" features
│   │   │   ├── submit-compliance.dto.ts
│   │   │   ├── auto-generate-section.dto.ts
│   │   │   └── review-compliance.dto.ts      # Accept/Request Amendment
│   │   │
│   │   └── risk/                             # Whistleblowing
│   │       ├── record-conflict.dto.ts
│   │       └── resolve-conflict.dto.ts
│   │
│   └── response/
│       ├── guardianship-details.response.dto.ts
│       ├── guardianship-list.response.dto.ts
│       ├── compliance-timeline.response.dto.ts
│       └── risk-assessment.response.dto.ts
│
└── mappers/
    └── guardianship-api.mapper.ts            # Converts Application Result -> HTTP Response

src/presentation/family/
├── controllers/
│   ├── family.command.controller.ts
│   └── family.query.controller.ts
│
├── dto/
│   ├── request/
│   │   ├── create-family.dto.ts
│   │   ├── add-family-member.dto.ts
│   │   ├── register-marriage.dto.ts
│   │   ├── define-relationship.dto.ts
│   │   ├── record-cohabitation.dto.ts
│   │   └── record-adoption.dto.ts
│   │
│   └── response/
│       ├── family-details.dto.ts
│       ├── family-member.dto.ts
│       ├── family-tree.dto.ts
│       └── polygamy-status.dto.ts
│
└── mappers/
    └── family.presenter.mapper.ts
