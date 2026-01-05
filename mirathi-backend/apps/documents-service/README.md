src/documents/
├── dto/
│   ├── upload-document.dto.ts      # Validation (EstateId, DocType)
│   └── verify-document.dto.ts      # Validation (Status, Reason)
├── entities/
│   └── document.entity.ts          # (Optional if not using Prisma classes directly)
├── adapters/                       # <--- THE FREE TOOLS WRAPPERS
│   ├── minio.service.ts            # Wraps MinIO (Storage)
│   ├── clamav.service.ts           # Wraps ClamAV (Security)
│   └── tesseract.service.ts        # Wraps Tesseract (OCR)
├── services/
│   ├── document.service.ts         # Main Business Logic (Orchestrator)
│   └── retention.cron.ts           # Cleanup Logic (Cron Job)
├── controllers/
│   └── document.controller.ts      # API Endpoints
└── documents.module.ts `            # Dependency Injection
