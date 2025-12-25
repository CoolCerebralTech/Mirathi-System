import { Gender } from '../../../../domain/value-objects/family-enums.vo';

/**
 * View Model optimized for Graph Visualization Libraries.
 * (Compatible with React Flow, D3.js, Cytoscape).
 */
export interface FamilyGraphVM {
  familyId: string;

  // The Entities (People)
  nodes: GraphNode[];

  // The Relationships (Lines)
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'MEMBER' | 'GHOST'; // Ghost = Referenced but not fully created

  data: {
    fullName: string;
    gender: Gender;
    dateOfBirth?: string; // ISO Date
    isAlive: boolean;
    photoUrl?: string;

    // Visual Cues
    isHeadOfFamily: boolean;
    isVerified: boolean;
    hasMissingData: boolean; // Triggers UI warning
  };

  // Layout Hints (Optional, calculated by backend or frontend)
  generationLevel?: number;
}

export interface GraphEdge {
  id: string;
  source: string; // Member ID
  target: string; // Member ID
  type: 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING';

  data: {
    isBiological: boolean;
    isLegal: boolean; // Adoption flag
    isVerified: boolean;
    label?: string; // e.g. "Married 2010"
  };

  style?: {
    stroke?: string; // Dotted line for unverified, Solid for verified
    strokeWidth?: number;
  };
}
