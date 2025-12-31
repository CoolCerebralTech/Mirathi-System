import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from '../../../components/ui';
import { usePolygamyStatus } from '../family.api';
import { LoadingSpinner, EmptyState } from '../../../components/common';

interface PolygamyDistributionViewProps {
  familyId: string;
}

export const PolygamyDistributionView: React.FC<PolygamyDistributionViewProps> = ({ familyId }) => {
  const { data, isLoading, isError } = usePolygamyStatus(familyId);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-red-500">Failed to load polygamy analysis.</div>;
  if (!data) return <EmptyState title="No Data" description="Analysis not available." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h3 className="text-lg font-medium">Structure Analysis</h3>
            <p className="text-sm text-muted-foreground">
                Estate Status: <span className="font-semibold text-foreground">{data.isPolygamous ? 'Polygamous' : 'Monogamous'}</span>
            </p>
         </div>
         <Badge variant={data.hasUnassignedRisks ? "destructive" : "default"}>
            {data.hasUnassignedRisks ? 'Unassigned Members Detected' : 'Structure Valid'}
         </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.houses.map((house) => (
            <Card key={house.houseId} className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex justify-between">
                        <span>{house.houseName}</span>
                        <Badge variant="outline">#{house.order}</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Matriarch: {house.headOfHouse.name}
                    </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Members:</span>
                            <span className="font-medium">{house.memberCount}</span>
                        </div>
                        <div className="flex justify-between text-sm text-amber-600">
                            <span>Minors:</span>
                            <span className="font-medium">{house.minorCount}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}

        {/* Unassigned Bucket */}
        {data.unassignedMembers.length > 0 && (
             <Card className="border-l-4 border-l-red-500 border-dashed bg-red-50/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Unassigned
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        These members belong to no house.
                    </p>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                    <ul className="text-sm list-disc pl-4 space-y-1">
                        {data.unassignedMembers.map(m => (
                            <li key={m.memberId}>{m.name}</li>
                        ))}
                    </ul>
                </CardContent>
             </Card>
        )}
      </div>
    </div>
  );
};