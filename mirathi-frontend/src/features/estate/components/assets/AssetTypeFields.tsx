// components/assets/AssetTypeFields.tsx

import React from 'react';
import { 
  MapPin, 
  FileText, 
  Car, 
  Building2, 
  Briefcase, 
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { AssetType, type AssetItemResponse } from '@/types/estate.types';

// Define the specific detail interfaces based on the input schema
interface LandDetails {
  locationDescription?: string;
  titleDeedNumber?: string;
  acreage?: number;
}

interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  registrationNumber?: string;
  color?: string;
}

interface FinancialDetails {
  institutionName: string;
  accountNumber: string;
}

interface BusinessDetails {
  businessType: string;
  shareholdingPercentage: number;
}

// Extend the base response to include these optional fields
interface DetailedAssetItem extends AssetItemResponse {
  landDetails?: LandDetails;
  vehicleDetails?: VehicleDetails;
  financialDetails?: FinancialDetails;
  businessDetails?: BusinessDetails;
}

interface AssetTypeFieldsProps {
  asset: AssetItemResponse;
}

export const AssetTypeFields: React.FC<AssetTypeFieldsProps> = ({ asset }) => {
  // Safe cast to our extended type
  const details = asset as DetailedAssetItem;

  switch (asset.type) {
    case AssetType.LAND: {
      const land = details.landDetails;
      
      // Handle missing details gracefully
      if (!land) {
        return <MissingDetailsWarning type="Land" />;
      }

      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="col-span-2 flex items-start gap-2 text-slate-700">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
            <span>{land.locationDescription || asset.location || 'Location not specified'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">Title No.</span>
            <span className="font-medium">{land.titleDeedNumber || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">Acreage</span>
            <span className="font-medium">{land.acreage ? `${land.acreage} Acres` : 'N/A'}</span>
          </div>
        </div>
      );
    }

    case AssetType.VEHICLE: {
      const car = details.vehicleDetails;

      if (!car) {
        return <MissingDetailsWarning type="Vehicle" />;
      }

      return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="col-span-2 flex items-center gap-2 font-medium text-slate-900">
            <Car className="h-4 w-4 text-slate-500" />
            {car.make} {car.model} ({car.year})
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">Reg No.</span>
            <span className="font-medium font-mono bg-slate-100 px-1 rounded w-fit">
              {car.registrationNumber || asset.identifier}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">Color</span>
            <span className="font-medium">{car.color || 'N/A'}</span>
          </div>
        </div>
      );
    }

    case AssetType.FINANCIAL: {
      const bank = details.financialDetails;

      if (!bank) {
        return <MissingDetailsWarning type="Financial" />;
      }

      return (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <Building2 className="h-4 w-4 text-slate-500" />
            {bank.institutionName}
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase">Account No.</span>
              <span className="font-mono">{bank.accountNumber || asset.identifier}</span>
            </div>
            <CreditCard className="h-4 w-4 text-slate-300" />
          </div>
        </div>
      );
    }

    case AssetType.BUSINESS: {
      const biz = details.businessDetails;

      if (!biz) {
        return <MissingDetailsWarning type="Business" />;
      }

      return (
        <div className="space-y-2 text-sm">
           <div className="flex items-center gap-2 font-medium text-slate-900">
            <Briefcase className="h-4 w-4 text-slate-500" />
            {biz.businessType?.replace('_', ' ')}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Shares:</span>
            <span className="font-medium">{biz.shareholdingPercentage}% Ownership</span>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
          <FileText className="h-4 w-4" />
          {asset.description || 'No specific details available'}
        </div>
      );
  }
};

// Internal helper for missing data
const MissingDetailsWarning = ({ type }: { type: string }) => (
  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
    <AlertCircle className="h-4 w-4" />
    <span>Missing {type} details</span>
  </div>
);