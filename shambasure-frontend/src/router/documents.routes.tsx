// FILE: src/router/documents.routes.tsx (New & Finalized)

import { Route, Routes } from 'react-router-dom';
import { DocumentsPage } from '../pages/DocumentsPage';
import { DocumentDetailPage } from '../pages/DocumentDetailPage';

/**
 * DocumentRoutes - Defines all routes for the document management feature.
 * 
 * This component is designed to be nested within a protected layout,
 * typically under a path like `/dashboard/documents`.
 *
 * ROUTES:
 * - / (index): Renders the main table view of all documents.
 * - /:id : Renders the detailed view for a single document.
 */
export function DocumentRoutes() {
  return (
    <Routes>
      {/* The main page for this feature, showing the list of documents */}
      <Route index element={<DocumentsPage />} />
      
      {/* The detail page, which takes a document ID as a URL parameter */}
      <Route path=":id" element={<DocumentDetailPage />} />
    </Routes>
  );
}