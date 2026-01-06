import { Injectable } from '@nestjs/common';
import {
  ReadinessAssessment as PrismaAssessment,
  RiskFlag as PrismaRiskFlag,
} from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { ReadinessAssessment } from '../../domian/entities/readiness-assessment.entity';
import { RiskFlag } from '../../domian/entities/risk-flag.entity';
import { IReadinessAssessmentRepository } from '../../domian/repositories/readiness.repository';

@Injectable()
export class PrismaReadinessAssessmentRepository implements IReadinessAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEstateId(estateId: string): Promise<ReadinessAssessment | null> {
    const raw = await this.prisma.readinessAssessment.findFirst({
      where: { estateId },
    });
    if (!raw) return null;
    return this.mapToDomain(raw);
  }

  async save(assessment: ReadinessAssessment): Promise<void> {
    const data = assessment.toJSON();

    await this.prisma.readinessAssessment.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        estateId: data.estateId,
        regime: data.regime,
        religion: data.religion,
        marriageType: data.marriageType,
        targetCourt: data.targetCourt,
        hasWill: data.hasWill,
        hasMinors: data.hasMinors,
        isPolygamous: data.isPolygamous,
        isInsolvent: data.isInsolvent,
        requiresGuardian: data.requiresGuardian,
        overallScore: data.overallScore,
        status: data.status,
        documentScore: data.documentScore,
        legalScore: data.legalScore,
        familyScore: data.familyScore,
        financialScore: data.financialScore,
        totalRisks: data.totalRisks,
        criticalRisks: data.criticalRisks,
        highRisks: data.highRisks,
        mediumRisks: data.mediumRisks,
        nextSteps: data.nextSteps,
        lastCheckedAt: data.lastCheckedAt,
        checkCount: data.checkCount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        overallScore: data.overallScore,
        status: data.status,
        documentScore: data.documentScore,
        legalScore: data.legalScore,
        familyScore: data.familyScore,
        financialScore: data.financialScore,
        totalRisks: data.totalRisks,
        criticalRisks: data.criticalRisks,
        highRisks: data.highRisks,
        mediumRisks: data.mediumRisks,
        nextSteps: data.nextSteps,
        lastCheckedAt: data.lastCheckedAt,
        checkCount: data.checkCount,
        updatedAt: data.updatedAt,
      },
    });
  }

  async saveRisks(risks: RiskFlag[]): Promise<void> {
    if (risks.length === 0) return;

    // We use a transaction to ensure all risks are saved
    await this.prisma.$transaction(
      risks.map((risk) => {
        const data = risk.toJSON();
        return this.prisma.riskFlag.upsert({
          where: { id: data.id },
          create: {
            id: data.id,
            assessmentId: data.assessmentId,
            severity: data.severity,
            category: data.category,
            title: data.title,
            description: data.description,
            legalBasis: data.legalBasis,
            isResolved: data.isResolved,
            resolutionSteps: data.resolutionSteps,
            isBlocking: data.isBlocking,
            affectsScore: data.affectsScore,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          update: {
            isResolved: data.isResolved,
            updatedAt: data.updatedAt,
          },
        });
      }),
    );
  }

  async getRisks(assessmentId: string): Promise<RiskFlag[]> {
    const rawRisks = await this.prisma.riskFlag.findMany({
      where: { assessmentId },
    });

    return rawRisks.map(this.mapRiskToDomain);
  }

  // --- Mappers ---

  private mapToDomain(raw: PrismaAssessment): ReadinessAssessment {
    return ReadinessAssessment.fromPersistence({
      id: raw.id,
      userId: raw.userId,
      estateId: raw.estateId,
      regime: raw.regime,
      religion: raw.religion,
      marriageType: raw.marriageType,
      targetCourt: raw.targetCourt,
      hasWill: raw.hasWill,
      hasMinors: raw.hasMinors,
      isPolygamous: raw.isPolygamous,
      isInsolvent: raw.isInsolvent,
      requiresGuardian: raw.requiresGuardian,
      overallScore: raw.overallScore,
      status: raw.status,
      documentScore: raw.documentScore,
      legalScore: raw.legalScore,
      familyScore: raw.familyScore,
      financialScore: raw.financialScore,
      totalRisks: raw.totalRisks,
      criticalRisks: raw.criticalRisks,
      highRisks: raw.highRisks,
      mediumRisks: raw.mediumRisks,
      nextSteps: raw.nextSteps,
      lastCheckedAt: raw.lastCheckedAt,
      checkCount: raw.checkCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  private mapRiskToDomain(raw: PrismaRiskFlag): RiskFlag {
    return RiskFlag.fromPersistence({
      id: raw.id,
      assessmentId: raw.assessmentId,
      severity: raw.severity,
      category: raw.category,
      title: raw.title,
      description: raw.description,
      legalBasis: raw.legalBasis ?? undefined,
      isResolved: raw.isResolved,
      resolutionSteps: raw.resolutionSteps,
      isBlocking: raw.isBlocking,
      affectsScore: raw.affectsScore,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
