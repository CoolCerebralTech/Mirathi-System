family-service/
├── domain/
│   ├── aggregates/
│   │   ├── family.aggregate.ts              # Main aggregate with Family + Members
│   │   ├── guardianship.aggregate.ts        # S.70-73 guardianship lifecycle
│   │   ├── dependency-assessment.aggregate.ts # S.29 dependant lifecycle
│   ├── entities/
│   │   ├── family-member.entity.ts
│   │   ├── marriage.entity.ts
│   │   ├── family-relationship.entity.ts
│   │   ├── polygamous-house.entity.ts
│   │   ├── guardian.entity.ts
│   │   ├── legal-dependant.entity.ts
│   │   ├── cohabitation-record.entity.ts
│   │   ├── adoption-order.entity.ts
│   │   └── family-legal-event.entity.ts
│   ├── value-objects/
│   │   ├── identity/
│   │   │   ├── kenyan-identity.vo.ts
│   │   │   ├── national-id.vo.ts
│   │   │   ├── kra-pin.vo.ts
│   │   │   ├── birth-certificate.vo.ts
│   │   │   ├── death-certificate.vo.ts
│   │   │   └── identification-verification.vo.ts
│   │   ├── personal/
│   │   │   ├── kenyan-name.vo.ts
│   │   │   ├── contact-info.vo.ts
│   │   │   ├── disability-status.vo.ts
│   │   │   ├── life-status.vo.ts
│   │   │   ├── age-calculation.vo.ts
│   │   │   └── demographic-info.vo.ts
│   │   ├── legal/
│   │   │   ├── kenyan-law-section.vo.ts
│   │   │   ├── marriage-details.vo.ts
│   │   │   ├── polygamous-house-details.vo.ts
│   │   │   ├── customary-marriage.vo.ts
│   │   │   ├── islamic-marriage.vo.ts
│   │   │   ├── relationship-type.vo.ts
│   │   │   ├── inheritance-rights.vo.ts
│   │   │   ├── guardianship-type.vo.ts
│   │   │   ├── dependency-level.vo.ts
│   │   │   └── legal-capacity.vo.ts
│   │   ├── financial/
│   │   │   ├── bride-price.vo.ts
│   │   ├── geographical/
│   │   │   ├── kenyan-location.vo.ts
│   │   │   ├── kenyan-county.vo.ts
│   │   └── temporal/
│   │       ├── kenyan-marriage-dates.vo.ts
│   ├── policies/
│   │   ├── marriage-validity.policy.ts
│   │   ├── next-of-kin-determination.policy.ts
│   │   ├── law-of-succession-act/
    │   |   ├── section-29-dependant.policy.ts
│   |   |   ├── section-35-intestate.policy.ts
│   |   |   ├── section-40-polygamy.policy.ts
│   |   |   └── section-70-guardianship.policy.ts
        ├── children-act/
        │   ├── adoption-validity.policy.ts
│   ├── events/
│   │   ├── family-events/
│   │   │   ├── family-created.event.ts
│   │   │   ├── family-member-added.event.ts
│   │   │   ├── family-member-updated.event.ts
│   │   │   ├── family-member-deceased.event.ts
│   │   │   └── family-member-removed.event.ts
│   │   ├── marriage-events/
│   │   │   ├── marriage-registered.event.ts
│   │   │   ├── marriage-dissolved.event.ts
│   │   │   ├── polygamous-house-created.event.ts
│   │   │   └── customary-marriage-recognized.event.ts
│   │   ├── guardianship-events/
│   │   │   ├── guardian-appointed.event.ts
│   │   │   ├── guardian-bond-posted.event.ts
│   │   │   ├── guardianship-terminated.event.ts
│   │   │   └── annual-report-filed.event.ts
│   │   ├── dependency-events/
│   │   │   ├── dependant-declared.event.ts
│   │   │   ├── dependency-assessed.event.ts
│   │   │   ├── court-provision-ordered.event.ts
│   │   │   └── dependant-evidence-verified.event.ts
│   │   └── relationship-events/
│   │       ├── relationship-established.event.ts
│   │       ├── relationship-verified.event.ts
│   │       ├── adoption-finalized.event.ts
│   │       └── next-of-kin-designated.event.ts
│   ├── specifications/
│   │   ├── family-specifications/
│   │   │   ├── is-family-polygamous.spec.ts
│   │   │   ├── has-living-spouse.spec.ts
│   │   │   └── has-minor-children.spec.ts
│   │   ├── member-specifications/
│   │   │   ├── is-legal-dependant.spec.ts
│   │   │   ├── is-eligible-guardian.spec.ts
│   │   │   ├── is-marriage-eligible.spec.ts
│   │   │   └── is-verifiable-identity.spec.ts
│   │   └── relationship-specifications/
│   │       ├── is-biological-relationship.spec.ts
│   │       ├── is-adoption-valid.spec.ts
│   │       └── is-cohabitation-qualifying.spec.ts
│   ├── interfaces/
│   │   ├── repositories/
|   |   |   |   ifamily-relationship.repository.ts
|   |   |   |   Ipolygamous-house.repository.ts
│   │   │   ├── ifamily.repository.ts
│   │   │   ├── ifamily-member.repository.ts
│   │   │   ├── imarriage.repository.ts
│   │   │   ├── iguardianship.repository.ts
│   │   │   └── idependancy.repository.ts
│   │   ├── services/
|   |   |   |   iadoption.service.ts
|   |   |   |   inext-of-kin.service.ts
|   |   |   |   ipolygamy.service.ts
│   │   │   ├── ikenyan-law.service.ts
│   │   │   ├── ifamily-validation.service.ts
│   │   │   ├── iidentity-verification.service.ts
│   │   │   └── idependency-calculator.service.ts
│   ├── exceptions/
│   │   ├── family.exception.ts
│   │   ├── marriage.exception.ts
│   │   ├── guardianship.exception.ts
│   │   ├── relationship.exception.ts
│   │   ├── polygamy.exception.ts
│   │   └── dependant.exception.ts
│   └── utils/
│       ├── 
│       ├── family-tree-builder.ts
│       ├── age-calculator.ts
│       ├── dependency-validator.ts
│       └── relationship-mapper.ts
├── application/
├── presentation/
└── infrastructure/

