// src/pages/families/FamiliesPage.tsx
// ============================================================================
// Main Families Page (List View)
// ============================================================================
// - Displays a list of all family groups the user is a member of.
// - Uses the useFamilies hook for data and actions.
// - Renders a grid of `FamilyCard` components.
// - Provides a primary action to create a new family via a modal.
// ============================================================================
import { useState } from 'react';
import { useFamilies } from '../../hooks/useFamilies';
import { FamilyCard } from '../../features/families/FamilyCard';
import { CreateFamilyModal } from '../../features/families/CreateFamilyModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
export const FamiliesPage = () => {
const [isModalOpen, setIsModalOpen] = useState(false);
const { families, loading, error, createFamily } = useFamilies();
const renderContent = () => {
if (loading) {
return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
}
if (error) {
  return <div className="text-center py-20 text-red-600 font-medium">{error}</div>;
}

if (families.length === 0) {
  return (
    <div className="text-center py-20">
      <h3 className="text-lg font-medium text-gray-900">No families found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create a family group to start planning your succession.
      </p>
    </div>
  );
}

return (
  <ul role="list" className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
    {families.map((family) => (
      <FamilyCard key={family.id} family={family} />
    ))}
  </ul>
);
};
return (
<>
{/* Page Header */}
<div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
<div>
<h1 className="text-3xl font-bold text-gray-900">My Families (HeirLink™)</h1>
<p className="mt-2 text-sm text-gray-500">
Manage your family groups to visualize relationships and plan your legacy.
</p>
</div>
<div className="ml-auto">
<Button onClick={() => setIsModalOpen(true)}>
Create New Family
</Button>
</div>
</div>
{/* Families Grid */}
  {renderContent()}

  {/* Create Family Modal */}
  <CreateFamilyModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onCreate={createFamily}
  />
</>
);
};