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

family-service/
├── domain/
│   ├── aggregates/
│   │   ├── family/                  <-- DIRECTORY FOR THE AGGREGATE
│   │   │   ├── family.aggregate.ts  <-- THE BOSS (Root)
│   │   │   ├── entities/            <-- Internal parts of Family
│   │   │   │   ├── family-member.entity.ts
│   │   │   │   ├── marriage.entity.ts
│   │   │   │   ├── polygamous-house.entity.ts
│   │   │   │   ├── family-relationship.entity.ts
│   │   │   │   ├── cohabitation-record.entity.ts
│   │   │   │   └── adoption-order.entity.ts
│   │   │   └── value-objects/       <-- VOs specific to Family
│   │   │       ├── kenyan-identity.vo.ts
│   │   │       └── ...
│   │   │
│   │   ├── guardianship/            <-- SEPARATE AGGREGATE
│   │   │   ├── guardianship.aggregate.ts
│   │   │   ├── entities/
│   │   │   │   └── guardian-appointment.entity.ts
│   │   │   └── value-objects/
│   │   │       └── guardian-bond.vo.ts
│   │   │
│   │   └── dependency/              <-- SEPARATE AGGREGATE
│   │       ├── legal-dependant.aggregate.ts
│   │       └── entities/
│   │           └── evidence-record.entity.ts
│   │
│   ├── interfaces/
│   │   ├── repositories/
│   │   │   ├── ifamily.repository.ts       <-- SAVES THE WHOLE FAMILY GRAPH
│   │   │   ├── iguardianship.repository.ts
│   │   │   └── idependency.repository.ts
│   │
│   └── events/ ... (Keep your events, they are good)

├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   ├── family.repository.ts       <-- Implements IFamilyRepository
│   │   │   ├── guardianship.repository.ts <-- Implements IGuardianshipRepository
│   │   │   └── dependency.repository.ts   <-- Implements IDependencyRepository
│   │   │
│   │   ├── daos/                          <-- DATA ACCESS OBJECTS (Optional helper layer)
│   │   │   │  // It is okay to have these strictly for Prisma logic, 
│   │   │   │  // but they MUST NOT be exposed to the Domain or Application layer.
│   │   │   ├── prisma-family-member.dao.ts
│   │   │   ├── prisma-marriage.dao.ts
│   │   │   └── ...