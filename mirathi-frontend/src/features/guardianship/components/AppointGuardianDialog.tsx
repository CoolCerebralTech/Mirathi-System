import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

import { AppointGuardianRequestSchema, GuardianRole, GuardianAppointmentSource } from '../guardianship.types';
import { useAppointGuardian } from '../guardianship.api';

interface AppointGuardianDialogProps {
  guardianshipId: string;
  candidateMemberId: string; // The person being appointed (from Family Service)
  candidateName: string;
}

export function AppointGuardianDialog({ guardianshipId, candidateMemberId, candidateName }: AppointGuardianDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useAppointGuardian(guardianshipId, {
    onSuccess: () => setOpen(false)
  });

  const form = useForm({
    resolver: zodResolver(AppointGuardianRequestSchema),
    defaultValues: {
      guardianMemberId: candidateMemberId,
      guardianName: candidateName,
      relationshipToWard: '',
      role: 'LEGAL_GUARDIAN',
      isPrimary: false,
      appointmentSource: 'COURT_ORDER',
      appointmentDate: new Date().toISOString().split('T')[0],
      contactInfo: {
        primaryPhone: '',
        physicalAddress: '',
        email: ''
      },
      initialPowers: {
        canManageProperty: false,
        canMakeMedicalDecisions: true,
        canChooseEducation: true,
        canTravelInternationally: false
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" /> Appoint as Guardian
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Appoint {candidateName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutate(d))} className="space-y-4">
            <Tabs defaultValue="role" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="role">Role & Contact</TabsTrigger>
                <TabsTrigger value="powers">Legal Powers</TabsTrigger>
                <TabsTrigger value="source">Authority</TabsTrigger>
              </TabsList>

              {/* TAB 1: ROLE & CONTACT */}
              <TabsContent value="role" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Role</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                             {Object.values(GuardianRole).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                           </SelectContent>
                         </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relationshipToWard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl><Input placeholder="e.g. Uncle" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="contactInfo.primaryPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Required for MFA)</FormLabel>
                      <FormControl><Input placeholder="07..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="contactInfo.physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Residence (For Service)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* TAB 2: POWERS */}
              <TabsContent value="powers" className="space-y-4 py-4">
                <div className="grid gap-4 border p-4 rounded-md">
                   {[
                     { name: 'canMakeMedicalDecisions', label: 'Consent to Medical Treatment' },
                     { name: 'canChooseEducation', label: 'Determine Education / Schooling' },
                     { name: 'canManageProperty', label: 'Manage Ward\'s Property & Money' },
                     { name: 'canTravelInternationally', label: 'Authorise International Travel' },
                   ].map((power) => (
                      <FormField
                        key={power.name}
                        control={form.control}
                        name={`initialPowers.${power.name}` as any}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>{power.label}</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                   ))}
                </div>
              </TabsContent>

              {/* TAB 3: SOURCE */}
              <TabsContent value="source" className="space-y-4 py-4">
                 <FormField
                    control={form.control}
                    name="appointmentSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source of Authority</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                             {Object.values(GuardianAppointmentSource).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                           </SelectContent>
                         </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
              </TabsContent>
            </Tabs>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Processing...' : 'Confirm Appointment'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}