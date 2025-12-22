src/presentation/
└── http/
    └── guardianship/
        ├── controllers/
        │   └── guardianship.controller.ts
        │
        ├── dto/
        │   ├── request/
        │   │   ├── appoint-guardian.http.dto.ts
        │   │   ├── file-annual-report.http.dto.ts
        │   │   └── post-bond.http.dto.ts
        │   │
        │   └── response/
        │       ├── guardianship-details.http.dto.ts
        │       └── compliance-dashboard.http.dto.ts
        │
        ├── mappers/
        │   └── guardianship.http-mapper.ts
        │
        └── filters/
            └── guardianship-exception.filter.ts


src/application/
└── guardianship/
    ├── commands/
    │   ├── impl/
    │   │   ├── appoint-guardian.command.ts
    │   │   ├── file-annual-report.command.ts
    │   │   └── post-bond.command.ts
    │   │
    │   └── handlers/
    │       ├── appoint-guardian.handler.ts
    │       ├── file-annual-report.handler.ts
    │       └── post-bond.handler.ts
    │
    ├── queries/
    │   ├── impl/
    │   │   ├── get-guardianship-by-id.query.ts
    │   │   └── get-compliance-dashboard.query.ts
    │   │
    │   ├── handlers/
    │   │   ├── get-guardianship-by-id.handler.ts
    │   │   └── get-compliance-dashboard.handler.ts
    │   │
    │   └── read-models/
    │       ├── guardianship-details.read-model.ts
    │       └── compliance-dashboard.read-model.ts
    │
    ├── ports/
    │   ├── inbound/
    │   │   └── guardianship.use-case.ts
    │   │
    │   └── outbound/
    │       ├── inotification-service.port.ts
    │       ├── iguardianship-pdf.port.ts
    │       └── iaudit-log.port.ts
    │
    └── services/
        └── guardianship-application.service.ts
