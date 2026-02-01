import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  X,
  Home,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  List,
  PlusCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface NavSubItem {
  label: string;
  to: string;
  icon?: React.ElementType;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  children?: NavSubItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  {
    label: 'Shipments',
    to: '/shipments',
    icon: Package,
    children: [
      { label: 'All Shipments', to: '/shipments', icon: List },
      { label: 'New Shipment', to: '/shipments/new', icon: PlusCircle },
    ],
  },
  { label: 'Users', to: '/users', icon: Users, adminOnly: true },
  {
    label: 'Analytics',
    to: '/analytics',
    icon: BarChart3,
    children: [
      { label: 'Overview', to: '/analytics', icon: TrendingUp },
      { label: 'Reports', to: '/analytics/reports', icon: FileText },
    ],
  },
  { label: 'Settings', to: '/settings', icon: Settings },
];

interface MainLayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (to: string) => {
    setExpandedMenus((prev) => {
      const next = new Set<string>();
      if (prev.has(to)) return next; // Close if already expanded
      next.add(to); // Expand this one only (hides others)
      return next;
    });
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">TMS</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const children = item.children ?? [];
              const isParentActive =
                location.pathname === item.to ||
                children.some((c: NavSubItem) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));
              const hasChildren = children.length > 0;

              if (hasChildren) {
                const isExpanded = expandedMenus.has(item.to);
                return (
                  <div key={item.to} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.to)}
                      className={`flex w-full items-center px-4 py-3 rounded-lg transition-colors text-left ${
                        isParentActive && !children.some((c: NavSubItem) => location.pathname === c.to)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium flex-1">{item.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                    </button>
                    {isExpanded && children.map((sub: NavSubItem) => {
                      const SubIcon = sub.icon;
                      const isSubActive = location.pathname === sub.to;
                      return (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center pl-12 pr-4 py-2.5 rounded-lg text-sm transition-colors ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {SubIcon && <SubIcon className="w-4 h-4 mr-2.5 text-gray-400" />}
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 overflow-visible">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search */}
              <div className="hidden sm:flex items-center ml-4 lg:ml-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shipments..."
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user?.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Horizontal nav (secondary) - wrapper for absolute dropdown positioning */}
          <div className="relative">
            <div className="hidden md:flex items-center h-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 bg-gray-50 overflow-x-auto overflow-y-visible gap-1">
              {filteredNavItems.map((item) => {
                const hChildren = item.children ?? [];
                const isParentActive =
                  location.pathname === item.to ||
                  hChildren.some((c: NavSubItem) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));
                const hasChildren = hChildren.length > 0;

                if (hasChildren) {
                  const isExpanded = expandedMenus.has(item.to);
                  return (
                    <div key={item.to} className="relative h-12 flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.to)}
                        className={`flex items-center gap-1 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                          isParentActive
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {item.label}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                      </button>
                    </div>
                  );
                }

                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Absolute positioned sub-options container - below horizontal bar, not in page flow */}
            {(expandedMenus.has('/shipments') || expandedMenus.has('/analytics')) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-0 flex gap-4 px-4 sm:px-6 lg:px-8 py-3 bg-white border-b border-gray-100 shadow-lg">
                {expandedMenus.has('/shipments') && (
                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">Shipments</span>
                    {(navItems.find((n) => n.to === '/shipments')?.children ?? []).map((sub: NavSubItem) => {
                      const isSubActive = location.pathname === sub.to;
                      return (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => toggleMenu('/shipments')}
                          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                            isSubActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
                {expandedMenus.has('/analytics') && (
                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1">Analytics</span>
                    {(navItems.find((n) => n.to === '/analytics')?.children ?? []).map((sub: NavSubItem) => {
                      const isSubActive = location.pathname === sub.to;
                      return (
                        <Link
                          key={sub.to}
                          to={sub.to}
                          onClick={() => toggleMenu('/analytics')}
                          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                            isSubActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
