// src/features/assets/AssetTypeIcon.tsx
// ============================================================================
// Asset Type Icon Component
// ============================================================================
// - A simple utility component that displays a relevant Heroicon based on the
//   provided `AssetType`.
// - This enhances the UI by providing quick visual identification of assets.
// ============================================================================

import {
  MapPinIcon,
  BanknotesIcon,
  TruckIcon,
  HomeModernIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import type { AssetType } from '../../types';

interface AssetTypeIconProps {
  type: AssetType;
  className?: string;
}

const iconMap: Record<AssetType, React.ElementType> = {
  LAND_PARCEL: MapPinIcon,
  BANK_ACCOUNT: BanknotesIcon,
  VEHICLE: TruckIcon,
  PROPERTY: HomeModernIcon,
  OTHER: CircleStackIcon,
};

export const AssetTypeIcon = ({ type, className = 'h-6 w-6' }: AssetTypeIconProps) => {
  const IconComponent = iconMap[type] || CircleStackIcon;
  return <IconComponent className={className} aria-hidden="true" />;
};