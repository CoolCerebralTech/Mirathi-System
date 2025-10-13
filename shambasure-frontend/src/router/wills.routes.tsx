// FILE: src/router/wills.routes.tsx

import { Route, Routes } from 'react-router-dom';
import { WillsPage } from '../pages/wills/WillsPage';
import { WillDetailPage } from '../pages/wills/WillDetailPage';

export function WillRoutes() {
  return (
    <Routes>
      <Route index element={<WillsPage />} />
      <Route path=":id" element={<WillDetailPage />} />
    </Routes>
  );
}