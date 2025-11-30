succession-service/ └── src/ ├── succession.module.ts # Root module └── main.ts

common/ ├── decorators/ # Custom decorators | | family-access.decoartor.ts | |
roles.decorator.ts | | will-status.decorator.ts │ ├──
kenyan-law-validation.decorator.ts │ ├── legal-capacity.decorator.ts │ ├──
ownership.decorator.ts │ ├── family-relationship.decorator.ts │ └──
succession-compliance.decorator.ts │ ├── guards/ # Authentication &
authorization | | roles.guard.ts | | family-relationship.guard.ts │ ├──
ownership.guard.ts # Users can only access their own data │ ├──
will-status.guard.ts # Prevent edits on active wills │ ├──
kenyan-law-validation.guard.ts # Kenyan law validation │ ├──
family-member-access.guard.ts # Family data access control │ └──
probate-court-role.guard.ts # Court role-based access │ ├── pipes/ # Validation
& transformation │ ├── kenyan-id-validation.pipe.ts # National ID validation │
├── asset-valuation.pipe.ts # Asset value validation │ ├──
share-percentage.pipe.ts # 0-100% validation │ ├── family-relationship.pipe.ts #
Valid relationship types │ ├── kenyan-phone.pipe.ts # Phone number validation │
├── filters/ # Exception filters │ ├── kenyan-law-violation.filter.ts # Legal
compliance errors │ ├── business-rule-violation.filter.ts │ ├──
validation-error.filter.ts │ └── global-exception.filter.ts │ ├── utils/ #
Utility functions | | feature-flag.ts | | kenayan-court-fee-calculator | |
validation.ts │ ├── kenyan-succession-calculator.ts # Intestate calculations │
├── legal-formality-checker.ts # Will formalities validation │ ├──
probate-processor.ts # Court process utilities │ ├── family-tree-builder.ts #
Tree structure utilities │ ├── asset-valuation-helper.ts # Kenyan market rates │
├── date-calculator.ts # Legal timeframes │ ├── kenyan-currency-formatter.ts #
KES formatting │ ├── constants/ # Shared constants │ ├──
kenyan-law.constants.ts # Law of Succession Act sections │ ├──
succession-rules.constants.ts # Business rules │ ├──
court-jurisdiction.constants.ts # Kenyan court levels │ ├──
relationship-types.constants.ts # Family relationships │ ├──
asset-types.constants.ts # Kenyan asset categories │ ├──
will-status.constants.ts # Will lifecycle │ ├──
distribution-rules.constants.ts # Intestate succession │ └──
legal-timeframes.constants.ts # Court deadlines │ ├── types/ # TypeScript types
│ ├── kenyan-law.types.ts # Legal types │ ├── succession.types.ts # Domain types
│ ├── api.types.ts # API contract types │ ├── config/ # Configuration │ ├──
succession.config.ts # Succession service config │ ├── legal-rules.config.ts #
Kenyan law rules │ ├── court-fees.config.ts # Probate court fees | |
valuation.config.ts │ └── feature-flags.config.ts # Feature toggles |

