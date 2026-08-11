import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';

// Componente interno para usar el hook dentro del provider
function AppContent() {
  useRealtimeNotifications();
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;