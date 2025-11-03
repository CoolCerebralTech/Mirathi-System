api-gateway/
└── src/
    ├── 1_presentation/
    │   ├── controllers/
    │   │   ├── health/ (exists)
    │   │   └── gateway/ 
    │   │       └── gateway.controller.ts    # Catch-all router
    │   └── filters/
    │       └── gateway-exception.filter.ts  # Gateway-specific errors
    ├── 2_application/
    │   ├── services/
    │   │   └── gateway.service.ts           # Core routing logic
    │   └── interfaces/
    │       └── service-router.interface.ts  # Contract for routing
    └── 4_infrastructure/
        └── http/
            └── http-client.service.ts       # Axios wrapper with retries




api-gateway/
└── src/
    ├── main.ts  # Global guards, filters, and Swagger setup
    ├── app.module.ts # Import all necessary modules
    ├── 1_presentation/
    │   ├── controllers/
    │   │   ├── health/
    │   │   │   └── health.controller.ts
    │   │   └── proxy/
    │   │       └── proxy.controller.ts # A more descriptive name
    │   └── filters/
    │       └── all-exceptions.filter.ts # A more generic name
    ├── 2_application/
    │   └── services/
    │       └── proxy.service.ts
    └── 4_infrastructure/
        └── modules/
            └── service-discovery.module.ts # Dynamic module for routing

api-gateway/
└── src/
    ├── ... (1_presentation and 2_application layers) ...
    │
    └── 4_infrastructure/
        ├── routing/
        │   ├── service-router.service.ts    # The "Dispatcher". Implements IServiceRouter.
        │   └── service-routes.config.ts   # A separate config file for the routes. Best practice!
        │
        ├── http/
        │   └── http-client.service.ts       # The "Delivery Driver". Implements IHttpClient.
        │
        └── infrastructure.module.ts         # A single module to provide and export these services.

        
└── 2_application/
    ├── services/
    │   └── proxy.service.ts             # The "brain" or "coordinator"
    ├── interfaces/
    │   └── service-router.interface.ts  # The contracts it depends on
    └── proxy.module.ts                  # The module for this layer

└── 1_presentation/
    ├── controllers/
    │   └── proxy.controller.ts     # The single entry point for all proxied requests
    └── filters/
        └── all-exceptions.filter.ts  # The global error handler


