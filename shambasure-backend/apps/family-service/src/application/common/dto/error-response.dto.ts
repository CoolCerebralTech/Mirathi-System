export class ErrorResponseDto {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: Date;
  path?: string;
  requestId?: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string,
    path?: string,
    requestId?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date();
    this.path = path;
    this.requestId = requestId;
  }

  static create(
    statusCode: number,
    message: string,
    error?: string,
    path?: string,
    requestId?: string,
  ): ErrorResponseDto {
    return new ErrorResponseDto(statusCode, message, error, path, requestId);
  }
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  errors: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors: Record<string, string[]>,
    path?: string,
    requestId?: string,
  ) {
    super(statusCode, message, 'Validation Error', path, requestId);
    this.errors = errors;
  }

  static fromValidationErrors(
    errors: Record<string, string[]>,
    path?: string,
    requestId?: string,
  ): ValidationErrorResponseDto {
    return new ValidationErrorResponseDto(400, 'Validation failed', errors, path, requestId);
  }
}

export class BusinessRuleViolationDto extends ErrorResponseDto {
  ruleCode: string;
  ruleDescription: string;

  constructor(
    statusCode: number,
    message: string,
    ruleCode: string,
    ruleDescription: string,
    path?: string,
    requestId?: string,
  ) {
    super(statusCode, message, 'Business Rule Violation', path, requestId);
    this.ruleCode = ruleCode;
    this.ruleDescription = ruleDescription;
  }
}

// Kenyan Legal Specific Error Responses
export class KenyanLegalComplianceErrorDto extends ErrorResponseDto {
  section: string; // e.g., "S.40 LSA", "S.29 LSA"
  complianceRequirement: string;
  suggestedRemedy?: string;

  constructor(
    statusCode: number,
    message: string,
    section: string,
    complianceRequirement: string,
    suggestedRemedy?: string,
    path?: string,
    requestId?: string,
  ) {
    super(statusCode, message, 'Kenyan Legal Compliance Error', path, requestId);
    this.section = section;
    this.complianceRequirement = complianceRequirement;
    this.suggestedRemedy = suggestedRemedy;
  }
}

export class NotFoundErrorDto extends ErrorResponseDto {
  resource: string;
  resourceId: string;

  constructor(resource: string, resourceId: string, path?: string, requestId?: string) {
    super(404, `${resource} with ID ${resourceId} not found`, 'Not Found', path, requestId);
    this.resource = resource;
    this.resourceId = resourceId;
  }
}
