import React from 'react';
import { 
  Car, 
  Home, 
  Wallet, 
  MoreHorizontal, 
  FileCheck, 
  AlertCircle,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui';
import { 
  type AssetResponse, 
  AssetCategory,
  type LandDetails,
  type VehicleDetails
} from '@/types/estate.types';

interface AssetCardProps {
  asset: AssetResponse;
  onUpdateValue?: (assetId: string) => void;
  onVerify?: (assetId: string) => void;
  onRemove?: (assetId: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ 
  asset,
  onUpdateValue,
  onVerify,
  onRemove
}) => {

  // Currency Formatter
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Date Formatter
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Icon Selection based on Category
  const getIcon = () => {
    switch (asset.category) {
      case AssetCategory.LAND:
      case AssetCategory.PROPERTY:
        return <Home className="h-5 w-5 text-blue-600" />;
      case AssetCategory.VEHICLE:
        return <Car className="h-5 w-5 text-orange-600" />;
      case AssetCategory.BANK_ACCOUNT:
      case AssetCategory.INVESTMENT:
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      default:
        return <Wallet className="h-5 w-5 text-purple-600" />;
    }
  };

  // Category Background Color
  const getCategoryColor = () => {
    switch (asset.category) {
      case AssetCategory.LAND:
      case AssetCategory.PROPERTY:
        return 'bg-blue-50';
      case AssetCategory.VEHICLE:
        return 'bg-orange-50';
      case AssetCategory.BANK_ACCOUNT:
      case AssetCategory.INVESTMENT:
        return 'bg-green-50';
      default:
        return 'bg-purple-50';
    }
  };

  // Status Badge Variant
  const getStatusBadge = () => {
    switch (asset.status) {
      case 'VERIFIED':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            <FileCheck className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case 'DISPUTED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Disputed
          </Badge>
        );
      case 'ENCUMBERED':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            <AlertCircle className="w-3 h-3 mr-1" /> Encumbered
          </Badge>
        );
      case 'LIQUIDATED':
        return (
          <Badge variant="outline" className="border-gray-400 text-gray-600">
            Liquidated
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            Pending Verification
          </Badge>
        );
    }
  };

  // Type Guards for Details
  const isLandDetails = (details: unknown): details is LandDetails => {
    return (details as LandDetails)?.titleDeedNumber !== undefined;
  };

  const isVehicleDetails = (details: unknown): details is VehicleDetails => {
    return (details as VehicleDetails)?.registrationNumber !== undefined;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2.5 ${getCategoryColor()} rounded-lg`}>
            {getIcon()}
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
              {asset.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {asset.category.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
              <span className="sr-only">Open actions menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Asset Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onUpdateValue && (
              <DropdownMenuItem onClick={() => onUpdateValue(asset.id)}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Update Value
              </DropdownMenuItem>
            )}
            {!asset.isVerified && onVerify && (
              <DropdownMenuItem onClick={() => onVerify(asset.id)}>
                <FileCheck className="mr-2 h-4 w-4" />
                Upload Proof
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onRemove && (
              <DropdownMenuItem 
                onClick={() => onRemove(asset.id)}
                className="text-destructive focus:text-destructive"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Remove Asset
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value Display */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(asset.estimatedValue)}
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {getStatusBadge()}
          
          {asset.isEncumbered && (
            <Badge variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" /> 
              Has Encumbrance
            </Badge>
          )}
        </div>

        {/* Encumbrance Details */}
        {asset.isEncumbered && asset.encumbranceDetails && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs font-medium text-red-900 mb-1">Encumbrance Details:</p>
            <p className="text-xs text-red-700 line-clamp-2">{asset.encumbranceDetails}</p>
          </div>
        )}

        {/* Polymorphic Details Section */}
        {asset.details && (
          <div className="space-y-2 text-xs bg-muted/30 p-3 rounded-lg border">
            {/* LAND DETAILS */}
            {isLandDetails(asset.details) && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Title Deed No:</span>
                  <span className="font-medium text-foreground text-right">
                    {asset.details.titleDeedNumber}
                  </span>
                </div>
                {asset.details.parcelNumber && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Parcel No:</span>
                    <span className="font-medium text-foreground text-right">
                      {asset.details.parcelNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location:
                  </span>
                  <span className="font-medium text-foreground text-right">
                    {asset.details.county.replace(/_/g, ' ')}
                    {asset.details.subCounty && `, ${asset.details.subCounty}`}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Land Use:</span>
                  <span className="font-medium text-foreground">
                    {asset.details.landCategory}
                  </span>
                </div>
                {asset.details.sizeInAcres && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium text-foreground">
                      {asset.details.sizeInAcres} Acres
                    </span>
                  </div>
                )}
              </>
            )}

            {/* VEHICLE DETAILS */}
            {isVehicleDetails(asset.details) && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Registration:</span>
                  <span className="font-medium text-foreground font-mono">
                    {asset.details.registrationNumber}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Make & Model:</span>
                  <span className="font-medium text-foreground text-right">
                    {asset.details.make} {asset.details.model}
                  </span>
                </div>
                {asset.details.year && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Year:
                    </span>
                    <span className="font-medium text-foreground">
                      {asset.details.year}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium text-foreground">
                    {asset.details.vehicleCategory.replace(/_/g, ' ')}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Added {formatDate(asset.createdAt)}
          </span>
          {asset.proofDocumentUrl && (
            <a 
              href={asset.proofDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <FileCheck className="h-3 w-3" />
              View Proof
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};