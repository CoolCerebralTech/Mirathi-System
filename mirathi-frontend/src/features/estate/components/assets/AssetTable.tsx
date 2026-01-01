// components/assets/AssetTable.tsx

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { MoreHorizontal } from 'lucide-react';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { AssetStatus, type AssetItemResponse } from '@/types/estate.types';

interface AssetTableProps {
  assets: AssetItemResponse[];
  onViewDetails: (id: string) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ assets, onViewDetails }) => {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location / ID</TableHead>
            <TableHead className="text-right">Valuation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewDetails(asset.id)}>
              <TableCell className="font-medium">
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
                    className={asset.status === AssetStatus.ACTIVE ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : ""}
                 >
                    {asset.status}
                 </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-slate-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {assets.length === 0 && (
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