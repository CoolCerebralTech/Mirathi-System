import { Uuid } from './uuid.vo';
export class VerificationAttemptId extends Uuid {
  constructor(value: string) {
    super(value);
  }
}
