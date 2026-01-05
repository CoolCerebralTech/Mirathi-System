export class WillCompleteness {
  constructor(
    public readonly score: number, // 0-100
    public readonly isComplete: boolean,
    public readonly hasExecutor: boolean,
    public readonly hasBeneficiaries: boolean,
    public readonly hasWitnesses: boolean,
    public readonly witnessCount: number,
    public readonly warnings: string[],
    public readonly requiredActions: string[],
  ) {}

  static calculate(
    hasExecutor: boolean,
    beneficiaryCount: number,
    witnessCount: number,
  ): WillCompleteness {
    const warnings: string[] = [];
    const requiredActions: string[] = [];
    let score = 0;

    // Executor (30 points)
    if (hasExecutor) {
      score += 30;
    } else {
      warnings.push('⚠️ No executor appointed');
      requiredActions.push('Appoint an executor to manage your estate');
    }

    // Beneficiaries (30 points)
    const hasBeneficiaries = beneficiaryCount > 0;
    if (hasBeneficiaries) {
      score += 30;
    } else {
      warnings.push('⚠️ No beneficiaries added');
      requiredActions.push('Add at least one beneficiary');
    }

    // Witnesses (40 points - CRITICAL for Kenyan law)
    const hasWitnesses = witnessCount >= 2;
    if (witnessCount === 0) {
      warnings.push('❌ No witnesses (REQUIRED: 2 witnesses under Kenyan Law)');
      requiredActions.push('Add 2 witnesses to make the will legally valid');
    } else if (witnessCount === 1) {
      score += 20;
      warnings.push('⚠️ Only 1 witness (REQUIRED: 2 witnesses)');
      requiredActions.push('Add 1 more witness');
    } else {
      score += 40;
    }

    const isComplete = score === 100;

    return new WillCompleteness(
      score,
      isComplete,
      hasExecutor,
      hasBeneficiaries,
      hasWitnesses,
      witnessCount,
      warnings,
      requiredActions,
    );
  }
}
