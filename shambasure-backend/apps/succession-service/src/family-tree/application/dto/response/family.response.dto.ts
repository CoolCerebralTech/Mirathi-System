import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FamilyResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  ownerId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // We don't expose 'treeData' raw cache here usually,
  // unless specifically requested for performance debugging.
  // The Graph endpoint handles the visual structure.
}
