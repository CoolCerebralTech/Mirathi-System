import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Home, ShieldCheck, AlertCircle } from 'lucide-react';

import { usePolygamyStatus, useEstablishHouse } from '../family.api';
import { EstablishPolygamousHouseRequestSchema } from '../family.types';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface PolygamyHouseManagerProps {
  familyId: string;
}

export function PolygamyHouseManager({ familyId }: PolygamyHouseManagerProps) {
  const { data: status, isLoading } = usePolygamyStatus(familyId);

  if (isLoading) return <LoadingSpinner />;
  if (!status) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Polygamous Houses (Section 40)</h2>
          <p className="text-sm text-muted-foreground">
            {status.isPolygamous 
              ? `Active Distribution: ${status.distributionMethod.replace('_', ' ')}` 
              : 'Family is currently marked as Monogamous'}
          </p>
        </div>
        <EstablishHouseDialog familyId={familyId} nextOrder={(status.houses.length || 0) + 1} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {status.houses.map((house) => (
          <Card key={house.houseId} className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold">{house.houseName}</CardTitle>
                <Badge variant="outline">House #{house.order}</Badge>
              </div>
              <CardDescription>Head: {house.headOfHouse.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members:</span>
                  <span className="font-medium">{house.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minors:</span>
                  <span className="font-medium">{house.minorCount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Est. Share:</span>
                  <span className="font-bold text-primary">{house.theoreticalSharePercentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {status.houses.length === 0 && (
          <Card className="col-span-full border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Home className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">No distinct houses defined</p>
              <p className="text-xs text-muted-foreground mt-1">
                If this is a polygamous family, establish houses to ensure fair distribution.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {status.hasUnassignedRisks && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h4 className="text-sm font-bold text-yellow-800">Unassigned Members Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {status.unassignedMembers.length} family members are not assigned to any specific house. 
                This will block succession processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for the Form Dialog
function EstablishHouseDialog({ familyId, nextOrder }: { familyId: string, nextOrder: number }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useEstablishHouse(familyId, { onSuccess: () => setOpen(false) });

  const form = useForm({
    resolver: zodResolver(EstablishPolygamousHouseRequestSchema),
    defaultValues: {
      houseOrder: nextOrder,
      houseName: '',
      originalWifeId: '', // Would need a Select for existing wives, simplified for now
      establishmentType: undefined
    }
  });

  // Note: In a real implementation, we would fetch eligible wives (spouses) to populate a dropdown
  // For now, inputting ID manually or assuming context passed
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <ShieldCheck className="mr-2 h-4 w-4" /> Establish House
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Establish New House</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-4">
             {/* Simplified Form Fields */}
             <FormField
                control={form.control}
                name="houseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Name (e.g. House of Wanjiku)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="originalWifeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matriarch (Wife) ID</FormLabel>
                    <FormControl><Input placeholder="UUID of the wife" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>Establish House</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}