export class ReadinessScore {
  constructor(
    public readonly overall: number,
    public readonly document: number,
    public readonly legal: number,
    public readonly family: number,
    public readonly financial: number,
  ) {}

  get status(): 'NOT_STARTED' | 'IN_PROGRESS' | 'READY' | 'COMPLETE' {
    if (this.overall === 0) return 'NOT_STARTED';
    if (this.overall < 80) return 'IN_PROGRESS';
    if (this.overall < 100) return 'READY';
    return 'COMPLETE';
  }

  get percentage(): string {
    return `${this.overall}%`;
  }

  canGenerateForms(): boolean {
    return this.overall >= 80;
  }
}
