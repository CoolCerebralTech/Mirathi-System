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
│   │   │   ├── dependency-calculation.vo.ts
│   │   │   ├── monthly-support.vo.ts
│   │   │   ├── bride-price.vo.ts
│   │   │   ├── guardian-bond.vo.ts
│   │   │   └── allowance-amount.vo.ts
│   │   ├── geographical/
│   │   │   ├── kenyan-location.vo.ts
│   │   │   ├── kenyan-county.vo.ts
│   │   │   ├── ancestral-home.vo.ts
│   │   │   ├── clan-details.vo.ts
│   │   │   └── gps-coordinates.vo.ts
│   │   └── temporal/
│   │       ├── kenyan-marriage-dates.vo.ts
│   │       ├── dependency-period.vo.ts
│   │       ├── guardianship-term.vo.ts
│   │       └── cohabitation-duration.vo.ts
│   ├── policies/
│   │   ├── law-of-succession-act/
    │   |   ├── section-29-dependant.policy.ts
│   |   |   ├── section-35-intestate.policy.ts
│   |   |   ├── section-40-polygamy.policy.ts
│   |   |   └── section-70-guardianship.policy.ts
        ├── children-act/
        │   ├── adoption-validity.policy.ts
            └── child-welfare.policy.ts
        └── matrimonial-property-act/
            └── matrimonial-property.policy.ts
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
│   │   │   ├── ifamily-member.repository.ts
│   │   │   ├── imarriage.repository.ts
│   │   │   ├── iguardianship.repository.ts
│   │   │   └── idependancy.repository.ts
│   │   ├── services/
│   │   │   ├── ikenyan-law.service.ts
│   │   │   ├── ifamily-validation.service.ts
│   │   │   ├── iidentity-verification.service.ts
│   │   │   └── idependency-calculator.service.ts
│   ├── exceptions/
│   │   ├── family-domain-exception.ts
│   │   ├── invalid-marriage.exception.ts
│   │   ├── invalid-guardianship.exception.ts
│   │   ├── duplicate-relationship.exception.ts
│   │   ├── polygamy-violation.exception.ts
│   │   └── dependant-validation.exception.ts
│   └── utils/
│       ├── kenyan-law-calculator.ts
│       ├── family-tree-builder.ts
│       ├── age-calculator.ts
│       ├── dependency-validator.ts
│       └── relationship-mapper.ts
├── application/
├── presentation/
└── infrastructure/