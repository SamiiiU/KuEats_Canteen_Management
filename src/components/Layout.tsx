import React, { useState } from 'react';
import { LayoutDashboard, Menu, History, Star, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'menu' | 'history' | 'reviews';
  onNavigate: (page: 'dashboard' | 'menu' | 'history' | 'reviews') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'menu' as const, label: 'Menu Management', icon: Menu },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'reviews' as const, label: 'Reviews', icon: Star },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f9f9f9' }}>
      {/* Mobile sidebar toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#831615] text-white p-2 rounded-full shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          w-64 shadow-lg transition-all duration-300
          bg-[#831615]
          md:relative md:translate-x-0 md:block
          fixed top-0 left-0 h-full z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:h-auto
        `}
        style={{ backgroundColor: '#831615' }}
      >
        {/* Close button for mobile */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white bg-[#831615] p-2 rounded-full"
            aria-label="Close sidebar"
          >
            <UtensilsCrossed className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 pt-0 md:pt-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="rounded-full flex items-center justify-center">
              <img src={logo} alt="KuEats Logo" style={{ width: 100 }} className="w-20 h-20" />
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
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false); // Close sidebar on mobile after navigation
                  }}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
