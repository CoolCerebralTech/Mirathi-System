family-service/
├── domain/
│   ├── ports/                       # Application Services Interfaces
│   │   ├── repositories/
│   │   │   ├── family.repository.ts
│   │   │   ├── guardianship.repository.ts
│   │   │   ├── dependency-assessment.repository.ts
│   │   │   └── family-tree.repository.ts
│   │   ├── services/
│   │   │   ├── identity-verification.service.ts
│   │   │   ├── court-integration.service.ts
│   │   │   ├── dependency-calculation.service.ts
│   │   │   ├── kenyan-law-compliance.service.ts
│   │   │   └── notification.service.ts
│   │   ├── external/
│   │   │   ├── e-citizen.service.ts
│   │   │   ├── kra.service.ts
│   │   │   ├── court-system.service.ts
│   │   │   └── gazette.service.ts
│   │   └── messaging/
│   │       ├── event-publisher.ts
│   │       └── command-handler.ts
│   └── services/                    # Domain Services
│       ├── family-management.service.ts
│       ├── guardianship-appointment.service.ts
│       ├── dependency-assessment.service.ts
│       └── family-tree-query.service.ts

family-service/
├── domain/
│   ├── aggregates/
│   │   ├── family.aggregate.ts
│   │   ├── guardianship.aggregate.ts        # S.70-73 separate aggregate
│   │   └── dependency-assessment.aggregate.ts # S.29 separate aggregate
│   ├── entities/
│   │   ├── family-member.entity.ts
│   │   ├── marriage.entity.ts
│   │   ├── family-relationship.entity.ts
│   │   ├── polygamous-house.entity.ts       # S.40 specific
│   │   └── cohabitation-record.entity.ts    # S.29(5) specific
│   ├── value-objects/
│   │   ├── identity/
│   │   │   ├── kenyan-identity.vo.ts
│   │   │   ├── national-id.vo.ts
│   │   │   ├── kra-pin.vo.ts
│   │   │   └── birth-certificate.vo.ts
│   │   ├── personal/
│   │   │   ├── kenyan-name.vo.ts
│   │   │   ├── contact-info.vo.ts
│   │   │   ├── disability-status.vo.ts
│   │   │   └── life-status.vo.ts
│   │   ├── legal/
│   │   │   ├── kenyan-law-section.vo.ts
│   │   │   ├── marriage-details.vo.ts
│   │   │   ├── polygamous-house-details.vo.ts
│   │   │   ├── customary-marriage.vo.ts
│   │   │   └── islamic-marriage.vo.ts
│   │   ├── financial/
│   │   │   ├── dependency-calculation.vo.ts
│   │   │   ├── monthly-support.vo.ts
│   │   │   └── bride-price.vo.ts
│   │   └── geographical/
│   │       ├── kenyan-location.vo.ts
│   │       ├── kenyan-county.vo.ts
│   │       └── ancestral-home.vo.ts
│   └── policies/
│       ├── kenyan-succession-law.policy.ts
│       ├── guardian-eligibility.policy.ts
│       ├── marriage-validity.policy.ts
│       ├── polygamy-s40.policy.ts
│       ├── dependant-qualification-s29.policy.ts
│       └── cohabitation-recognition.policy.ts
└── application/
    └── services/
        └── family-tree.service.ts          # Family tree/graphics logic

