apps/estate-service/
├── src/
│   ├── domain/                           # 🧠 Business Logic (Pure)
│   │   ├── entities/
│   │   │   ├── estate.entity.ts          # Aggregate Root
│   │   │   ├── asset.entity.ts           # Entity
│   │   │   ├── debt.entity.ts            # Entity
│   │   │   ├── will.entity.ts            # Aggregate Root
│   │   │   ├── bequest.entity.ts         # Entity
│   │   │   └── witness.entity.ts         # Entity
│   │   │
│   │   ├── value-objects/
│   │   │   ├── money.vo.ts               # { amount, currency }
│   │   │   ├── net-worth.vo.ts           # { assets, debts, netWorth }
│   │   │   ├── will-completeness.vo.ts   # { score, warnings }
│   │   │   └── land-title.vo.ts          # { titleNumber, parcel }
│   │   │
│   │   └── services/                      # Domain Services (Pure Logic)
│   │       ├── net-worth-calculator.service.ts
│   │       ├── will-validator.service.ts
│   │       └── kenyan-succession-rules.service.ts
│   │
│   ├── application/                       # 🎯 Use Cases (Orchestration)
│   │   ├── estate/
│   │   │   ├── create-estate.service.ts
│   │   │   ├── calculate-net-worth.service.ts
│   │   │   └── get-estate-summary.service.ts
│   │   │
│   │   ├── assets/
│   │   │   ├── add-asset.service.ts
│   │   │   ├── update-asset-value.service.ts
│   │   │   ├── verify-asset.service.ts
│   │   │   └── list-assets.service.ts
│   │   │
│   │   ├── debts/
│   │   │   ├── add-debt.service.ts
│   │   │   ├── pay-debt.service.ts
│   │   │   └── list-debts.service.ts
│   │   │
│   │   └── will/
│   │       ├── create-will.service.ts
│   │       ├── add-beneficiary.service.ts
│   │       ├── add-witness.service.ts
│   │       ├── validate-will-completeness.service.ts
│   │       └── generate-will-preview.service.ts
│   │
│   ├── infrastructure/                    # 💾 Data Persistence
│   │   ├── repositories/
│   │   │   ├── estate.repository.ts
│   │   │   ├── asset.repository.ts
│   │   │   ├── debt.repository.ts
│   │   │   └── will.repository.ts
│   │   │
│   │   └── mappers/
│   │       ├── estate.mapper.ts
│   │       ├── asset.mapper.ts
│   │       ├── debt.mapper.ts
│   │       └── will.mapper.ts
│   │
│   ├── presentation/                      # 🎨 HTTP Layer
│   │   ├── estate/
│   │   │   ├── estate.controller.ts
│   │   │   └── dtos/
│   │   │       ├── create-estate.dto.ts
│   │   │       └── estate-summary.dto.ts
│   │   │
│   │   ├── assets/
│   │   │   ├── assets.controller.ts
│   │   │   └── dtos/
│   │   │       ├── add-asset.dto.ts
│   │   │       ├── add-land.dto.ts
│   │   │       ├── add-vehicle.dto.ts
│   │   │       └── asset-response.dto.ts
│   │   │
│   │   ├── debts/
│   │   │   ├── debts.controller.ts
│   │   │   └── dtos/
│   │   │       ├── add-debt.dto.ts
│   │   │       └── debt-response.dto.ts
│   │   │
│   │   └── will/
│   │       ├── will.controller.ts
│   │       └── dtos/
│   │           ├── create-will.dto.ts
│   │           ├── add-beneficiary.dto.ts
│   │           ├── add-witness.dto.ts
│   │           └── will-preview.dto.ts
│   │
│   └── estate.module.ts