import React from 'react';
import { FileText, CheckCircle, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '../../../../components/ui';

interface TaxStatusCardProps {
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_ASSESSMENT';
    clearedItems: number;
    totalItems: number;
}

export const TaxStatusCard: React.FC<TaxStatusCardProps> = ({ status, clearedItems, totalItems }) => {
    const percentage = totalItems > 0 ? (clearedItems / totalItems) * 100 : 0;
    const isCompliant = status === 'COMPLIANT';

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    KRA Tax Compliance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className={isCompliant ? "text-green-600" : "text-amber-600"}>
                        {isCompliant ? <CheckCircle className="h-8 w-8" /> : <AlertOctagon className="h-8 w-8" />}
                    </div>
                    <div>
                        <div className="font-semibold text-lg">{status.replace('_', ' ')}</div>
                        <div className="text-xs text-muted-foreground">Tax Clearance Certificate Status</div>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span>Checklist Progress</span>
                        <span>{clearedItems}/{totalItems} steps</span>
                    </div>
                    <Progress value={percentage} className={isCompliant ? "bg-green-100" : "bg-amber-100"} />
                </div>
            </CardContent>
        </Card>
    );
};