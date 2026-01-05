// FILE: src/features/family/components/FamilyTreeViz.tsx

import React from 'react';
import { User, Baby, Heart } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  Button, 
  Badge, 
  Skeleton 
} from '@/components/ui';
import { useMyFamilyTree } from '../family.api';
import { Gender } from '@/types/family.types';
import { cn } from '@/lib/utils';

interface FamilyTreeVizProps {
  onNodeClick: (memberId: string) => void;
  onAddClick: () => void;
}

// 1. Define a Unified Interface for the UI Card
// This ensures every card knows exactly what data it has
interface VisualNode {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;     // We will default this to true if missing
  isMinor: boolean;     // We will default this to false if missing
  gender?: Gender;      // Optional
  highlight?: boolean;  // For the root node
}

export const FamilyTreeViz: React.FC<FamilyTreeVizProps> = ({ onNodeClick, onAddClick }) => {
  const { data: tree, isLoading, isError } = useMyFamilyTree();

  if (isLoading) return <TreeSkeleton />;
  
  if (isError || !tree) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  // 2. Map API Data to VisualNode (Strict Transformation)
  
  const rootNode: VisualNode = {
    id: tree.id,
    name: tree.name,
    role: 'Me',
    isAlive: tree.isAlive,
    isMinor: false,
    gender: tree.gender,
    highlight: true,
  };

  const spouseNodes: VisualNode[] = (tree.spouses || []).map((spouse) => ({
    id: spouse.id,
    name: spouse.name,
    role: 'SPOUSE',
    isAlive: true, // API V1 doesn't return this for spouses, assume True for tree viz
    isMinor: false,
    gender: undefined, // Unknown in this view
  }));

  const childNodes: VisualNode[] = (tree.children || []).map((child) => ({
    id: child.id,
    name: child.name,
    role: 'CHILD',
    isAlive: true, // API V1 doesn't return this for children, assume True
    isMinor: child.isMinor,
    gender: undefined,
  }));

  return (
    <div className="flex flex-col items-center space-y-8 p-4">
      {/* 2. EGO LEVEL (Me + Spouses) */}
      <div className="relative flex items-center gap-8">
        {/* ME */}
        <NodeCard 
          node={rootNode} 
          onClick={() => onNodeClick(rootNode.id)} 
        />

        {/* SPOUSES */}
        {spouseNodes.map((spouse) => (
          <div key={spouse.id} className="relative flex items-center">
            {/* Connection Line */}
            <div className="absolute right-full top-1/2 h-0.5 w-8 -translate-y-1/2 bg-primary/20" />
            <div className="absolute right-full top-1/2 -ml-4 -mt-3">
              <Heart className="h-6 w-6 fill-red-100 text-red-500" />
            </div>
            
            <NodeCard 
              node={spouse} 
              onClick={() => onNodeClick(spouse.id)} 
            />
          </div>
        ))}
      </div>

      {/* 3. CHILDREN LEVEL */}
      {childNodes.length > 0 && (
        <div className="relative flex flex-col items-center">
          {/* Vertical Line from Ego */}
          <div className="h-8 w-0.5 bg-border" />
          
          {/* Horizontal Connector */}
          <div className="relative mb-8 h-0.5 w-[90%] bg-border">
            {/* Vertical lines to each child */}
            <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-border" />
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {childNodes.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="absolute bottom-full left-1/2 h-8 w-0.5 -translate-x-1/2 bg-border" />
                <NodeCard 
                  node={child} 
                  onClick={() => onNodeClick(child.id)} 
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State for Children */}
      {childNodes.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-0.5 bg-border/50" />
          <Button variant="ghost" size="sm" onClick={onAddClick} className="gap-2">
            <Baby className="h-4 w-4" />
            Add Children
          </Button>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

// Strictly typed NodeCard
const NodeCard: React.FC<{ node: VisualNode; onClick: () => void }> = ({ 
  node, 
  onClick 
}) => {
  return (
    <Card 
      className={cn(
        "relative w-48 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md",
        node.highlight ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" : "",
        !node.isAlive ? "opacity-70 grayscale" : ""
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center p-4 text-center">
        <div className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-sm",
          node.gender === Gender.FEMALE ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600",
          !node.isAlive && "bg-gray-200 text-gray-500",
          // Default color if gender is undefined
          !node.gender && node.isAlive && "bg-slate-100 text-slate-600"
        )}>
          {node.name.charAt(0)}
        </div>
        
        <h4 className="line-clamp-1 w-full font-semibold text-sm" title={node.name}>
          {node.name}
        </h4>
        
        <div className="mt-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {node.role}
          </Badge>
          
          {node.isMinor && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-300 bg-amber-50 text-amber-700">
              Minor
            </Badge>
          )}
          
          {!node.isAlive && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
              Deceased
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ onAddClick }: { onAddClick: () => void }) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
    <User className="mb-4 h-10 w-10 text-muted-foreground" />
    <h3 className="text-lg font-semibold">Start Your Family Tree</h3>
    <p className="mb-4 text-sm text-muted-foreground">
      Create your digital twin to begin succession planning.
    </p>
    <Button onClick={onAddClick}>Create My Profile</Button>
  </div>
);

const TreeSkeleton = () => (
  <div className="flex flex-col items-center space-y-8 p-8">
    <Skeleton className="h-32 w-48 rounded-xl" />
    <div className="h-8 w-0.5 bg-muted" />
    <div className="flex gap-6">
      <Skeleton className="h-32 w-48 rounded-xl" />
      <Skeleton className="h-32 w-48 rounded-xl" />
    </div>
  </div>
);