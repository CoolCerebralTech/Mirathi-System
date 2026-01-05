import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

// From your generated Prisma Client

// Import Guards from your shared Auth Library
import { JwtAuthGuard, RolesGuard } from '@shamba/auth';

import { UploadDocumentDto } from '../dto/upload-document.dto';
import { VerifyDocumentDto } from '../dto/verify-document.dto';
import { DocumentService } from '../services/document.service';

// --- Type Definition for Request with User ---
// Based on your JwtStrategy, 'validate' returns the payload.
// Standard JWT payloads usually map the user ID to 'sub'.
interface AuthenticatedRequest extends Request {
  user: {
    sub: string; // The User ID
    email?: string;
    role?: UserRole; // Depending on what you put in the token
  };
}

// --- Roles Decorator Helper ---
// Since RolesGuard is in @shamba/auth, we need to set the metadata key it looks for.
// Usually this is 'roles'.
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Controller('documents')
@UseGuards(JwtAuthGuard) // 1. All endpoints require a valid JWT
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * 1. Upload Document
   * Accessible by: Any authenticated User
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Extract User ID from the JWT 'sub' claim
    const userId = req.user.sub;

    return this.documentService.upload(userId, dto, file);
  }

  /**
   * 2. View Document (Get Presigned URL)
   * Accessible by: ADMIN, VERIFIER
   * Note: This keeps the actual file path private, only returning a temp URL.
   */
  @Get(':id/view')
  @UseGuards(RolesGuard) // 2. Apply RolesGuard specifically for this route
  @Roles(UserRole.ADMIN, UserRole.VERIFIER, UserRole.AUDITOR)
  async view(@Param('id') id: string) {
    return this.documentService.getViewLink(id);
  }

  /**
   * 3. Verify Document
   * Accessible by: ADMIN, VERIFIER
   * Triggers the Retention Policy (Auto-delete) if Verified.
   */
  @Patch(':id/verify')
  @UseGuards(RolesGuard) // 3. Apply RolesGuard specifically for this route
  @Roles(UserRole.ADMIN, UserRole.VERIFIER)
  async verify(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    const verifierId = req.user.sub;

    return this.documentService.verify(id, verifierId, dto);
  }
}
