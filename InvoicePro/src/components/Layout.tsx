import React, { useState, useContext, createContext } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const SidebarCollapseContext = createContext<{
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}>({ collapsed: false, setCollapsed: () => {} });

const Layout = ({ children }: LayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Compute margin class for main content
  const mainMarginClass = !collapsed ? 'md:ml-64' : '';

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar is always visible on desktop, toggled on mobile */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 overflow-auto ml-0 ${mainMarginClass}`}>
          {/* Hamburger only on mobile, and on desktop when sidebar is collapsed */}
          <div className="flex items-center p-4">
            {/* Hamburger for mobile */}
            <button
              className="p-2 rounded hover:bg-gray-100 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Hamburger for desktop when sidebar is collapsed */}
            {collapsed && (
              <button
                className="p-2 rounded hover:bg-gray-100 hidden md:inline-flex"
                onClick={() => setCollapsed(false)}
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarCollapseContext.Provider>
  );
};

export default Layout;
