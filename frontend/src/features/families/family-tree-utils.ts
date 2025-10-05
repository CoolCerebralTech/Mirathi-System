// src/features/families/family-tree-utils.ts
// ============================================================================
// Family Tree Utilities and Custom Components
// ============================================================================
// - Contains the logic for transforming family data into a graph structure.
// - Defines custom React Flow nodes for displaying family members.
// - Includes an auto-layout algorithm (Dagre) to position nodes neatly.
// ============================================================================
import { MarkerType, Position } from 'reactflow';
import Dagre from 'dagre';
import type { Family, FamilyMember } from '../../types';
const dagreGraph = new Dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 172;
const nodeHeight = 80;
// This function calculates the layout of the nodes using Dagre
export const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
const isHorizontal = direction === 'LR';
dagreGraph.setGraph({ rankdir: direction });
nodes.forEach((node) => {
dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
});
edges.forEach((edge) => {
dagreGraph.setEdge(edge.source, edge.target);
});
Dagre.layout(dagreGraph);
nodes.forEach((node) => {
const nodeWithPosition = dagreGraph.node(node.id);
node.targetPosition = isHorizontal ? Position.Left : Position.Top;
node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
node.position = {
x: nodeWithPosition.x - nodeWidth / 2,
y: nodeWithPosition.y - nodeHeight / 2,
};
return node;
});
return { nodes, edges };
};
// This function transforms our Family data into nodes and edges for React Flow
export const familyToFlow = (family: Family, onRemoveMember: (userId: string) => void) => {
const nodes = family.members.map((member) => ({
id: member.userId,
type: 'familyMemberNode',
data: { member, onRemoveMember, isCreator: member.userId === family.creatorId },
position: { x: 0, y: 0 }, // Position will be calculated by Dagre
}));
// Simple edge logic: connect every non-creator member to the creator
const edges = family.members
.filter((member) => member.userId !== family.creatorId)
.map((member) => ({
id: e-${family.creatorId}-${member.userId},
source: family.creatorId,
target: member.userId,
markerEnd: { type: MarkerType.ArrowClosed },
}));
return getLayoutedElements(nodes, edges);
};
// --- Custom Node Component ---
// This is the React component that will render inside each node of the tree
export const FamilyMemberNode = ({ data }: { data: { member: FamilyMember, onRemoveMember: (userId: string) => void, isCreator: boolean }}) => {
const { member, onRemoveMember, isCreator } = data;
const initials = ${member.user.firstName.charAt(0)}${member.user.lastName.charAt(0)};
return (
    <div className="w-44 h-20 p-2 rounded-lg bg-white shadow-md border-2 border-gray-200 text-center">
        <div className="flex items-center gap-2">
             <div className={`flex-shrink-0 h-10 w-10 rounded-full ${isCreator ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} flex items-center justify-center`}>
                <span className="font-bold text-sm">{initials}</span>
            </div>
            <div className="text-left">
                <p className="font-bold text-sm truncate">{member.user.firstName} {member.user.lastName}</p>
                <p className="text-xs text-gray-500">{isCreator ? 'Creator' : member.role.replace('_', ' ')}</p>
            </div>
        </div>
         {!isCreator && (
            <button 
                onClick={() => onRemoveMember(member.userId)} 
                className="text-xs text-red-500 hover:text-red-700 absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow"
            >
                Remove
            </button>
        )}
    </div>
);
};