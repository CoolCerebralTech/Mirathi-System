# Succession Service

Estate and inheritance planning service for Shamba Sure platform.

## Features

- Will creation and management
- Asset inventory and tracking
- Family tree management
- Beneficiary assignment
- Estate distribution planning
- Inheritance conflict detection

## API Endpoints

### Wills
- `POST /wills` - Create a new will
- `GET /wills` - Get all wills for user
- `GET /wills/:id` - Get will by ID
- `PUT /wills/:id` - Update a will
- `POST /wills/:id/activate` - Activate a will
- `POST /wills/:id/revoke` - Revoke a will
- `DELETE /wills/:id` - Delete a will
- `POST /wills/:id/beneficiaries` - Add beneficiary
- `GET /wills/:id/validation` - Validate will distribution

### Assets
- `POST /assets` - Create a new asset
- `POST /assets/bulk` - Bulk create assets
- `GET /assets` - Get all assets for user
- `GET /assets/type/:type` - Get assets by type
- `GET /assets/:id` - Get asset by ID
- `PUT /assets/:id` - Update an asset
- `DELETE /assets/:id` - Delete an asset
- `GET /assets/:id/valuation` - Get asset valuation
- `GET /assets/search` - Search assets

### Families
- `POST /families` - Create a new family
- `GET /families` - Get all families for user
- `GET /families/:id` - Get family by ID
- `GET /families/:id/tree` - Get family tree
- `POST /families/:id/members` - Add family member
- `POST /families/:id/invite` - Invite family member
- `PUT /families/:id/members/:memberId/role` - Update member role
- `DELETE /families/:id/members/:memberId` - Remove family member

## Business Logic

- **Will Validation**: Ensures proper asset distribution before activation
- **Conflict Detection**: Identifies over-allocated assets
- **Family Relationships**: Manages complex family structures
- **Asset Tracking**: Comprehensive asset inventory with valuation
- **Inheritance Planning**: Strategic beneficiary assignment

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build