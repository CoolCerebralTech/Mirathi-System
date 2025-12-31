import React from 'react';
import { GitBranch, User } from 'lucide-react';
import { useFamilyGraph } from '../family.api';
import { LoadingSpinner } from '../../../components/common';

interface FamilyTreeProps {
  familyId: string;
}

// A simple recursive tree renderer (or list for now)
export const FamilyTree: React.FC<FamilyTreeProps> = ({ familyId }) => {
  const { data, isLoading } = useFamilyGraph(familyId);

  if (isLoading) return <LoadingSpinner text="Mapping kinship graph..." />;
  if (!data) return null;

  return (
    <div className="relative min-h-[400px] w-full overflow-hidden rounded-xl border bg-slate-50 p-8">
      <div className="absolute top-4 right-4 flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
            <User className="h-4 w-4" /> {data.stats.nodesCount} Members
        </div>
        <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" /> {data.stats.generations} Generations
        </div>
      </div>

      <div className="flex flex-col items-center justify-center h-full text-center">
         {/* 
            NOTE: In a production environment, integrate 'reactflow' or 'vis-network' here.
            For this setup, we display a placeholder for the Canvas.
         */}
         <div className="rounded-full bg-white p-4 shadow-sm mb-4">
            <GitBranch className="h-12 w-12 text-slate-300" />
         </div>
         <h3 className="font-semibold text-slate-900">Interactive Graph Visualization</h3>
         <p className="text-slate-500 max-w-md">
            The visual family tree renders here using the nodes and edges from the API.
            (Requires graph library integration).
         </p>
      </div>
    </div>
  );
};