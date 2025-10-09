// FILE: src/components/common/StatusBadge.tsx

import { Badge } from '../ui/Badge';
import type { 
  WillStatus, 
  DocumentStatus, 
  NotificationStatus 
} from '../../types';

interface StatusBadgeProps {
  status: WillStatus | DocumentStatus | NotificationStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'SENT':
        return 'success';
      case 'DRAFT':
      case 'PENDING_VERIFICATION':
      case 'PENDING':
        return 'warning';
      case 'REVOKED':
      case 'REJECTED':
      case 'FAILED':
        return 'destructive';
      case 'EXECUTED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Badge variant={getVariant(status)}>
      {formatStatus(status)}
    </Badge>
  );
}