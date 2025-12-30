import { BaseQuery } from '../../../common/base/base.query';

/**
 * Query to fetch the Node-Edge structure for visualization.
 *
 * Investor Note / Visual Tech:
 * This supports libraries like React Flow or D3.js.
 * We allow filtering by 'depth' or 'focusMemberId' to handle
 * large African families (100+ members) without crashing the browser.
 */
export class GetFamilyGraphQuery extends BaseQuery {
  public readonly familyId: string;

  // Viewport Options
  public readonly focusMemberId?: string; // Center graph on this person
  public readonly depth?: number; // How many generations up/down? (Default: All)
  public readonly includeArchived?: boolean; // Show deleted members?

  constructor(props: {
    userId: string;
    familyId: string;
    focusMemberId?: string;
    depth?: number;
    includeArchived?: boolean;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.focusMemberId = props.focusMemberId;
    this.depth = props.depth;
    this.includeArchived = props.includeArchived ?? false;
  }
}
