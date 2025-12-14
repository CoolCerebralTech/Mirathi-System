estate-service/
├── src/
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── estate.aggregate.ts         # Root Aggregate (manages consistency)
│   │   │   └── testament.aggregate.ts      # Will, Codicils, Witnesses (separate root)
│   │   ├── entities/
│   │   │   ├── asset.entity.ts             # Rich entity with business logic
│   │   │   ├── liability.entity.ts         # Debt with S.45 calculations
│   │   │   ├── beneficiary.entity.ts       # With inheritance calculations
│   │   │   ├── executor.entity.ts          # With duty validation
│   │   │   └── guardian.entity.ts          # For minor beneficiaries
│   │   ├── value-objects/
│   │   │   ├── money/
│   │   │   │   ├── amount.value-object.ts
│   │   │   │   ├── currency.value-object.ts
│   │   │   │   └── percentage.value-object.ts
│   │   │   ├── identification/
│   │   │   │   ├── kra-pin.value-object.ts
│   │   │   │   ├── title-deed.value-object.ts
│   │   │   │   ├── parcel-number.value-object.ts
│   │   │   │   └── registration-number.value-object.ts
│   │   │   ├── location/
│   │   │   │   ├── county.value-object.ts
│   │   │   │   ├── gps-coordinates.value-object.ts
│   │   │   │   └── address.value-object.ts
│   │   │   ├── legal/
│   │   │   │   ├── section.value-object.ts     # LSA sections
│   │   │   │   ├── grant-type.value-object.ts
│   │   │   │   └── case-number.value-object.ts
│   │   │   └── temporal/
│   │   │       ├── date-of-death.value-object.ts
│   │   │       ├── valuation-date.value-object.ts
│   │   │       └── life-interest-period.value-object.ts
│   │   ├── events/
│   │   │   ├── estate/
│   │   │   │   ├── estate-opened.event.ts
│   │   │   │   ├── asset-added.event.ts
│   │   │   │   ├── liability-verified.event.ts
│   │   │   │   └── estate-distributed.event.ts
│   │   │   ├── testament/
│   │   │   │   ├── will-created.event.ts
│   │   │   │   ├── will-executed.event.ts
│   │   │   │   ├── codicil-added.event.ts
│   │   │   │   └── will-revoked.event.ts
│   │   │   └── integration/
│   │   │       ├── family-member-linked.event.ts
│   │   │       └── succession-case-initiated.event.ts
│   │   ├── policies/
│   │   │   ├── inheritance/
│   │   │   │   ├── section-35-policy.ts        # Surviving spouse & children
│   │   │   │   ├── section-40-policy.ts        # Polygamous families
│   │   │   │   ├── section-26-policy.ts        # Dependant provisions
│   │   │   │   └── hotchpot-policy.ts          # S.35(3) adjustments
│   │   │   ├── debt/
│   │   │   │   ├── section-45-priority-policy.ts
│   │   │   │   └── debt-verification-policy.ts
│   │   │   ├── executor/
│   │   │   │   ├── duty-validation-policy.ts
│   │   │   │   └── bond-requirement-policy.ts
│   │   │   └── asset/
│   │   │       ├── matrimonial-property-policy.ts
│   │   │       └── life-interest-policy.ts
│   │   ├── services/
│   │   │   ├── inheritance-calculation.service.ts
│   │   │   ├── estate-valuation.service.ts
│   │   │   └── debt-priority.service.ts
│   │   ├── repositories/
│   │   │   ├── estate.repository.interface.ts
│   │   │   ├── testament.repository.interface.ts
│   │   │   └── asset.repository.interface.ts
│   │   ├── specifications/
│   │   │   ├── asset/
│   │   │   │   ├── land-asset.specification.ts
│   │   │   │   ├── financial-asset.specification.ts
│   │   │   │   └── business-asset.specification.ts
│   │   │   ├── beneficiary/
│   │   │   │   ├── minor-beneficiary.specification.ts
│   │   │   │   └── dependant-beneficiary.specification.ts
│   │   │   └── executor/
│   │   │       └── eligible-executor.specification.ts
│   │   └── exceptions/
│   │       ├── estate-domain.exception.ts
│   │       ├── testament-domain.exception.ts
│   │       └── validation/
│   │           ├── invalid-kra-pin.exception.ts
│   │           ├── invalid-title-deed.exception.ts
│   │           └── estate-frozen.exception.ts
│   ├── application/
│   ├── infrastructure/
│   └── presentation/

