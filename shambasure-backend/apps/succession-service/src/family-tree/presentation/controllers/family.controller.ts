import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { FamilyService } from '../../application/services/family.service';
import { CreateFamilyDto } from '../../application/dto/request/create-family.dto';
import { UpdateFamilyDto } from '../../application/dto/request/update-family.dto';
import { FamilyResponseDto } from '../../application/dto/response/family.response.dto';
import { FamilyTreeResponseDto } from '../../application/dto/response/family-tree.response.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

@ApiTags('Family Tree - Core')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // --------------------------------------------------------------------------
  // CREATE
  // --------------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Initialize a new Family Tree' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Family tree created successfully.',
    type: String, // Returns Family ID
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'User already has a tree.' })
  async createFamily(
    @Req() req: RequestWithUser,
    @Body() dto: CreateFamilyDto,
  ): Promise<{ id: string }> {
    // We extract user details from the JWT payload (assuming Auth middleware populates this)
    // If JWT only has ID, we might need to fetch profile, but for now assume payload has basics
    const userDetails = {
      firstName: req.user.firstName || 'User',
      lastName: req.user.lastName || '',
      email: req.user.email,
    };

    const id = await this.familyService.createFamily(req.user.userId, userDetails, dto);
    return { id };
  }

  // --------------------------------------------------------------------------
  // READ
  // --------------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'List family trees owned by the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [FamilyResponseDto],
  })
  async listFamilies(@Req() req: RequestWithUser): Promise<FamilyResponseDto[]> {
    return this.familyService.listFamilies(req.user.userId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the primary family tree for the user' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FamilyResponseDto,
  })
  async getFamily(@Req() req: RequestWithUser): Promise<FamilyResponseDto> {
    return this.familyService.getFamily(req.user.userId);
  }

  @Get(':id/graph')
  @ApiOperation({
    summary: 'Get the Visualization Graph (Nodes & Edges)',
    description: 'Returns computed JSON structure for rendering the HeirLink™ UI (React Flow/D3).',
  })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FamilyTreeResponseDto,
  })
  async getFamilyTreeGraph(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<FamilyTreeResponseDto> {
    return this.familyService.getFamilyTreeGraph(id, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // UPDATE
  // --------------------------------------------------------------------------

  @Patch(':id')
  @ApiOperation({ summary: 'Update family metadata (Name/Description)' })
  @ApiParam({ name: 'id', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Updated successfully.',
  })
  async updateFamily(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
  ): Promise<void> {
    return this.familyService.updateFamily(id, req.user.userId, dto);
  }

  @Post(':id/refresh-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force re-calculation of the graph visualization',
    description: 'Call this if the visual graph seems out of sync with member list.',
  })
  @ApiParam({ name: 'id', description: 'Family ID' })
  async refreshTreeCache(@Param('id') id: string): Promise<void> {
    // We don't necessarily need userId for a cache refresh command, but we could add auth check
    return this.familyService.refreshTreeCache(id);
  }
}
