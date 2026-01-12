import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCurrentUser } from '@/api/user/user.api';
import { useCreateWill } from '@/api/estate/estate.api';
import { WillBuilder } from '@/features/estate/components/will/WillBuilder';

export const EstateWillPage: React.FC = () => {
  useParams<{ estateId: string; }>();
  const navigate = useNavigate();
  
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id;
  const userName = currentUser?.firstName && currentUser?.lastName
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser?.email || 'User';

  // Check if will exists (you'll need to add this to your API)
  const [hasWill, setHasWill] = React.useState(false);
  const [willId, setWillId] = React.useState<string | null>(null);

  const { mutate: createWill, isPending: isCreatingWill } = useCreateWill({
    onSuccess: (data) => {
      setWillId(data.id);
      setHasWill(true);
    },
  });

  const handleCreateWill = () => {
    if (!userId) return;
    
    createWill({
      userId,
      testatorName: userName,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/estate')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estate Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Will & Succession Planning</h1>
          <p className="text-muted-foreground">
            Create and manage your legally compliant will
          </p>
        </div>
      </div>

      {/* Main Content */}
      {!hasWill && !willId ? (
        // No will exists - Show create prompt
        <div className="max-w-2xl mx-auto">
          <div className="p-12 border-2 border-dashed rounded-lg text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">Create Your Will</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Ensure your estate is distributed according to your wishes. 
                Our system guides you through creating a legally compliant will 
                under Kenyan law.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <Button 
                onClick={handleCreateWill}
                size="lg"
                disabled={isCreatingWill}
                className="min-w-[200px]"
              >
                {isCreatingWill && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreatingWill ? 'Creating Will...' : 'Create Will'}
              </Button>

              <div className="pt-6 border-t space-y-3 text-sm text-left max-w-md mx-auto">
                <p className="font-semibold text-foreground">What you'll need:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Beneficiaries (who will inherit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>2 witnesses (not beneficiaries)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Executor (person to administer estate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Asset list (already in your inventory)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Legal Framework Info */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Legal Requirements</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Will must be in writing (Section 11, Law of Succession Act)</p>
              <p>• Testator must be of sound mind and over 18 years</p>
              <p>• Requires 2 witnesses who are not beneficiaries (Section 13)</p>
              <p>• All parties must sign on the same date</p>
            </div>
          </div>
        </div>
      ) : (
        // Will exists - Show WillBuilder
        willId && (
          <WillBuilder 
            willId={willId}
            testatorName={userName}
          />
        )
      )}
    </div>
  );
};