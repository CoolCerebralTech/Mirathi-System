src/application/guardianship/
├── commands/
│   ├── impl/
│   │   ├── create-guardianship.command.ts
│   │   ├── appoint-guardian.command.ts
│   │   ├── activate-guardianship.command.ts
│   │   ├── submit-compliance.command.ts
│   │   ├── post-bond.command.ts
│   │   └── terminate-guardianship.command.ts
│   │
│   └── handlers/
│       ├── create-guardianship.handler.ts
│       ├── appoint-guardian.handler.ts
│       ├── activate-guardianship.handler.ts
│       ├── submit-compliance.handler.ts
│       ├── post-bond.handler.ts
│       └── terminate-guardianship.handler.ts
│
├── queries/
│   ├── impl/
│   │   ├── get-guardianship-by-id.query.ts
│   │   ├── get-compliance-dashboard.query.ts
│   │   ├── get-active-guardians.query.ts
│   │   └── get-guardian-assignments.query.ts
│   │
│   ├── handlers/
│   │   ├── get-guardianship-by-id.handler.ts
│   │   ├── get-compliance-dashboard.handler.ts
│   │   ├── get-active-guardians.handler.ts
│   │   └── get-guardian-assignments.handler.ts
│   │
│   └── read-models/
│       ├── guardianship-details.read-model.ts
│       ├── compliance-dashboard.read-model.ts
│       ├── guardian-summary.read-model.ts
│       └── guardianship-list-item.read-model.ts
│
├── ports/
│   ├── inbound/
│   │   └── guardianship.use-case.ts
│
├── services/
│   ├── guardianship-application.service.ts
│   ├── guardianship-notification.service.ts
│   └── guardianship-transaction.service.ts
│
└── mappers/
    ├── guardianship-command.mapper.ts
    └── guardianship-read.mapper.ts

src/application/family/
├── commands/
│   ├── impl/
│   │   ├── create-family.command.ts
│   │   ├── add-family-member.command.ts
│   │   ├── register-marriage.command.ts
│   │   ├── establish-house.command.ts
│   │   ├── define-relationship.command.ts
│   │   ├── record-cohabitation.command.ts
│   │   └── record-adoption.command.ts
│   │
│   └── handlers/
│       ├── create-family.handler.ts
│       ├── add-family-member.handler.ts
│       ├── register-marriage.handler.ts
│       ├── establish-house.handler.ts
│       ├── define-relationship.handler.ts
│       ├── record-cohabitation.handler.ts
│       └── record-adoption.handler.ts
│
├── queries/
│   ├── impl/
│   │   ├── get-family-by-id.query.ts
│   │   ├── get-family-members.query.ts
│   │   ├── get-family-tree.query.ts
│   │   └── get-polygamy-status.query.ts
│   │
│   ├── handlers/
│   │   ├── get-family-by-id.handler.ts
│   │   ├── get-family-members.handler.ts
│   │   ├── get-family-tree.handler.ts
│   │   └── get-polygamy-status.handler.ts
│   │
│   └── read-models/
│       ├── family-details.read-model.ts
│       ├── family-member.read-model.ts
│       ├── family-tree-node.read-model.ts
│       └── polygamy-status.read-model.ts
│
├── ports/
│   ├── inbound/
│   │   └── family.use-case.ts
│   │
│   └── outbound/
│       ├── ifamily-repository.port.ts
│       ├── iaudit-log.port.ts
│       └── iclock.port.ts
│
├── services/
│   └── family-application.service.ts
│
└── mappers/
    ├── family-command.mapper.ts
    └── family-read.mapper.ts

src/presentation/guardianship/
├── controllers/
│   ├── guardianship.command.controller.ts
│   └── guardianship.query.controller.ts
│
├── dto/
│   ├── request/
│   │   ├── create-guardianship.dto.ts
│   │   ├── appoint-guardian.dto.ts
│   │   ├── activate-guardianship.dto.ts
│   │   ├── submit-compliance.dto.ts
│   │   └── terminate-guardianship.dto.ts
│   │
│   └── response/
│       ├── guardianship-details.dto.ts
│       ├── guardian-summary.dto.ts
│       ├── compliance-dashboard.dto.ts
│       └── compliance-summary.dto.ts
│
└── mappers/
    └── guardianship.presenter.mapper.ts

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
