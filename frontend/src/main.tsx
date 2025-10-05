// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router'; // Import our new router
import './index.css'; // Assuming you have a base CSS file for UnoCSS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} /> {/* Render the RouterProvider */}
  </React.StrictMode>,
);