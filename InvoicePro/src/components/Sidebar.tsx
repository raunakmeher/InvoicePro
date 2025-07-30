import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { SidebarCollapseContext } from './Layout';

interface SidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useContext(SidebarCollapseContext);
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Invoices', path: '/invoices' },
    { icon: Users, label: 'Clients', path: '/clients' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Responsive sidebar: fixed on desktop, overlay on mobile
  return (
    <>
      {/* Desktop sidebar (always visible, sticky) */}
      {!collapsed && (
        <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:bg-white md:shadow-lg md:z-30 h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">InvoicePro</h1>
              <span className="text-sm text-gray-500">Professional Invoicing</span>
            </div>
            {/* Cross icon to collapse sidebar */}
            <button
              className="p-2 rounded hover:bg-gray-100 transition-colors md:block hidden"
              onClick={() => setCollapsed(true)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="mt-6 flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="absolute bottom-6 left-0 w-full flex justify-center px-6">
            <button
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
      {/* Mobile sidebar (overlay) */}
      {sidebarOpen && setSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="relative w-64 bg-white shadow-lg h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">InvoicePro</h1>
                <span className="text-sm text-gray-500">Professional Invoicing</span>
              </div>
              <button
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-6 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                    location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-6 left-0 w-full flex justify-center px-6">
              <button
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          {/* Overlay background */}
          <div className="flex-1 bg-black bg-opacity-30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}
    </>
  );
};

export default Sidebar;