estate-service/
├── application/
│   ├── use-cases/                          # Core business operations
│   │   ├── estate/
│   │   │   ├── create-estate.use-case.ts   # Testate/Intestate creation
│   │   │   ├── add-asset.use-case.ts       # With S.35(3) hotchpot check
│   │   │   ├── add-liability.use-case.ts   # With S.45 priority assignment
│   │   │   ├── calculate-inheritance.use-case.ts  # S.35/S.40 calculations
│   │   │   ├── distribute-assets.use-case.ts       # Grant-based distribution
│   │   │   └── reconcile-estate.use-case.ts        # Final closure
│   │   ├── testament/
│   │   │   ├── create-will.use-case.ts     # With capacity assessment
│   │   │   ├── execute-will.use-case.ts    # Witness & signature validation
│   │   │   ├── add-codicil.use-case.ts     # Amendment management
│   │   │   ├── appoint-executor.use-case.ts # Eligibility check (LSA S.83)
│   │   │   └── revoke-will.use-case.ts     # S.16 compliance
│   │   ├── asset/
│   │   │   ├── value-asset.use-case.ts     # Kenyan valuation standards
│   │   │   ├── transfer-asset.use-case.ts  # With stamp duty calculation
│   │   │   └── encumber-asset.use-case.ts  # Mortgage/charge registration
│   │   └── integration/
│   │       ├── link-family-member.use-case.ts      # Cross-service sync
│   │       ├── initiate-succession-case.use-case.ts # Court process start
│   │       └── sync-kra-compliance.use-case.ts     # Tax clearance
│   ├── queries/                            # Read operations (CQRS if needed)
│   │   ├── estate/
│   │   │   ├── get-estate.query.ts
│   │   │   ├── list-estate-assets.query.ts
│   │   │   ├── calculate-net-value.query.ts
│   │   │   └── get-inheritance-breakdown.query.ts
│   │   ├── testament/
│   │   │   ├── get-will.query.ts
│   │   │   ├── validate-will.query.ts
│   │   │   └── get-beneficiary-assignments.query.ts
│   │   └── reports/
│   │       ├── generate-inventory-report.query.ts  # S.83 requirement
│   │       ├── generate-tax-report.query.ts        # KRA compliance
│   │       └── generate-distribution-statement.query.ts
│   ├── ports/                              # Input/Output adapters interfaces
│   │   ├── input/
│   │   │   ├── estate.repository.port.ts
│   │   │   ├── testament.repository.port.ts
│   │   │   ├── asset.repository.port.ts
│   │   │   └── liability.repository.port.ts
│   │   ├── output/
│   │   │   ├── family-service.port.ts      # For beneficiary lookup
│   │   │   ├── succession-service.port.ts  # For court case initiation
│   │   │   ├── document-service.port.ts    # For will storage
│   │   │   ├── notification-service.port.ts
│   │   │   └── payment-service.port.ts     # For creditor payments
│   │   └── event/
│   │       ├── domain-event.publisher.port.ts
│   │       └── integration-event.emitter.port.ts
│   ├── dto/                                # Data Transfer Objects
│   │   ├── commands/                       # Input DTOs (immutable)
│   │   │   ├── CreateEstateCommand.dto.ts
│   │   │   ├── AddAssetCommand.dto.ts
│   │   │   ├── ExecuteWillCommand.dto.ts
│   │   │   └── DistributeAssetsCommand.dto.ts
│   │   ├── queries/                        # Query DTOs
│   │   │   ├── GetEstateQuery.dto.ts
│   │   │   ├── CalculateInheritanceQuery.dto.ts
│   │   │   └── GenerateReportQuery.dto.ts
│   │   └── responses/                      # Output DTOs
│   │       ├── EstateResponse.dto.ts
│   │       ├── WillResponse.dto.ts
│   │       ├── AssetResponse.dto.ts
│   │       └── InheritanceCalculationResponse.dto.ts
│   ├── mappers/                            # Domain <-> DTO transformations
│   │   ├── estate.mapper.ts
│   │   ├── will.mapper.ts
│   │   ├── asset.mapper.ts
│   │   └── liability.mapper.ts
│   ├── validators/                         # Business rule validators
│   │   ├── kenyan-law.validator.ts
│   │   ├── estate-validator.ts
│   │   ├── will-validator.ts
│   │   └── asset-validator.ts
│   ├── exceptions/                         # Application exceptions
│   │   ├── EstateNotFoundException.ts
│   │   ├── WillValidationException.ts
│   │   ├── AssetEncumberedException.ts
│   │   └── InsufficientEstateValueException.ts
│   └── decorators/                         # Cross-cutting concerns
│       ├── transaction.decorator.ts        # Database transaction
│       ├── audit.decorator.ts              # Audit logging
│       ├── validate.decorator.ts           # DTO validation
│       └── authorize.decorator.ts          # Authorization

