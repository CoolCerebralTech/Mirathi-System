import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

export function DeactivateAccountForm() {
  const [confirmText, setConfirmText] = useState('');
  
  const handleDeactivate = () => {
    // Since no mutation exists in the provided schema, we mock a contact action
    window.location.href = "mailto:support@shambasure.com?subject=Account Deletion Request";
  };

  const isConfirmed = confirmText === 'DELETE';

  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-red-900/20 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
          <p className="text-sm text-slate-400">
            Deactivating your account will disable your access and hide your profile. 
            Data retention is subject to our legal compliance policy.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-slate-300">
            To confirm, type <span className="font-mono font-bold text-white">DELETE</span> below:
          </Label>
          <Input 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="border-red-900/30 focus:border-red-500"
            placeholder="DELETE"
          />
        </div>

        <Button 
          variant="destructive" 
          className="w-full sm:w-auto"
          disabled={!isConfirmed}
          onClick={handleDeactivate}
        >
          Request Account Deletion
        </Button>
      </div>
    </div>
  );
}