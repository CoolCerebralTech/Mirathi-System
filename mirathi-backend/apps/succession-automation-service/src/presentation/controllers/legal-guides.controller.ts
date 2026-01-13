import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { LegalGuideService } from '../../application/services/legal-guide.service';
import { GetLegalGuidesQueryDto, LegalGuideDto } from '../dtos/legal-guide.dtos';

@ApiTags('Legal Guides')
@ApiBearerAuth()
@Controller('succession/legal-guides')
@UseGuards(JwtAuthGuard)
export class LegalGuidesController {
  constructor(private readonly legalGuideService: LegalGuideService) {}

  @Get()
  @ApiOperation({ summary: 'Get legal guides with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Legal guides retrieved',
    type: [LegalGuideDto],
  })
  async getLegalGuides(@Query() query: GetLegalGuidesQueryDto): Promise<LegalGuideDto[]> {
    let guides;

    if (query.category) {
      guides = await this.legalGuideService.getGuidesByCategory(query.category);
    } else if (query.regime && query.religion) {
      guides = await this.legalGuideService.getRecommendedGuides(query.regime, query.religion);
    } else {
      // Default: Return empty or handle "all" logic if needed
      guides = [];
    }

    // Fix: Convert Entity -> Props -> DTO (handling Date to String conversion)
    return guides.map((g) => {
      const props = g.toJSON();
      return {
        ...props,
        createdAt: props.createdAt.toISOString(),
      };
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a specific legal guide by slug' })
  @ApiParam({ name: 'slug', description: 'Guide slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Legal guide retrieved',
    type: LegalGuideDto,
  })
  async getLegalGuide(@Param('slug') slug: string): Promise<LegalGuideDto> {
    const guide = await this.legalGuideService.getGuideBySlug(slug);

    // Fix: Convert Entity -> Props -> DTO
    const props = guide.toJSON();
    return {
      ...props,
      createdAt: props.createdAt.toISOString(),
    };
  }

  @Get('meta/categories')
  @ApiOperation({ summary: 'Get all legal guide categories' })
  async getCategories(): Promise<string[]> {
    // Fix: Satisfy async requirement with Promise.resolve
    return Promise.resolve([
      'Succession Process',
      'Forms',
      'Legal Requirements',
      'Court Procedures',
      'Family Matters',
      'Asset Distribution',
      'Dispute Resolution',
    ]);
  }
}