estate-planning/ ├── presentation/ │ └── controllers/ │ ├── will.controller.ts │
├── asset.controller.ts │ ├── beneficiary.controller.ts │ ├──
executor.controller.ts │ └── witness.controller.ts │ ├── application/ │ ├──
commands/ # WRITE operations │ │ ├── create-will.command.ts │ │ ├──
update-will.command.ts │ │ ├── add-asset.command.ts │ │ ├──
remove-asset.command.ts │ │ ├── assign-beneficiary.command.ts │ │ ├──
update-beneficiary.command.ts │ │ ├── nominate-executor.command.ts │ │ ├──
add-witness.command.ts │ │ ├── sign-will.command.ts │ │ ├──
activate-will.command.ts │ │ └── revoke-will.command.ts │ │ │ ├── queries/ #
READ operations │ │ ├── get-will.query.ts │ │ ├── list-wills.query.ts │ │ ├──
get-estate-assets.query.ts │ │ ├── get-beneficiaries.query.ts │ │ ├──
get-executors.query.ts │ │ ├── get-witnesses.query.ts │ │ └──
get-will-status.query.ts │ │ │ ├── services/ # Business logic orchestration │ │
├── will.service.ts │ │ ├── asset.service.ts │ │ ├── beneficiary.service.ts │ │
├── executor.service.ts │ │ └── witness.service.ts │ │ │ └── dto/ │ ├── request/
│ │ ├── create-will.dto.ts │ │ ├── update-will.dto.ts │ │ ├── add-asset.dto.ts │
│ ├── assign-beneficiary.dto.ts │ │ ├── nominate-executor.dto.ts │ │ └──
add-witness.dto.ts │ └── response/ │ ├── will.response.dto.ts │ ├──
asset.response.dto.ts │ ├── beneficiary.response.dto.ts │ ├──
executor.response.dto.ts │ └── witness.response.dto.ts │ ├── domain/ │ ├──
entities/ │ │ ├── will.entity.ts │ │ ├── asset.entity.ts │ │ ├──
beneficiary.entity.ts │ │ ├── executor.entity.ts │ │ └── witness.entity.ts │ │ │
├── aggregates/ │ │ ├── will.aggregate.ts │ │ └── estate.aggregate.ts │ │ │ ├──
value-objects/ │ │ ├── share-percentage.vo.ts │ │ ├── kenyan-id.vo.ts │ │ ├──
land-parcel.vo.ts │ │ └── legal-capacity.vo.ts │ │ │ ├── events/ │ │ ├──
will-created.event.ts │ │ ├── will-witnessed.event.ts │ │ ├──
asset-added.event.ts │ │ ├── beneficiary-assigned.event.ts │ │ └──
executor-nominated.event.ts │ │ │ ├── policies/ │ │ ├──
dependants-provision.policy.ts │ │ ├── witness-eligibility.policy.ts │ │ ├──
executor-eligibility.policy.ts │ │ └── asset-verification.policy.ts │ │ │ ├──
interfaces/ │ │ ├── will.repository.interface.ts │ │ ├──
asset.repository.interface.ts │ │ ├── beneficiary.repository.interface.ts │ │
└── executor.repository.interface.ts │ │ │ └── services/ │ ├──
will-validation.service.ts │ └── estate-calculation.service.ts │ ├──
infrastructure/ │ ├── persistence/ │ │ ├── entities/ # Prisma entities
(optional) │ │ ├── mappers/ │ │ │ ├── will.mapper.ts │ │ │ ├── asset.mapper.ts │
│ │ ├── beneficiary.mapper.ts │ │ │ └── executor.mapper.ts │ │ └── repositories/
│ │ ├── will.prisma-repository.ts │ │ ├── asset.prisma-repository.ts │ │ ├──
beneficiary.prisma-repository.ts │ │ └── executor.prisma-repository.ts │ └──
external/ │ ├── ardhisasa/ # Kenyan land registry │ └── kra/ # Kenya Revenue
Authority │ └── estate-planning.module.ts

