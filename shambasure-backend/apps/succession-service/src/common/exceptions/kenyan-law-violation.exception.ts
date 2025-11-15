import { HttpException, HttpStatus } from '@nestjs/common';

export class KenyanLawViolationException extends HttpException {
  constructor(
    public violations: string[],
    public lawSection: string,
    public requirement: string,
  ) {
    super(
      {
        message: 'Kenyan law violation',
        violations,
        lawSection,
        requirement,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    this.name = 'KenyanLawViolationException';
  }
}
