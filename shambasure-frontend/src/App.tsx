// FILE: src/App.tsx

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppProviders } from './providers/AppProviders';

// ============================================================================
// APP COMPONENT
// ============================================================================

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;