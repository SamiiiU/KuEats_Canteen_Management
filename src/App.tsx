import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MenuManagement } from './pages/MenuManagement';
import { OrderHistory } from './pages/OrderHistory';
import { Reviews } from './pages/Reviews';
import { Layout } from './components/Layout';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'menu' | 'history' | 'reviews'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9f9f9' }}>
        <div className="text-xl font-semibold" style={{ color: '#831615' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login />
      
    )

  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'menu' && <MenuManagement />}
        {currentPage === 'history' && <OrderHistory />}
        {currentPage === 'reviews' && <Reviews />}
      </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
