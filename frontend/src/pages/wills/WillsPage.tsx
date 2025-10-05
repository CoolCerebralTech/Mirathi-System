// src/pages/wills/WillsPage.tsx
// ============================================================================
// Main Wills Page (List View)
// ============================================================================
// - Displays a list of all wills created by the user.
// - Uses the `useWills` hook for data and the `createWill` action.
// - Renders a grid of `WillCard` components.
// - Handles navigation to the detail page for the newly created will.
// ============================================================================

import { useNavigate } from 'react-router-dom';
import { useWills } from '../../hooks/useWills';
import { WillCard } from '../../features/wills/WillCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';

export const WillsPage = () => {
  const navigate = useNavigate();
  const { wills, loading, error, createWill } = useWills();

  const handleCreateWill = async () => {
    try {
      const newWill = await createWill(`My Will - ${new Date().toLocaleDateString()}`);
      if (newWill) {
        navigate(`/wills/${newWill.id}`);
      }
    } catch (err) {
      // Error is handled by the hook's toast
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    if (error) {
      return <div className="text-center py-20 text-red-600 font-medium">{error}</div>;
    }

    if (wills.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-lg font-medium text-gray-900">You haven't created any wills.</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first will to begin planning your succession.
          </p>
        </div>
      );
    }

    return (
      <ul role="list" className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {wills.map((will) => (
          <WillCard key={will.id} will={will} />
        ))}
      </ul>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wills</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your last will and testament documents and beneficiary assignments.
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleCreateWill}>
            Create New Will
          </Button>
        </div>
      </div>

      {/* Wills Grid */}
      {renderContent()}
    </>
  );
};