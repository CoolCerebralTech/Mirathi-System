import { Uuid } from './uuid.vo';

export class AssetId extends Uuid {
  constructor(value: string) {
    super(value);
  }
}
