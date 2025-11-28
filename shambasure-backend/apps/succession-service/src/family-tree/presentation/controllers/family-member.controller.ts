import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shamba/auth';
import { FamilyMemberService } from '../../application/services/family-member.service';
import { AddFamilyMemberDto } from '../../application/dto/request/add-family-member.dto';
import { UpdateFamilyMemberDto } from '../../application/dto/request/update-family-member.dto';
import { FamilyMemberResponseDto } from '../../application/dto/response/family-member.response.dto';
// Import the response type for potential heirs
import { PotentialHeirResponse } from '../../application/queries/find-potential-heirs.query';

interface RequestWithUser extends Request {
  user: { userId: string; email: string; role: string };
}

@ApiTags('Family Tree - Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('families')
export class FamilyMemberController {
  constructor(private readonly memberService: FamilyMemberService) {}

  // --------------------------------------------------------------------------
  // MANAGE MEMBERS
  // --------------------------------------------------------------------------

  @Post(':familyId/members')
  @ApiOperation({ summary: 'Add a relative to the family tree' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Member added successfully.',
    type: String, // Returns Member ID
  })
  async addMember(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Body() dto: AddFamilyMemberDto,
  ): Promise<{ id: string }> {
    const id = await this.memberService.addMember(familyId, req.user.userId, dto);
    return { id };
  }

  @Get(':familyId/members')
  @ApiOperation({ summary: 'List all members in the tree (Flat list)' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [FamilyMemberResponseDto],
  })
  async getMembers(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
  ): Promise<FamilyMemberResponseDto[]> {
    return this.memberService.getMembers(familyId, req.user.userId);
  }

  @Get('members/:memberId')
  @ApiOperation({ summary: 'Get profile of a specific family member' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: FamilyMemberResponseDto,
  })
  async getMember(
    @Req() req: RequestWithUser,
    @Param('memberId') memberId: string,
  ): Promise<FamilyMemberResponseDto> {
    return this.memberService.getMember(memberId, req.user.userId);
  }

  @Patch(':familyId/members/:memberId')
  @ApiOperation({ summary: 'Update member details (e.g. Mark as Deceased)' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member updated.',
  })
  async updateMember(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateFamilyMemberDto,
  ): Promise<void> {
    return this.memberService.updateMember(familyId, req.user.userId, memberId, dto);
  }

  @Delete(':familyId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from the tree' })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member removed.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot remove member if they have existing relationships/marriages.',
  })
  async removeMember(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.memberService.removeMember(familyId, req.user.userId, memberId);
  }

  // --------------------------------------------------------------------------
  // SUCCESSION INTELLIGENCE
  // --------------------------------------------------------------------------

  @Get(':familyId/potential-heirs')
  @ApiOperation({
    summary: 'Analyze tree for Legal Dependants (Section 29)',
    description:
      'Returns a prioritized list of who MUST be provided for in a will based on the current tree structure.',
  })
  @ApiParam({ name: 'familyId', description: 'Family ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analysis results.',
    // Swagger schema hint, though actual response is dynamic object
  })
  async getPotentialHeirs(
    @Req() req: RequestWithUser,
    @Param('familyId') familyId: string,
  ): Promise<PotentialHeirResponse[]> {
    return this.memberService.getPotentialHeirs(familyId, req.user.userId);
  }
}
