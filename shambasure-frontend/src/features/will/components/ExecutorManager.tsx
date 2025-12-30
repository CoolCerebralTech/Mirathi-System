import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, UserPlus, ArrowRight } from 'lucide-react';

import { useAppointExecutor } from '../will.api';
import { AppointExecutorRequestSchema } from '../will.types';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';

interface ExecutorManagerProps {
  willId: string;
  executors: Array<{ id: string; name: string; priority: string; status: string }>;
}

export function ExecutorManager({ willId, executors }: ExecutorManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Executors</CardTitle>
        <AppointExecutorDialog willId={willId} />
      </CardHeader>
      <CardContent>
         {executors.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No executors appointed.</p>}
         <div className="space-y-3">
            {executors.map(ex => (
              <div key={ex.id} className="flex items-center gap-3 p-3 border rounded-md bg-white shadow-sm">
                 <div className="bg-slate-100 p-2 rounded-full">
                    <Briefcase className="h-4 w-4 text-slate-600" />
                 </div>
                 <div className="flex-1">
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant={ex.priority === 'PRIMARY' ? 'default' : 'secondary'} className="text-[10px]">
                         {ex.priority}
                       </Badge>
                       {ex.status === 'PENDING' && <span className="text-[10px] text-amber-600">Pending Consent</span>}
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </CardContent>
    </Card>
  );
}

function AppointExecutorDialog({ willId }: { willId: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useAppointExecutor(willId, { onSuccess: () => setOpen(false) });

  const form = useForm({
    resolver: zodResolver(AppointExecutorRequestSchema),
    defaultValues: {
      executorIdentity: { type: 'EXTERNAL', fullName: '' },
      priority: 'PRIMARY',
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Appoint</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Appoint Executor</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
             <FormField
              control={form.control}
              name="executorIdentity.fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Legal Name" {...field} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="PRIMARY">Primary Executor</SelectItem>
                      <SelectItem value="SUBSTITUTE">Substitute (If Primary fails)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>Confirm Appointment</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}