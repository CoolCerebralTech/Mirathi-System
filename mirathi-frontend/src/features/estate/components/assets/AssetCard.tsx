import React from 'react';
import { 
  Car, 
  Home, 
  Wallet, 
  MoreHorizontal, 
  FileCheck, 
  AlertCircle 
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
import { type AssetResponse, AssetCategory } from '@/types/estate.types';

interface AssetCardProps {
  asset: AssetResponse;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  // 1. Helper for Currency Formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // 2. Icon Selection based on Category
  const getIcon = () => {
    switch (asset.category) {
      case AssetCategory.LAND:
      case AssetCategory.PROPERTY:
        return <Home className="h-5 w-5 text-blue-600" />;
      case AssetCategory.VEHICLE:
      case AssetCategory.TRACTOR:
      case AssetCategory.MOTORCYCLE:
        return <Car className="h-5 w-5 text-orange-600" />;
      default:
        return <Wallet className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-full">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium leading-none">
              {asset.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{asset.category}</p>
          </div>
        </div>
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Update Value</DropdownMenuItem>
            <DropdownMenuItem>Upload Proof</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Remove Asset</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(asset.estimatedValue)}
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {asset.isVerified ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              <FileCheck className="w-3 h-3 mr-1" /> Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Pending Proof
            </Badge>
          )}

          {asset.isEncumbered && (
            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" /> Encumbered
            </Badge>
          )}
        </div>

        {/* Polymorphic Details Section */}
        <div className="mt-4 space-y-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          {/* LAND DETAILS */}
          {asset.category === AssetCategory.LAND && asset.details && (
            <>
              <div className="flex justify-between">
                <span>Title No:</span>
                <span className="font-medium text-foreground">{asset.details.titleDeedNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium text-foreground">{asset.details.sizeInAcres} Acres</span>
              </div>
              <div className="flex justify-between">
                <span>County:</span>
                <span className="font-medium text-foreground">{asset.details.county}</span>
              </div>
            </>
          )}

          {/* VEHICLE DETAILS */}
          {asset.category === AssetCategory.VEHICLE && asset.details && (
            <>
              <div className="flex justify-between">
                <span>Reg No:</span>
                <span className="font-medium text-foreground">{asset.details.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Make/Model:</span>
                <span className="font-medium text-foreground">{asset.details.make} {asset.details.model}</span>
              </div>
            </>
          )}

          {/* GENERIC DETAILS */}
          {!['LAND', 'VEHICLE'].includes(asset.category) && (
             <div className="flex justify-between">
               <span>Description:</span>
               <span className="font-medium text-foreground line-clamp-1">{asset.name}</span>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};