// infrastructure/persistence/
├── repositories/
│   ├── impl/
│   │   ├── family.repository.impl.ts
│   │   ├── family-member.repository.impl.ts
│   │   ├── marriage.repository.impl.ts
│   │   ├── guardianship.repository.impl.ts
│   │   ├── legal-dependant.repository.impl.ts
│   │   ├── polygamous-house.repository.impl.ts
│   │   ├── family-relationship.repository.impl.ts
│   │   └── family-legal-event.repository.impl.ts
│   ├── base/
│   │   ├── base.repository.ts
│   │   └── transaction.manager.ts
│   └── index.ts
├── mappers/
│   ├── family.mapper.ts
│   ├── family-member.mapper.ts
│   ├── marriage.mapper.ts
│   ├── guardianship.mapper.ts
│   ├── legal-dependant.mapper.ts
│   ├── polygamous-house.mapper.ts
│   ├── family-relationship.mapper.ts
│   ├── cohabitation-record.mapper.ts
│   ├── adoption-order.mapper.ts
│   └── family-legal-event.mapper.ts
└── persistence.module.ts  # NEW: Simplified module

application/
├── common/
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   ├── metadata.dto.ts
│   │   └── error-response.dto.ts
│   ├── mapper/
│   │   └── base.mapper.ts
│   ├── services/
│   │   └── unit-of-work.service.ts
│   └── interfaces/
│       ├── command.ts
│       ├── query.ts
│       └── handler.ts
│
├── dependency/
├── guardianship/
├── family/
│
application/dependency/
├── dto/
│   ├── request/
│   │   ├── create-dependency-assessment.request.ts
│   │   ├── assess-financial-dependency.request.ts
│   │   ├── file-s26-claim.request.ts
│   │   └── record-court-provision.request.ts
│   │
│   └── response/
│       ├── dependency-assessment.response.ts
│       └── dependency-status.response.ts
│
├── commands/
│   ├── impl/
│   │   ├── create-dependency-assessment.command.ts
│   │   ├── assess-financial-dependency.command.ts
│   │   ├── file-s26-claim.command.ts
│   │   └── record-court-provision.command.ts
│   │
│   └── handlers/
│       ├── create-dependency-assessment.handler.ts
│       ├── assess-financial-dependency.handler.ts
│       ├── file-s26-claim.handler.ts
│       └── record-court-provision.handler.ts
│
├── queries/
│   ├── impl/
│   │   ├── get-dependency-by-id.query.ts
│   │   ├── list-dependencies-by-deceased.query.ts
│   │   └── check-s29-compliance.query.ts
│   │
│   └── handlers/
│       ├── get-dependency-by-id.handler.ts
│       ├── list-dependencies-by-deceased.handler.ts
│       └── check-s29-compliance.handler.ts
│
├── mappers/
│   └── dependency.mapper.ts
│
├── services/
│   └── dependency-application.service.ts
│
├── ports/
│   ├── inbound/
│   │   └── dependency.use-case.ts
│   │
│   └── outbound/
│       └── dependency-repository.port.ts
│
└── dependency.module.ts

application/guardianship/
├── dto/
│   ├── request/
│   │   ├── appoint-guardian.request.ts
│   │   ├── post-bond.request.ts
│   │   ├── file-annual-report.request.ts
│   │   └── terminate-guardianship.request.ts
│   │
│   └── response/
│       └── guardianship.response.ts
│
├── commands/
├── queries/
├── mappers/
├── services/
├── ports/
└── guardianship.module.ts

application/family/
├── dto/
│   ├── request/
│   │   ├── add-family-member.request.ts
│   │   ├── define-relationship.request.ts
│   │   └── mark-next-of-kin.request.ts
│   │
│   └── response/
│       ├── family-tree.response.ts
│       └── family-member.response.ts
│
├── commands/
│   ├── impl/
│   │   ├── add-family-member.command.ts
│   │   ├── define-relationship.command.ts
│   │   └── mark-next-of-kin.command.ts
│   │
│   └── handlers/
│
├── queries/
│   ├── impl/
│   │   ├── get-family-tree.query.ts
│   │   └── list-next-of-kin.query.ts
│   │
│   └── handlers/
│
├── mappers/
│   └── family.mapper.ts
│
├── services/
│   └── family-application.service.ts
│
├── ports/
│   ├── inbound/
│   │   └── family.use-case.ts
│   │
│   └── outbound/
│       └── family-repository.port.ts
│
└── family.module.ts

