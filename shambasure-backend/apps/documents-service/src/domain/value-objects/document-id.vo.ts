import { Uuid } from './uuid.vo';
export class DocumentId extends Uuid {
  constructor(value: string) {
    super(value);
  }
}
