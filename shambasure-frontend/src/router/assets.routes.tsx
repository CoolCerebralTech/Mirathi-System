import { Route, Routes } from 'react-router-dom';
import { AssetsPage } from '../pages/assets/AssetsPage';

export function AssetRoutes() {
  return (
    <Routes>
      <Route index element={<AssetsPage />} />
    </Routes>
  );
}