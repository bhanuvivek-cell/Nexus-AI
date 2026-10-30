import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Target, Eye, EyeOff, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const { error: signInError } = await signIn(cleanUsername, password);
      if (signInError) {
        setError(signInError.message || 'Invalid username or password. Please check your credentials.');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-saffron-500 mb-3 shadow-xs">
            <Target className="w-6 h-6 text-saffron-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">
            Welcome back to Nexus AI
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your student username to view opportunities & track applications.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Enter your username (e.g. aarav_sharma)"
                required
                autoComplete="username"
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoading}>
            Sign In to Account
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          New to Nexus AI?{' '}
          <Link to="/register" className="font-semibold text-navy-900 hover:text-saffron-600 transition-colors">
            Create an Account with Username
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
