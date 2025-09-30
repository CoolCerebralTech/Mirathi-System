import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { Will, WillStatus } from '@shamba/database';
import { CreateWillRequestDto, UpdateWillRequestDto, AssignBeneficiaryRequestDto, EventPattern, ShambaEvent } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';
import { MessagingService } from '@shamba/messaging';
import { WillsRepository } from '../repositories/wills.repository';
import { AssetsRepository } from '../repositories/assets.repository';

@Injectable()
export class WillsService {
  constructor(
    private readonly willsRepository: WillsRepository,
    private readonly assetsRepository: AssetsRepository, // Dependency for validation
    private readonly messagingService: MessagingService,
  ) {}

  async create(testatorId: string, data: CreateWillRequestDto): Promise<Will> {
    const will = await this.willsRepository.create({
      ...data,
      testator: { connect: { id: testatorId } },
    });
    
    // Publish event
    const event: ShambaEvent = {
        type: EventPattern.WILL_CREATED,
        timestamp: new Date(),
        version: '1.0',
        source: 'succession-service',
        data: { willId: will.id, testatorId: will.testatorId, title: will.title, status: will.status }
    };
    this.messagingService.emit(event);

    return will;
  }

  async findOne(willId: string, currentUser: JwtPayload): Promise<Will> {
    const will = await this.willsRepository.findOneOrFail({ id: willId });
    if (will.testatorId !== currentUser.sub && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Access denied to this will.');
    }
    return will;
  }
  
  async findForTestator(testatorId: string): Promise<Will[]> {
      return this.willsRepository.findMany({ testatorId });
  }

  async update(willId: string, data: UpdateWillRequestDto, currentUser: JwtPayload): Promise<Will> {
    const will = await this.findOne(willId, currentUser); // Re-uses auth check
    if (will.status !== WillStatus.DRAFT) {
      throw new ConflictException('Only draft wills can be modified.');
    }
    return this.willsRepository.update(willId, data);
  }

  async addAssignment(willId: string, data: AssignBeneficiaryRequestDto, currentUser: JwtPayload) {
      const will = await this.findOne(willId, currentUser); // Re-uses auth check
      if (will.status !== WillStatus.DRAFT) {
        throw new ConflictException('Assignments can only be added to draft wills.');
      }
      
      // Business Logic: Verify the asset belongs to the testator
      const asset = await this.assetsRepository.findOneOrFail({ id: data.assetId });
      if (asset.ownerId !== currentUser.sub) {
          throw new ForbiddenException('Cannot assign an asset that does not belong to the testator.');
      }
      
      return this.willsRepository.addAssignment({
          will: { connect: { id: willId } },
          asset: { connect: { id: data.assetId } },
          beneficiary: { connect: { id: data.beneficiaryId } },
          sharePercent: data.sharePercent
      });
  }
  
  // ... other methods like delete, activateWill, revokeWill would follow a similar pattern ...
}