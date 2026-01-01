// components/assets/AssetTable.tsx

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Badge
} from '@/components/ui';
import { MoreHorizontal, Eye, Edit, Gavel } from 'lucide-react';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { AssetStatus, type AssetItemResponse } from '@/types/estate.types';

interface AssetTableProps {
  data: AssetItemResponse[];
  onViewDetails: (id: string) => void;
  onUpdateValuation?: (id: string) => void;
  onLiquidate?: (id: string) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ 
  data, 
  onViewDetails,
  onUpdateValuation,
  onLiquidate
}) => {
  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location / ID</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => (
            <TableRow key={asset.id} className="hover:bg-slate-50">
              <TableCell className="font-medium cursor-pointer" onClick={() => onViewDetails(asset.id)}>
                <div className="flex flex-col">
                  <span>{asset.name}</span>
                  {asset.isCoOwned && (
                    <span className="text-[10px] text-amber-600">Co-Owned ({asset.estateSharePercentage}%)</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal text-xs">
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {asset.identifier || asset.location || '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                <MoneyDisplay amount={asset.currentValue} />
              </TableCell>
              <TableCell>
                 <Badge 
                    variant={asset.status === AssetStatus.ACTIVE ? "default" : "secondary"}
                    className={asset.status === AssetStatus.ACTIVE ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" : ""}
                 >
                    {asset.status}
                 </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails(asset.id)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    
                    {onUpdateValuation && (
                      <DropdownMenuItem onClick={() => onUpdateValuation(asset.id)}>
                        <Edit className="mr-2 h-4 w-4" /> Update Valuation
                      </DropdownMenuItem>
                    )}
                    
                    {onLiquidate && asset.status === AssetStatus.ACTIVE && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onLiquidate(asset.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Gavel className="mr-2 h-4 w-4" /> Liquidate Asset
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No assets recorded in the inventory yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};