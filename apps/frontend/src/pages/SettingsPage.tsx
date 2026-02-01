import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import { Navigate, Link } from 'react-router-dom';
import { User, Bell, Shield, Settings, Users, Sliders } from 'lucide-react';

const PAGINATION_OPTIONS = [
  { value: 10, label: '10 items per page' },
  { value: 20, label: '20 items per page' },
  { value: 50, label: '50 items per page' },
];

const VIEW_OPTIONS = [
  { value: 'grid' as const, label: 'List view' },
  { value: 'tile' as const, label: 'Cards view' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY' as const, label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY' as const, label: 'DD/MM/YYYY (EU)' },
];

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { settings, updateSettings } = useSystemSettings();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Admin settings and account preferences</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Admin Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Admin Settings</h2>
            <span className="ml-auto text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Admin only</span>
          </div>
          <div className="p-6 space-y-4">
            <Link
              to="/users"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">User Management</p>
                <p className="text-sm text-gray-500">Create, edit, and delete user accounts</p>
              </div>
            </Link>

            {/* System Preferences */}
            <div className="p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Sliders className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">System Preferences</p>
                  <p className="text-sm text-gray-500">Defaults for shipments and display</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pagination limit</label>
                <select
                  value={settings.paginationLimit}
                  onChange={(e) => updateSettings({ paginationLimit: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PAGINATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default shipment view</label>
                <select
                  value={settings.defaultShipmentView}
                  onChange={(e) => updateSettings({ defaultShipmentView: e.target.value as 'grid' | 'tile' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {VIEW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSettings({ dateFormat: e.target.value as 'MM/DD/YYYY' | 'DD/MM/YYYY' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DATE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show exchange rate widget</p>
                  <p className="text-xs text-gray-500">Display live rates on Shipments page</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ showExchangeRate: !settings.showExchangeRate })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.showExchangeRate ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      settings.showExchangeRate ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                  user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              Notification preferences will be available in a future update.
            </p>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              Password change and 2FA options will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
