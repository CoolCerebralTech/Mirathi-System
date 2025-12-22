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
│   │   │   ├── ifamily.repository.ts
│   │   │   ├── iguardianship.repository.ts
│   │   │   └── idependancy.repository.ts
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
|   |   |   adoption-order.repository.ts
|   |   |   cohabitation-record.repository.ts
│   │   ├── family.repository.ts
│   │   ├── family-member.repository.ts
│   │   ├── marriage.repository.ts
│   │   ├── guardianship.repository.ts
│   │   ├── legal-dependant.repository.ts
│   │   ├── polygamous-house.repository.ts
│   │   ├── family-relationship.repository.ts
│   │   └── family-legal-event.repository.ts
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

application/
├── common/ (shared across bounded contexts)
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── error-response.dto.ts
│   ├── interfaces/
│   │   └── use-case.interface.ts
│
├── family/
│   ├── dto/
│   │   ├── request/
│   │   │   ├── create-family.request.ts
│   │   │   ├── add-family-member.request.ts
│   │   │   ├── update-family-member.request.ts
│   │   │   ├── register-marriage.request.ts
│   │   │   ├── add-polygamous-house.request.ts
│   │   │   └── archive-family.request.ts
│   │   │
│   │   └── response/
│   │       ├── family.response.ts
│   │       ├── family-member.response.ts
│   │       ├── marriage.response.ts
│   │       ├── polygamous-house.response.ts
│   │       └── family-tree.response.ts
│   │
│   ├── commands/
│   │   ├── impl/
│   │   │   ├── create-family.command.ts
│   │   │   ├── add-family-member.command.ts
│   │   │   ├── update-family-member.command.ts
│   │   │   ├── remove-family-member.command.ts
│   │   │   ├── mark-member-deceased.command.ts
│   │   │   ├── register-marriage.command.ts
│   │   │   └── add-polygamous-house.command.ts
│   │   │
│   │   └── handlers/
│   │       ├── create-family.handler.ts
│   │       ├── add-family-member.handler.ts
│   │       ├── update-family-member.handler.ts
│   │       ├── remove-family-member.handler.ts
│   │       ├── mark-member-deceased.handler.ts
│   │       ├── register-marriage.handler.ts
│   │       └── add-polygamous-house.handler.ts
│   │
│   ├── queries/
│   │   ├── impl/
│   │   │   ├── get-family-by-id.query.ts
│   │   │   ├── get-family-members.query.ts
│   │   │   ├── get-family-tree.query.ts
│   │   │   ├── search-families.query.ts
│   │   │   └── check-s40-compliance.query.ts
│   │   │
│   │   └── handlers/
│   │       ├── get-family-by-id.handler.ts
│   │       ├── get-family-members.handler.ts
│   │       ├── get-family-tree.handler.ts
│   │       ├── search-families.handler.ts
│   │       └── check-s40-compliance.handler.ts
│   │
│   ├── mappers/
│   │   └── family.mapper.ts
│   │
│   ├── ports/
│   │   ├── inbound/
│   │   │   └── family.use-case.ts
│   │
│   └── services/
│       └── family-application.service.ts (implements use-case interface)

