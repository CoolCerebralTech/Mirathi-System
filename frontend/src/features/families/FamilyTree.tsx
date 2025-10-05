// src/features/families/FamilyTree.tsx
// ============================================================================
// Family Tree Visualization Component
// ============================================================================
// - Renders an interactive, graphical representation of a family group.
// - Uses `reactflow` to manage the node-based diagram.
// - Utilizes utility functions to transform family data and auto-layout the tree.
// - Includes controls for adding/removing members directly from the graph.
// ============================================================================

import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import type { Family } from '../../types';
import { familyToFlow, FamilyMemberNode } from './family-tree-utils';

// We need to tell React Flow about our custom node type
const nodeTypes = {
  familyMemberNode: FamilyMemberNode,
};

interface FamilyTreeProps {
    family: Family;
    onAddMember: (familyId: string, userId: string, role: any) => void;
    onRemoveMember: (familyId: string, userId: string) => void;
}

export const FamilyTree = ({ family, onAddMember, onRemoveMember }: FamilyTreeProps) => {

    const handleRemove = (userId: string) => {
        if (window.confirm('Are you sure you want to remove this member from the family?')) {
            onRemoveMember(family.id, userId);
        }
    };

    // `useMemo` is important here to prevent re-calculating the layout on every render
    const { nodes, edges } = useMemo(() => familyToFlow(family, handleRemove), [family]);

    return (
        <div className="w-full h-[600px] bg-gray-50 rounded-lg border">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView // Automatically zooms to fit the whole tree
                className="react-flow-subtle-bg"
            >
                <Background />
                <Controls />
                <MiniMap />

                {/* We can add a panel for controls like "Add Member" here */}
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        // This would open a modal to search for a user and add them
                        onClick={() => alert('"Add Member" functionality would open a modal here.')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
                    >
                        Add Member
                    </button>
                </div>
            </ReactFlow>
        </div>
    );
};