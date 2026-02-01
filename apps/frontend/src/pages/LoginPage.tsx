import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.graphQLErrors?.[0]?.message || err?.message || 'An error occurred. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-xl">
              <Package className="w-14 h-14 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to your TMS account
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 px-6 py-6 sm:px-14 sm:py-16">
          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start text-red-700">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-14 pr-12 py-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-10"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-14 pt-12 border-t border-gray-200">
            <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100">
                <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Demo Credentials</p>
                <div className="space-y-4 text-sm text-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-4 rounded-xl shadow-sm">
                  <span className="font-semibold text-gray-900 w-20 flex-shrink-0">Admin:</span>
                  <div className="flex flex-wrap gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs">admin@tms.com</code>
                    <code className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs">admin123</code>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-4 rounded-xl shadow-sm">
                  <span className="font-semibold text-gray-900 w-20 flex-shrink-0">Employee:</span>
                  <div className="flex flex-wrap gap-2">
                    <code className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs">employee@tms.com</code>
                    <code className="bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 font-mono text-xs">employee123</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
