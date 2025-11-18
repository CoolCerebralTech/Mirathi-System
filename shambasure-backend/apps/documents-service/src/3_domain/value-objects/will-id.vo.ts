import { Uuid } from './uuid.vo';
export class WillId extends Uuid {
  constructor(value: string) {
    super(value);
  }
}