family-service/
├── application/
│   ├── commands/                          # Command handlers (write operations)
│   │   ├── family/
│   │   │   ├── create-family.command.ts
│   │   │   ├── update-family.command.ts
│   │   │   ├── add-member.command.ts
│   │   │   ├── update-member.command.ts
│   │   │   ├── record-death.command.ts
│   │   │   ├── verify-identity.command.ts
│   │   │   └── remove-member.command.ts
│   │   ├── marriage/
│   │   │   ├── register-marriage.command.ts
│   │   │   ├── dissolve-marriage.command.ts
│   │   │   ├── update-marriage.command.ts
│   │   │   ├── register-s40-certificate.command.ts
│   │   │   └── settle-matrimonial-property.command.ts
│   │   ├── guardianship/
│   │   │   ├── appoint-guardian.command.ts
│   │   │   ├── submit-annual-report.command.ts
│   │   │   ├── terminate-guardianship.command.ts
│   │   │   ├── update-guardian-powers.command.ts
│   │   │   └── provide-guardian-bond.command.ts
│   │   ├── dependency/
│   │   │   ├── declare-dependant.command.ts
│   │   │   ├── add-dependant-evidence.command.ts
│   │   │   ├── request-court-provision.command.ts
│   │   │   ├── assess-cohabitation-dependency.command.ts
│   │   │   └── update-dependency-assessment.command.ts
│   │   ├── polygamy/
│   │   │   ├── create-polygamous-house.command.ts
│   │   │   ├── add-wife-to-house.command.ts
│   │   │   ├── appoint-house-head.command.ts
│   │   │   ├── dissolve-polygamous-house.command.ts
│   │   │   └── update-house-share.command.ts
│   │   └── relationship/
│   │       ├── create-relationship.command.ts
│   │       ├── verify-relationship.command.ts
│   │       ├── update-inheritance-rights.command.ts
│   │       ├── designate-next-of-kin.command.ts
│   │       └── record-cohabitation.command.ts
│   ├── queries/                           # Query handlers (read operations)
│   │   ├── family/
│   │   │   ├── get-family.query.ts
│   │   │   ├── list-families.query.ts
│   │   │   ├── search-families.query.ts
│   │   │   └── get-family-stats.query.ts
│   │   ├── member/
│   │   │   ├── get-member.query.ts
│   │   │   ├── search-members.query.ts
│   │   │   ├── get-member-ancestry.query.ts
│   │   │   ├── get-member-descendants.query.ts
│   │   │   └── get-member-relationships.query.ts
│   │   ├── marriage/
│   │   │   ├── get-marriage.query.ts
│   │   │   ├── list-marriages.query.ts
│   │   │   ├── validate-marriage.query.ts
│   │   │   └── get-marriage-duration.query.ts
│   │   ├── guardianship/
│   │   │   ├── get-guardianship.query.ts
│   │   │   ├── list-guardianships.query.ts
│   │   │   ├── get-guardian-reports.query.ts
│   │   │   └── check-eligibility.query.ts
│   │   ├── dependency/
│   │   │   ├── get-dependency-assessment.query.ts
│   │   │   ├── list-dependants.query.ts
│   │   │   ├── calculate-dependency.query.ts
│   │   │   └── check-qualification.query.ts
│   │   └── family-tree/                   # Family tree specific queries
│   │       ├── get-family-tree.query.ts
│   │       ├── get-ancestry-chart.query.ts
│   │       ├── get-descendant-chart.query.ts
│   │       ├── get-polygamous-family-tree.query.ts
│   │       ├── generate-family-graph.query.ts
│   │       ├── get-family-hierarchy.query.ts
│   │       ├── find-common-ancestor.query.ts
│   │       └── get-relationship-path.query.ts
│   ├── events/                            # Event handlers
│   │   ├── family-events.handler.ts
│   │   ├── marriage-events.handler.ts
│   │   ├── guardianship-events.handler.ts
│   │   ├── dependency-events.handler.ts
│   │   └── polygamy-events.handler.ts
│   ├── dto/                               # Data Transfer Objects
│   │   ├── commands/                      # Command DTOs
│   │   │   ├── family/
│   │   │   ├── marriage/
│   │   │   ├── guardianship/
│   │   │   ├── dependency/
│   │   │   └── polygamy/
│   │   ├── queries/                       # Query DTOs
│   │   │   ├── family/
│   │   │   ├── member/
│   │   │   ├── marriage/
│   │   │   ├── guardianship/
│   │   │   ├── dependency/
│   │   │   └── family-tree/
│   │   └── responses/                     # Response DTOs
│   │       ├── family-response.dto.ts
│   │       ├── member-response.dto.ts
│   │       ├── marriage-response.dto.ts
│   │       ├── guardianship-response.dto.ts
│   │       ├── dependency-response.dto.ts
│   │       └── family-tree-response.dto.ts
│   ├── mappers/                           # Object mappers
│   │   ├── family.mapper.ts
│   │   ├── member.mapper.ts
│   │   ├── marriage.mapper.ts
│   │   ├── guardianship.mapper.ts
│   │   ├── dependency.mapper.ts
│   │   ├── polygamy.mapper.ts
│   │   └── family-tree.mapper.ts
│   ├── decorators/                        # Application decorators
│   │   ├── audit.decorator.ts
│   │   ├── authorize.decorator.ts
│   │   ├── validate.decorator.ts
│   │   ├── transaction.decorator.ts
│   │   └── rate-limit.decorator.ts
│   ├── middleware/                        # Application middleware
│   │   ├── logging.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── authentication.middleware.ts
│   │   └── authorization.middleware.ts
│   ├── validators/                        # Input validators
│   │   ├── kenyan-id.validator.ts
│   │   ├── kra-pin.validator.ts
│   │   ├── phone-number.validator.ts
│   │   ├── date-of-birth.validator.ts
│   │   ├── marriage-date.validator.ts
│   │   └── dependency-data.validator.ts
│   ├── exceptions/                        # Application exceptions
│   │   ├── family.exceptions.ts
│   │   ├── member.exceptions.ts
│   │   ├── marriage.exceptions.ts
│   │   ├── guardianship.exceptions.ts
│   │   ├── dependency.exceptions.ts
│   │   └── polygamy.exceptions.ts
│   ├── services/                          # Application services
│   │   ├── family-management.service.ts
│   │   ├── guardianship-appointment.service.ts
│   │   ├── dependency-assessment.service.ts
│   │   ├── family-tree-visualization.service.ts
│   │   ├── kenyan-law-compliance.service.ts
│   │   └── identity-verification.service.ts
│   └── cqrs/                              # CQRS infrastructure
│       ├── command.bus.ts
│       ├── query.bus.ts
│       ├── event.bus.ts
│       ├── command.handler.base.ts
│       ├── query.handler.base.ts
│       └── event.handler.base.ts
└── src/
    └── main.ts                            # Application entry point
