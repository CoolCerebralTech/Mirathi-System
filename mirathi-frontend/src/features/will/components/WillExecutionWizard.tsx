import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PenTool, Users, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useExecuteWill } from '../will.api';
import { ExecuteWillRequestSchema } from '../will.types';

import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

export function WillExecutionWizard({ willId }: { willId: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useExecuteWill(willId, { onSuccess: () => setOpen(false) });

  const form = useForm({
    resolver: zodResolver(ExecuteWillRequestSchema),
    defaultValues: {
      executionDate: new Date().toISOString(),
      location: '',
      witnesses: [
        { 
          fullName: '', nationalId: '', 
          declarations: { isNotBeneficiary: true, isNotSpouseOfBeneficiary: true, isOfSoundMind: true, understandsDocument: true, isActingVoluntarily: true } 
        },
        { 
          fullName: '', nationalId: '', 
          declarations: { isNotBeneficiary: true, isNotSpouseOfBeneficiary: true, isOfSoundMind: true, understandsDocument: true, isActingVoluntarily: true } 
        }
      ]
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
          <PenTool className="mr-2 h-5 w-5" /> Execute Will (Finalize)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execution Ceremony (Section 11)</DialogTitle>
          <p className="text-sm text-muted-foreground">
             For a Will to be valid in Kenya, it must be signed by the Testator in the presence of two witnesses, who must also sign.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(mutate)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="executionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Signing</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value.split('T')[0]} /></FormControl>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Nairobi, Kenya" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue="witness1" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="witness1">Witness 1</TabsTrigger>
                <TabsTrigger value="witness2">Witness 2</TabsTrigger>
              </TabsList>
              
              {[0, 1].map((index) => (
                <TabsContent key={index} value={`witness${index + 1}`} className="space-y-4 border p-4 rounded-md mt-2">
                   <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-slate-500" />
                      <h4 className="font-semibold">Witness {index + 1} Details</h4>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.fullName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.nationalId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National ID</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                   </div>

                   <div className="space-y-2 bg-slate-50 p-3 rounded">
                      <p className="text-xs font-bold text-slate-500 uppercase">Legal Declarations</p>
                      
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.declarations.isNotBeneficiary`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is NOT a beneficiary (S.13)</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`witnesses.${index}.declarations.isOfSoundMind`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Is of sound mind</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                   </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
               <p className="text-sm text-amber-800 flex gap-2">
                  <CheckCheck className="h-5 w-5" />
                  By clicking "Complete Execution", you confirm that the Testator and both Witnesses are physically present together.
               </p>
            </div>

            <DialogFooter>
               <Button type="submit" size="lg" disabled={isPending}>
                 {isPending ? 'Processing...' : 'Complete Execution'}
               </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}