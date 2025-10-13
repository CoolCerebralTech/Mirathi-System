// FILE: src/router/families.routes.tsx

import { Route, Routes } from 'react-router-dom';
import { FamiliesPage } from '../pages/families/FamiliesPage';
import { FamilyDetailPage } from '../pages/families/FamilyDetailPage';

export function FamilyRoutes() {
  return (
    <Routes>
      <Route index element={<FamiliesPage />} />
      <Route path=":id" element={<FamilyDetailPage />} />
    </Routes>
  );
}