family-service/
├── presentation/
│   ├── rest/                              # REST API Controllers
│   │   ├── controllers/
│   │   │   ├── family.controller.ts
│   │   │   ├── family-member.controller.ts
│   │   │   ├── marriage.controller.ts
│   │   │   ├── guardianship.controller.ts
│   │   │   ├── dependency.controller.ts
│   │   │   ├── polygamy.controller.ts
│   │   │   ├── relationship.controller.ts
│   │   │   ├── family-tree.controller.ts
│   │   │   ├── legal-compliance.controller.ts
│   │   │   └── identity-verification.controller.ts
│   │   ├── dtos/                          # REST-specific DTOs
│   │   │   ├── requests/
│   │   │   │   ├── family/
│   │   │   │   ├── member/
│   │   │   │   ├── marriage/
│   │   │   │   ├── guardianship/
│   │   │   │   ├── dependency/
│   │   │   │   ├── polygamy/
│   │   │   │   └── family-tree/
│   │   │   └── responses/
│   │   │       ├── family/
│   │   │       ├── member/
│   │   │       ├── marriage/
│   │   │       ├── guardianship/
│   │   │       ├── dependency/
│   │   │       ├── polygamy/
│   │   │       └── family-tree/
│   │   ├── filters/                       # Exception filters
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── business-exception.filter.ts
│   │   │   ├── validation-exception.filter.ts
│   │   │   └── kenyan-law-exception.filter.ts
│   │   ├── interceptors/                  # Response interceptors
│   │   │   ├── response.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── timing.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── middleware/                    # HTTP middleware
│   │   │   ├── request-id.middleware.ts
│   │   │   ├── correlation-id.middleware.ts
│   │   │   ├── rate-limiting.middleware.ts
│   │   │   └── audit-logging.middleware.ts
│   │   ├── guards/                        # Authorization guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── family-membership.guard.ts
│   │   │   ├── kyc-verified.guard.ts
│   │   │   └── court-access.guard.ts
│   │   ├── decorators/                    # Route decorators
│   │   │   ├── api-auth.decorator.ts
│   │   │   ├── api-response.decorator.ts
│   │   │   ├── api-pagination.decorator.ts
│   │   │   ├── api-cache.decorator.ts
│   │   │   └── api-rate-limit.decorator.ts
│   │   └── pipes/                         # Validation pipes
│   │       ├── kenyan-id.pipe.ts
│   │       ├── kra-pin.pipe.ts
│   │       ├── date-of-birth.pipe.ts
│   │       ├── kenyan-county.pipe.ts
│   │       └── marital-status.pipe.ts
│   ├── graphql/                           # GraphQL API
│   │   ├── resolvers/
│   │   │   ├── family.resolver.ts
│   │   │   ├── family-member.resolver.ts
│   │   │   ├── marriage.resolver.ts
│   │   │   ├── guardianship.resolver.ts
│   │   │   ├── dependency.resolver.ts
│   │   │   ├── polygamy.resolver.ts
│   │   │   ├── relationship.resolver.ts
│   │   │   └── family-tree.resolver.ts
│   │   ├── types/                         # GraphQL schema types
│   │   │   ├── family.type.ts
│   │   │   ├── family-member.type.ts
│   │   │   ├── marriage.type.ts
│   │   │   ├── guardianship.type.ts
│   │   │   ├── dependency.type.ts
│   │   │   ├── polygamy.type.ts
│   │   │   ├── relationship.type.ts
│   │   │   └── family-tree.type.ts
│   │   ├── inputs/                        # GraphQL input types
│   │   │   ├── family.input.ts
│   │   │   ├── member.input.ts
│   │   │   ├── marriage.input.ts
│   │   │   ├── guardianship.input.ts
│   │   │   ├── dependency.input.ts
│   │   │   ├── polygamy.input.ts
│   │   │   └── relationship.input.ts
│   │   ├── scalars/                       # Custom scalars
│   │   │   ├── kenyan-county.scalar.ts
│   │   │   ├── date-of-birth.scalar.ts
│   │   │   ├── national-id.scalar.ts
│   │   │   ├── kra-pin.scalar.ts
│   │   │   └── kenyan-currency.scalar.ts
│   │   └── directives/                    # GraphQL directives
│   │       ├── auth.directive.ts
│   │       ├── family-access.directive.ts
│   │       ├── rate-limit.directive.ts
│   │       └── cache-control.directive.ts
│   ├── websocket/                         # WebSocket/Real-time
│   │   ├── gateways/
│   │   │   ├── family-updates.gateway.ts
│   │   │   ├── family-tree-updates.gateway.ts
│   │   │   ├── legal-notifications.gateway.ts
│   │   │   └── court-updates.gateway.ts
│   │   ├── events/                        # WebSocket events
│   │   │   ├── family.events.ts
│   │   │   ├── member.events.ts
│   │   │   ├── marriage.events.ts
│   │   │   ├── guardianship.events.ts
│   │   │   └── dependency.events.ts
│   │   ├── adapters/                      # Socket adapters
│   │   │   ├── redis.adapter.ts
│   │   │   ├── authentication.adapter.ts
│   │   │   └── room-management.adapter.ts
│   │   └── middleware/                    # WebSocket middleware
│   │       ├── ws-auth.middleware.ts
│   │       ├── ws-family-access.middleware.ts
│   │       └── ws-rate-limit.middleware.ts
│   ├── views/                             # Server-side views (for reports)
│   │   ├── templates/
│   │   │   ├── family-tree.hbs
│   │   │   ├── ancestry-chart.hbs
│   │   │   ├── descendant-chart.hbs
│   │   │   ├── polygamous-family.hbs
│   │   │   ├── dependency-report.hbs
│   │   │   └── guardianship-report.hbs
│   │   └── renderers/
│   │       ├── pdf.renderer.ts
│   │       ├── excel.renderer.ts
│   │       └── csv.renderer.ts
│   ├── api-docs/                          # OpenAPI/Swagger
│   │   ├── swagger.config.ts
│   │   ├── swagger-ui.setup.ts
│   │   ├── examples/
│   │   │   ├── family.examples.yaml
│   │   │   ├── member.examples.yaml
│   │   │   ├── marriage.examples.yaml
│   │   │   ├── guardianship.examples.yaml
│   │   │   ├── dependency.examples.yaml
│   │   │   └── polygamy.examples.yaml
│   │   └── schemas/
│   │       ├── family.schema.yaml
│   │       ├── member.schema.yaml
│   │       ├── marriage.schema.yaml
│   │       ├── guardianship.schema.yaml
│   │       ├── dependency.schema.yaml
│   │       └── polygamy.schema.yaml
│   ├── health/                            # Health checks
│   │   ├── health.controller.ts
└── src/
    ├── app.module.ts
    ├── main.ts