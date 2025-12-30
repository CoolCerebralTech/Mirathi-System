import { Building2, Car, Landmark, Briefcase, Wallet, Edit, Lock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { AssetItemResponse, AssetType } from '../estate.types';

export function AssetCard({ asset }: { asset: AssetItemResponse }) {
  
  const getIcon = () => {
    switch (asset.type) {
      case 'LAND': return <Building2 className="h-6 w-6 text-emerald-600" />;
      case 'VEHICLE': return <Car className="h-6 w-6 text-blue-600" />;
      case 'FINANCIAL': return <Landmark className="h-6 w-6 text-purple-600" />;
      case 'BUSINESS': return <Briefcase className="h-6 w-6 text-slate-600" />;
      default: return <Wallet className="h-6 w-6 text-slate-600" />;
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-4 flex-1">
        <div className="bg-slate-50 p-3 rounded-lg border">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
             <h4 className="font-semibold text-slate-900 truncate pr-2">{asset.name}</h4>
             {asset.isEncumbered && (
               <Badge variant="destructive" className="text-[10px] h-5"><Lock className="h-3 w-3 mr-1" /> Secured</Badge>
             )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 truncate">
             {asset.identifier}
          </p>

          <div className="mt-3 flex gap-2">
            <Badge variant="outline" className="bg-slate-50">{asset.type}</Badge>
            {asset.status === 'SOLD' && <Badge variant="secondary">SOLD</Badge>}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 px-4 py-3 border-t flex justify-between items-center rounded-b-lg">
        <span className="font-bold text-slate-700">{asset.currentValue.formatted}</span>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4 text-slate-500" />
        </Button>
      </div>
    </Card>
  );
}