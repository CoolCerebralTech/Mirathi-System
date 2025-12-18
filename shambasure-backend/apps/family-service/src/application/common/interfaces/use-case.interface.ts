import { Result } from '../base/result';

export interface IUseCase<IRequest, IResponse> {
  execute(request?: IRequest): Promise<Result<IResponse>> | Result<IResponse>;
}
export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
}
export interface IQuery {
  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
}

export interface ICommandHandler<TCommand, TResult> extends IUseCase<TCommand, TResult> {
  execute(command: TCommand): Promise<Result<TResult>>;
}

export interface IQueryHandler<TQuery, TResult> extends IUseCase<TQuery, TResult> {
  execute(query: TQuery): Promise<Result<TResult>>;
}

// Kenyan Legal Compliance Context
export interface IKenyanLegalUseCase<IRequest, IResponse> extends IUseCase<IRequest, IResponse> {
  readonly applicableLawSections: string[]; // e.g., ["S.29", "S.40"]
  readonly complianceRequirements: string[];

  validateLegalCompliance(request: IRequest): Promise<Result<void>>;
  getComplianceReport(): Promise<ComplianceReport>;
}

export interface ComplianceReport {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  recommendations: string[];
}

export interface ComplianceViolation {
  section: string;
  requirement: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ComplianceWarning {
  section: string;
  issue: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Event Publisher Interface
export interface IEventPublisher {
  publish(event: any): Promise<void>;
  publishAll(events: any[]): Promise<void>;
}