family-tree/ ├── presentation/ │ └── controllers/ │ ├── family.controller.ts │
├── family-member.controller.ts │ ├── relationship.controller.ts │ └──
marriage.controller.ts # NEW: Kenyan marriage types │ ├── application/ │ ├──
commands/ # WRITE operations │ │ ├── create-family.command.ts │ │ ├──
update-family.command.ts │ │ ├── add-family-member.command.ts │ │ ├──
update-family-member.command.ts │ │ ├── remove-family-member.command.ts │ │ ├──
create-relationship.command.ts │ │ ├── update-relationship.command.ts │ │ ├──
create-marriage.command.ts # NEW: Kenyan marriage registration │ │ ├──
update-marriage.command.ts │ │ ├── dissolve-marriage.command.ts # NEW:
Divorce/customary dissolution │ │ ├── assign-guardian.command.ts # NEW: Guardian
for minors │ │ └── update-family-tree.command.ts # NEW: Tree visualization data
│ │ │ ├── queries/ # READ operations │ │ ├── get-family.query.ts │ │ ├──
list-families.query.ts │ │ ├── get-family-members.query.ts │ │ ├──
get-family-member.query.ts │ │ ├── get-relationships.query.ts │ │ ├──
get-marriages.query.ts # NEW: Marriage queries │ │ ├──
get-family-tree.query.ts # NEW: Complete tree structure │ │ ├──
get-dependants.query.ts # NEW: Kenyan law dependants │ │ ├──
find-possible-heirs.query.ts # NEW: Succession analysis │ │ └──
get-guardianships.query.ts # NEW: Guardian relationships │ │ │ ├── services/ #
Business logic orchestration │ │ ├── family.service.ts │ │ ├──
family-member.service.ts │ │ ├── relationship.service.ts │ │ ├──
marriage.service.ts # NEW: Marriage management │ │ └── guardianship.service.ts #
NEW: Guardian assignments │ │ │ └── dto/ │ ├── request/ │ │ ├──
create-family.dto.ts │ │ ├── update-family.dto.ts │ │ ├──
add-family-member.dto.ts │ │ ├── update-family-member.dto.ts │ │ ├──
create-relationship.dto.ts │ │ ├── create-marriage.dto.ts │ │ ├──
update-marriage.dto.ts │ │ └── assign-guardian.dto.ts │ └── response/ │ ├──
family.response.dto.ts │ ├── family-member.response.dto.ts │ ├──
relationship.response.dto.ts │ ├── marriage.response.dto.ts │ ├──
guardianship.response.dto.ts │ └── family-tree.response.dto.ts │ ├── domain/ │
├── entities/ │ │ ├── family.entity.ts │ │ ├── family-member.entity.ts │ │ ├──
relationship.entity.ts │ │ ├── marriage.entity.ts # NEW: Kenyan marriage types │
│ └── guardianship.entity.ts # NEW: Legal guardian relationships │ │ │ ├──
aggregates/ │ │ ├── family.aggregate.ts # Family + Members + Relationships │ │
└── family-tree.aggregate.ts # Complete lineage structure │ │ │ ├──
value-objects/ │ │ ├── kenyan-relationship.vo.ts # African relationship types │
│ ├── family-tree.vo.ts # Tree structure operations │ │ ├──
kenyan-marriage.vo.ts # Marriage type validation │ │ ├──
customary-marriage.vo.ts # Traditional marriage details │ │ └──
legal-guardianship.vo.ts # Guardian appointment rules │ │ │ ├── events/ │ │ ├──
family-created.event.ts │ │ ├── family-member-added.event.ts │ │ ├──
relationship-created.event.ts │ │ ├── marriage-registered.event.ts # NEW:
Marriage events │ │ ├── marriage-dissolved.event.ts # NEW: Divorce events │ │
└── guardian-assigned.event.ts # NEW: Guardian events │ │ │ ├── policies/ │ │
├── dependant-identification.policy.ts # Kenyan Law of Succession Act │ │ ├──
customary-marriage.policy.ts # Traditional marriage validation │ │ ├──
polygamous-family.policy.ts # Multiple spouses support │ │ ├──
guardian-eligibility.policy.ts # Legal guardian requirements │ │ ├──
relationship-validation.policy.ts # Family relationship rules │ │ └──
family-tree-integrity.policy.ts # Prevent circular relationships │ │ │ ├──
interfaces/ │ │ ├── family.repository.interface.ts │ │ ├──
family-member.repository.interface.ts │ │ ├──
relationship.repository.interface.ts │ │ ├── marriage.repository.interface.ts #
NEW: Marriage repository │ │ └── guardianship.repository.interface.ts # NEW:
Guardian repository │ │ │ └── services/ │ ├── family-tree-builder.service.ts #
Builds tree structures │ ├── dependant-calculator.service.ts # Identifies Kenyan
dependants │ └── relationship-integrity.service.ts # Validates family
relationships │ ├── infrastructure/ │ ├── persistence/ │ │ ├── mappers/ │ │ │
├── family.mapper.ts │ │ │ ├── family-member.mapper.ts │ │ │ ├──
relationship.mapper.ts │ │ │ ├── marriage.mapper.ts │ │ │ └──
guardianship.mapper.ts │ │ └── repositories/ │ │ ├── family.prisma-repository.ts
│ │ ├── family-member.prisma-repository.ts │ │ ├──
relationship.prisma-repository.ts │ │ ├── marriage.prisma-repository.ts │ │ └──
guardianship.prisma-repository.ts │ └── external/ │ ├── kenya-civil-registry/ #
Birth/death/marriage records │ └── traditional-elders/ # Customary marriage
verification │ └── family-tree.module.ts

