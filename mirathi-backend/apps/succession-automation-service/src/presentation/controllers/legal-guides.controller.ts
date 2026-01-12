// apps/succession-automation-service/src/presentation/controllers/legal-guides.controller.ts
import { Controller, Get, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

// Note: We need to create a LegalGuideService first
// For now, I'll create a placeholder service

import { GetLegalGuidesQueryDto, LegalGuideDto } from '../dtos';

@ApiTags('Legal Guides')
@ApiBearerAuth()
@Controller('succession/legal-guides')
@UseGuards(JwtAuthGuard)
export class LegalGuidesController {
  // In a real implementation, we would inject a LegalGuideService
  // For now, return mock data

  @Get()
  @ApiOperation({ summary: 'Get legal guides with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Legal guides retrieved',
    type: [LegalGuideDto],
  })
  async getLegalGuides(@Query() query: GetLegalGuidesQueryDto): Promise<LegalGuideDto[]> {
    // Mock data for MVP
    return [
      {
        id: '1',
        category: 'Succession Process',
        title: 'Understanding Probate in Kenya',
        slug: 'understanding-probate-kenya',
        summary: 'A comprehensive guide to the probate process in Kenya',
        fullContent: 'Full content here...',
        appliesToRegime: ['TESTATE', 'INTESTATE'],
        appliesToReligion: ['STATUTORY'],
        legalSections: ['Section 45 LSA', 'Section 66 LSA'],
        relatedFormTypes: ['PA1_PROBATE', 'PA80_INTESTATE'],
        relatedTasks: ['FILE_PETITION', 'GET_CHIEFS_LETTER'],
        keywords: ['probate', 'succession', 'kenya'],
        viewCount: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        category: 'Forms',
        title: 'How to Fill Form P&A 80',
        slug: 'how-to-fill-pa80',
        summary: 'Step-by-step guide to filling Petition for Letters of Administration',
        fullContent: 'Full content here...',
        appliesToRegime: ['INTESTATE'],
        appliesToReligion: ['STATUTORY'],
        legalSections: ['Section 66 LSA'],
        relatedFormTypes: ['PA80_INTESTATE'],
        relatedTasks: ['PREPARE_FORMS'],
        keywords: ['pa80', 'intestate', 'forms'],
        viewCount: 75,
        createdAt: new Date().toISOString(),
      },
    ].filter((guide) => {
      if (query.category && guide.category !== query.category) return false;
      if (query.regime && !guide.appliesToRegime.includes(query.regime)) return false;
      if (query.religion && !guide.appliesToReligion.includes(query.religion)) return false;
      return true;
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
    // Mock data for MVP
    const guides = await this.getLegalGuides({});
    const guide = guides.find((g) => g.slug === slug);

    if (!guide) {
      // Return a 404 in real implementation
      return {
        id: 'not-found',
        category: 'General',
        title: 'Guide Not Found',
        slug,
        summary: 'The requested legal guide was not found',
        fullContent: 'Please check the URL or contact support',
        appliesToRegime: [],
        appliesToReligion: [],
        legalSections: [],
        relatedFormTypes: [],
        relatedTasks: [],
        keywords: [],
        viewCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    return guide;
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all legal guide categories' })
  async getCategories(): Promise<string[]> {
    return [
      'Succession Process',
      'Forms',
      'Legal Requirements',
      'Court Procedures',
      'Family Matters',
      'Asset Distribution',
    ];
  }
}
