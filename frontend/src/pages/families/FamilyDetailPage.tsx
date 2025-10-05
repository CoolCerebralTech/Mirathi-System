// src/pages/families/FamilyDetailPage.tsx
// ============================================================================
// Family Detail Page (Tree View)
// ============================================================================
// - Displays the detailed view of a single family, featuring the graphical tree.
// - Fetches the specific family's data based on the ID from the URL.
// - Renders the `FamilyTree` component, passing in the data and actions.
// ============================================================================

import { useParams, Link } from 'react-router-dom';
import { useFamilies } from '../../hooks/useFamilies'; // We can reuse the same hook
import { FamilyTree } from '../../features/families/FamilyTree';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export const FamilyDetailPage = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const { families, loading, error, addMember, removeMember } = useFamilies();

  const family = families.find(f => f.id === familyId);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    if (error) {
      return <div className="text-center py-20 text-red-600 font-medium">{error}</div>;
    }

    if (!family) {
      return <div className="text-center py-20 text-gray-600">Family not found.</div>;
    }

    return (
        <div className="mt-6">
            <FamilyTree 
                family={family}
                onAddMember={addMember}
                onRemoveMember={removeMember}
            />
        </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-5">
        <div className="mb-4">
            <Link to="/families" className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-600 hover:text-indigo-600">
                <ArrowLeftIcon className="h-5 w-5" />
                Back to all families
            </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{family ? family.name : 'Family Details'}</h1>
        <p className="mt-2 text-sm text-gray-500">
            Visualize and manage the members of this family group.
        </p>
      </div>

      {renderContent()}
    </div>
  );
};