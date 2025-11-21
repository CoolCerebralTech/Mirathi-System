export class SuccessionAnalysisCompletedEvent {
  constructor(
    public readonly familyId: string,
    public readonly analysis: {
      deceasedMemberId?: string;
      potentialHeirs: string[];
      dependants: string[];
      successionType: 'TESTATE' | 'INTESTATE' | 'MIXED';
      complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
      recommendations: string[];
    },
  ) {}

  getEventType(): string {
    return 'SuccessionAnalysisCompletedEvent';
  }

  getEventVersion(): number {
    return 1;
  }
}
