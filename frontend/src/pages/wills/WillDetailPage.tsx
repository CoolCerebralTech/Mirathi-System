// src/pages/wills/WillDetailPage.tsx
// ============================================================================
// Will Detail Page
// ============================================================================
// - The main workspace for managing a single will.
// - Fetches the specific will's data using the `useWills(willId)` hook.
// - Displays the `BeneficiaryManager` to handle assignments.
// - Provides primary actions like "Activate Will".
// ============================================================================

import { useParams, Link } from 'react-router-dom';
import { useWills } from '../../hooks/useWills';
import { BeneficiaryManager } from '../../features/wills/BeneficiaryManager';
import { WillStatusBadge } from '../../features/wills/WillStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';
import { Button } from '../../components/ui/Button';

export const WillDetailPage = () => {
  const { willId } = useParams<{ willId: string }>();
  
  // The hook is now in "single will" mode because we pass the ID
  const { will, loading, error, assignBeneficiary, removeBeneficiary, activateWill } = useWills(willId);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    if (error || !will) {
      return <div className="text-center py-20 text-red-600 font-medium">{error || 'Will not found.'}</div>;
    }

    return (
        <BeneficiaryManager 
            will={will}
            onAssign={(data) => assignBeneficiary(will.id, data)}
            onRemove={(assignmentId) => removeBeneficiary(will.id, assignmentId)}
        />
    );
  };

  return (
    <div>
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-5">
            <div className="mb-4">
                <Link to="/wills" className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
                    <ArrowLeftIcon className="h-5 w-5" />
                    Back to all wills
                </Link>
            </div>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{will ? will.title : 'Will Details'}</h1>
                    {will && <div className="mt-2"><WillStatusBadge status={will.status} /></div>}
                </div>
                 {will?.status === 'DRAFT' && (
                    <div className="ml-auto">
                        <Button onClick={() => activateWill(will.id)}>
                            Activate Will
                        </Button>
                    </div>
                 )}
            </div>
        </div>
      
      {/* Beneficiary Manager */}
      {renderContent()}
    </div>
  );
};