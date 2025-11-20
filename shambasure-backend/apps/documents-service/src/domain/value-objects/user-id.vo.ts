import { Uuid } from './uuid.vo';
export class UserId extends Uuid {
  constructor(value: string) {
    super(value);
  }
}
