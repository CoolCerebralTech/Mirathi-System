import { Injectable } from '@nestjs/common';
import { EventType } from '@shamba/common';
import { MessagingService } from '@shamba/messaging';
import { LoggerService } from '@shamba/observability';

@Injectable()
export class SuccessionEvents {
  constructor(
    private messagingService: MessagingService,
    private logger: LoggerService,
  ) {}

  async willCreated(payload: {
    willId: string;
    testatorId: string;
    title: string;
    status: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.WILL_CREATED, payload);
      this.logger.info('Will created event published', 'SuccessionEvents', {
        willId: payload.willId,
      });
    } catch (error) {
      this.logger.error('Failed to publish will created event', 'SuccessionEvents', {
        error: error.message,
        willId: payload.willId,
      });
    }
  }

  async willActivated(payload: {
    willId: string;
    testatorId: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('will.activated', payload);
      this.logger.info('Will activated event published', 'SuccessionEvents', {
        willId: payload.willId,
      });
    } catch (error) {
      this.logger.error('Failed to publish will activated event', 'SuccessionEvents', {
        error: error.message,
        willId: payload.willId,
      });
    }
  }

  async willRevoked(payload: {
    willId: string;
    testatorId: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('will.revoked', payload);
      this.logger.info('Will revoked event published', 'SuccessionEvents', {
        willId: payload.willId,
      });
    } catch (error) {
      this.logger.error('Failed to publish will revoked event', 'SuccessionEvents', {
        error: error.message,
        willId: payload.willId,
      });
    }
  }

  async assetCreated(payload: {
    assetId: string;
    ownerId: string;
    name: string;
    type: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish(EventType.ASSET_CREATED, payload);
      this.logger.info('Asset created event published', 'SuccessionEvents', {
        assetId: payload.assetId,
      });
    } catch (error) {
      this.logger.error('Failed to publish asset created event', 'SuccessionEvents', {
        error: error.message,
        assetId: payload.assetId,
      });
    }
  }

  async beneficiaryAssigned(payload: {
    willId: string;
    assetId: string;
    beneficiaryId: string;
    sharePercent?: number;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('beneficiary.assigned', payload);
      this.logger.info('Beneficiary assigned event published', 'SuccessionEvents', {
        willId: payload.willId,
        assetId: payload.assetId,
      });
    } catch (error) {
      this.logger.error('Failed to publish beneficiary assigned event', 'SuccessionEvents', {
        error: error.message,
        willId: payload.willId,
      });
    }
  }

  async familyCreated(payload: {
    familyId: string;
    creatorId: string;
    name: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('family.created', payload);
      this.logger.info('Family created event published', 'SuccessionEvents', {
        familyId: payload.familyId,
      });
    } catch (error) {
      this.logger.error('Failed to publish family created event', 'SuccessionEvents', {
        error: error.message,
        familyId: payload.familyId,
      });
    }
  }

  async familyMemberAdded(payload: {
    familyId: string;
    memberId: string;
    role: string;
    addedBy: string;
    timestamp: Date;
  }) {
    try {
      await this.messagingService.publish('family.member_added', payload);
      this.logger.info('Family member added event published', 'SuccessionEvents', {
        familyId: payload.familyId,
        memberId: payload.memberId,
      });
    } catch (error) {
      this.logger.error('Failed to publish family member added event', 'SuccessionEvents', {
        error: error.message,
        familyId: payload.familyId,
      });
    }
  }
}