succession-process/ ├── presentation/ │ └── controllers/ │ ├──
probate.controller.ts # Kenyan court probate process │ ├──
distribution.controller.ts # Asset distribution │ ├── dispute.controller.ts #
Will contests & challenges │ ├── succession-certificate.controller.ts # Grant of
probate/letters of admin │ ├── executor-duties.controller.ts #
Executor/administrator actions │ └── estate-settlement.controller.ts # Complete
estate settlement │ ├── application/ │ ├── commands/ # WRITE operations │ │ ├──
initiate-probate.command.ts # Start probate process │ │ ├──
file-grant-application.command.ts # Apply for grant of probate │ │ ├──
file-letters-admin.command.ts # Apply for letters of administration │ │ ├──
submit-inventory.command.ts # Estate inventory submission │ │ ├──
record-distribution.command.ts # Asset distribution tracking │ │ ├──
file-dispute.command.ts # Will contest/challenge │ │ ├──
update-dispute-status.command.ts │ │ ├── appoint-administrator.command.ts #
Court appointment │ │ ├── record-debt-payment.command.ts # Debt settlement
tracking │ │ ├── issue-succession-certificate.command.ts # Grant issuance │ │
├── close-estate.command.ts # Estate settlement completion │ │ ├──
schedule-hearing.command.ts # Court hearing management │ │ └──
update-probate-status.command.ts │ │ │ ├── queries/ # READ operations │ │ ├──
get-probate-case.query.ts │ │ ├── list-probate-cases.query.ts │ │ ├──
get-distribution-plan.query.ts │ │ ├── get-dispute.query.ts │ │ ├──
list-disputes.query.ts │ │ ├── get-executor-duties.query.ts │ │ ├──
get-estate-inventory.query.ts │ │ ├── get-debts-outstanding.query.ts │ │ ├──
get-succession-certificate.query.ts │ │ ├── get-court-hearings.query.ts # NEW:
Court schedule │ │ ├── get-legal-requirements.query.ts # NEW: Compliance
checklist │ │ └── get-estate-settlement-progress.query.ts │ │ │ ├── services/ #
Business logic orchestration │ │ ├── probate.service.ts # Kenyan probate process
│ │ ├── distribution.service.ts # Asset distribution │ │ ├──
dispute.service.ts # Will contests & mediation │ │ ├──
succession-certificate.service.ts # Grant management │ │ ├──
executor-duties.service.ts # Executor/administrator workflow │ │ └──
estate-settlement.service.ts # End-to-end settlement │ │ │ └── dto/ │ ├──
request/ │ │ ├── initiate-probate.dto.ts │ │ ├── file-grant-application.dto.ts │
│ ├── file-letters-admin.dto.ts │ │ ├── submit-inventory.dto.ts │ │ ├──
record-distribution.dto.ts │ │ ├── file-dispute.dto.ts │ │ ├──
update-dispute-status.dto.ts │ │ ├── appoint-administrator.dto.ts │ │ ├──
record-debt-payment.dto.ts │ │ └── issue-succession-certificate.dto.ts │ └──
response/ │ ├── probate-case.response.dto.ts │ ├──
distribution-plan.response.dto.ts │ ├── dispute.response.dto.ts │ ├──
succession-certificate.response.dto.ts │ ├── executor-duties.response.dto.ts │
├── estate-inventory.response.dto.ts │ ├── debt-summary.response.dto.ts │ └──
estate-settlement-progress.response.dto.ts │ ├── domain/ │ ├── entities/ │ │ ├──
probate-case.entity.ts # Kenyan court probate case │ │ ├──
distribution.entity.ts # Asset distribution plan │ │ ├── dispute.entity.ts #
Will contest/challenge │ │ ├── succession-certificate.entity.ts # Grant of
probate/letters │ │ ├── executor-duties.entity.ts # Executor responsibilities │
│ ├── estate-inventory.entity.ts # Comprehensive estate listing │ │ ├──
debt-settlement.entity.ts # Debt payment tracking │ │ └──
court-hearing.entity.ts # Court proceedings │ │ │ ├── aggregates/ │ │ ├──
probate-case.aggregate.ts # Case + Hearings + Documents │ │ ├──
estate-settlement.aggregate.ts # Complete settlement process │ │ └──
distribution.aggregate.ts # Distribution plan + execution │ │ │ ├──
value-objects/ │ │ ├── kenyan-court-jurisdiction.vo.ts # High Court vs
Magistrate Court │ │ ├── grant-type.vo.ts # Probate vs Letters of Administration
│ │ ├── distribution-share.vo.ts # Intestate succession calculations │ │ ├──
legal-grounds.vo.ts # Dispute grounds per Kenyan law │ │ ├──
probate-fees.vo.ts # Court fees calculation │ │ └── estate-valuation.vo.ts #
Official estate valuation │ │ │ ├── events/ │ │ ├── probate-case-filed.event.ts
│ │ ├── grant-issued.event.ts │ │ ├── dispute-filed.event.ts │ │ ├──
distribution-started.event.ts │ │ ├── debt-settled.event.ts │ │ ├──
asset-distributed.event.ts │ │ ├── hearing-scheduled.event.ts │ │ └──
estate-settled.event.ts │ │ │ ├── policies/ │ │ ├──
intestate-succession.policy.ts # Law of Succession Act Part V │ │ ├──
probate-eligibility.policy.ts # Who can apply for grant │ │ ├──
dispute-grounds.policy.ts # Valid grounds for will challenge │ │ ├──
executor-remuneration.policy.ts # Executor fees per Kenyan law │ │ ├──
debt-priority.policy.ts # Order of debt payment │ │ ├──
distribution-timing.policy.ts # Legal timeframes │ │ └──
court-jurisdiction.policy.ts # Which court handles the case │ │ │ ├──
interfaces/ │ │ ├── probate-case.repository.interface.ts │ │ ├──
distribution.repository.interface.ts │ │ ├── dispute.repository.interface.ts │ │
├── succession-certificate.repository.interface.ts │ │ ├──
executor-duties.repository.interface.ts │ │ └──
estate-inventory.repository.interface.ts │ │ │ └── services/ │ ├──
probate-workflow.service.ts # Kenyan court process orchestration │ ├──
intestate-calculator.service.ts # Intestate succession calculations │ ├──
dispute-resolution.service.ts # Mediation & court process │ ├──
distribution-validator.service.ts # Validate distribution plans │ └──
legal-compliance-tracker.service.ts # Court requirement tracking │ ├──
infrastructure/ │ ├── persistence/ │ │ ├── mappers/ │ │ │ ├──
probate-case.mapper.ts │ │ │ ├── distribution.mapper.ts │ │ │ ├──
dispute.mapper.ts │ │ │ ├── succession-certificate.mapper.ts │ │ │ ├──
executor-duties.mapper.ts │ │ │ └── estate-inventory.mapper.ts │ │ └──
repositories/ │ │ ├── probate-case.prisma-repository.ts │ │ ├──
distribution.prisma-repository.ts │ │ ├── dispute.prisma-repository.ts │ │ ├──
succession-certificate.prisma-repository.ts │ │ ├──
executor-duties.prisma-repository.ts │ │ └──
estate-inventory.prisma-repository.ts │ └── external/ │ ├── kenya-courts/ #
e-filing integration │ ├── law-firms/ # Legal partner integrations │ ├──
mediators/ # Dispute resolution services │ └── government-registries/ # KRA,
Lands, etc. │ └── succession-process.module.ts