estate-service/
├── presentation/
│   ├── api/                              # Primary REST API
│   │   ├── controllers/                  # Thin controllers
│   │   │   ├── estate.controller.ts
│   │   │   ├── will.controller.ts
│   │   │   ├── asset.controller.ts
│   │   │   ├── liability.controller.ts
│   │   │   ├── executor.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── docs/                         # API Documentation
│   │   │   ├── openapi/
│   │   │   │   ├── estate-api.yaml       # OpenAPI 3.0 spec
│   │   │   │   ├── schemas/
│   │   │   │   │   ├── estate.schema.yaml
│   │   │   │   │   ├── will.schema.yaml
│   │   │   │   │   └── asset.schema.yaml
│   │   │   │   └── responses/
│   │   │   │       ├── 400-bad-request.yaml
│   │   │   │       └── 422-unprocessable.yaml
│   │   │   └── redocly-config.yaml       # Redoc configuration
│   │   ├── filters/                      # Global exception handling
│   │   │   ├── global-exception.filter.ts
│   │   │   ├── business-exception.filter.ts
│   │   │   ├── validation-exception.filter.ts
│   │   │   └── not-found-exception.filter.ts
│   │   ├── interceptors/                  # Response transformation
│   │   │   ├── response.interceptor.ts    # Standard API response
│   │   │   ├── logging.interceptor.ts     # Request/Response logging
│   │   │   └── timing.interceptor.ts      # Performance monitoring
│   │   ├── middleware/                    # HTTP middleware
│   │   │   ├── request-context.middleware.ts
│   │   │   ├── correlation-id.middleware.ts
│   │   │   └── request-logging.middleware.ts
│   │   ├── guards/                        # Authorization
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts             # User roles (ADMIN, VERIFIER, etc.)
│   │   │   └── estate-ownership.guard.ts  # Check estate access
│   │   └── pipes/                         # Request validation
│   │       ├── parse-uuid.pipe.ts
│   │       ├── parse-date.pipe.ts
│   │       └── validate-kenyan-law.pipe.ts # Kenyan legal validation
│   ├── webhooks/                          # External integrations
│   │   ├── controllers/
│   │   │   ├── court-integration.webhook.ts
│   │   │   ├── kra-tax.webhook.ts
│   │   │   └── bank-notification.webhook.ts
│   │   ├── security/
│   │   │   ├── webhook-signature.guard.ts
│   │   │   └── webhook-auth.middleware.ts
│   │   └── handlers/
│   │       ├── court-order.handler.ts
│   │       ├── tax-clearance.handler.ts
│   │       └── grant-update.handler.ts
│   └── cli/                               # Command Line Interface
│       ├── commands/
│       │   ├── seed.command.ts            # Database seeding
│       │   ├── migrate.command.ts         # Data migration
│       │   └── report.command.ts          # Generate reports
│       └── prompts/
│           ├── estate-setup.prompt.ts
│           └── will-validation.prompt.ts