# Documents Service

Secure document management service for Shamba Sure platform.

## Features

- Secure file upload and storage
- Document versioning with change tracking
- Automatic file processing (compression, thumbnails, OCR)
- Document verification with integrity checks
- Role-based access control
- Comprehensive audit logging

## API Endpoints

### Documents
- `POST /documents/upload` - Upload a new document
- `GET /documents` - Get all documents for user
- `GET /documents/:id` - Get document by ID
- `PUT /documents/:id` - Update document metadata
- `DELETE /documents/:id` - Delete a document
- `GET /documents/:id/download` - Download document file
- `GET /documents/:id/thumbnail` - Get document thumbnail

### Document Versions
- `POST /documents/:id/versions` - Add a new version
- `GET /documents/:id/versions` - Get document versions

### Verification
- `POST /documents/:id/verify` - Verify a document
- `POST /documents/:id/reject` - Reject a document

### Search & Statistics
- `GET /documents/search` - Search documents
- `GET /documents/stats` - Get document statistics

## Supported File Types

- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Maximum file size: 10-20MB (varies by type)

## Security Features

- File integrity checks
- Sensitive data detection
- Checksum verification
- Secure storage with access control
- Automatic virus scanning (placeholder for future implementation)

## Storage

Files are stored locally with the following structure:
- `/documents/` - Main document files
- `/thumbnails/` - Generated thumbnails
- `/archived/` - Archived versions
- `/temp/` - Temporary files (auto-cleaned)

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build