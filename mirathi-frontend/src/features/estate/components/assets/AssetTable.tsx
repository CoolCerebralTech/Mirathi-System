import React from 'react';
import { Lock, Users } from 'lucide-react';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow, 
    Badge, Button, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
} from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { type AssetItemResponse } from '../../../../types/estate.types';

interface AssetTableProps {
    assets: AssetItemResponse[];
    onEdit: (asset: AssetItemResponse) => void;
    onView: (asset: AssetItemResponse) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({ assets, onEdit, onView }) => {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assets.map((asset) => (
                        <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(asset)}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{asset.name}</span>
                                    {asset.isEncumbered && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-600">
                                            <Lock className="h-3 w-3" /> Encumbered
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{asset.type.toLowerCase()}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {asset.status.replace(/_/g, ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {asset.isCoOwned ? (
                                    <Badge variant="secondary" className="gap-1 text-[10px]">
                                        <Users className="h-3 w-3" /> Co-Owned
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Sole Owner</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                <MoneyDisplay amount={asset.currentValue} />
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <span className="text-lg leading-none">...</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(asset)}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(asset)}>Edit Asset</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                    {assets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No assets found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};