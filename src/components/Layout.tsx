import React from 'react';
import { LayoutDashboard, Menu, History, Star, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'menu' | 'history' | 'reviews';
  onNavigate: (page: 'dashboard' | 'menu' | 'history' | 'reviews') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard' as const, label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'menu' as const, label: 'Menu Management', icon: Menu },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'reviews' as const, label: 'Reviews', icon: Star },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f9f9f9' }}>
      <aside className="w-64 shadow-lg" style={{ backgroundColor: '#831615' }}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" style={{ color: '#831615' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">KuEats</h1>
              <p className="text-xs text-white opacity-75">Canteen Dashboard</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-white text-gray-900'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
