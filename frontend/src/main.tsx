// FILE: src/main.tsx (Final Version)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Your global stylesheet
import { AppProviders } from './providers/AppProviders';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);