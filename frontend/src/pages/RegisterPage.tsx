import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Target, Eye, EyeOff, ShieldCheck, User as UserIcon } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3-30 characters long and contain only letters, numbers, underscores, or hyphens.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(cleanUsername, password, fullName);
      if (result.error) {
        setError(result.error.message || 'Could not complete registration. Please try another username.');
      } else {
        // Authenticated session established! Direct transition to Dashboard
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected registration error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-saffron-500 mb-3 shadow-xs">
            <Target className="w-6 h-6 text-saffron-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">
            Create Your Student Account
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Join Nexus AI to discover personalized Indian tech opportunities.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aarav Sharma"
            required
            autoComplete="name"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="e.g. aarav_sharma"
                required
                autoComplete="username"
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 font-mono"
              />
              <div className="absolute right-3 top-2.5 text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              3-30 characters: letters, numbers, underscores, or hyphens.
            </p>
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
                placeholder="Minimum 6 characters"
                required
                autoComplete="new-password"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 rounded border-slate-300 text-navy-900 focus:ring-navy-900"
              required
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-snug">
              I agree to the Nexus AI Terms of Service and Privacy Policy. I understand opportunity applications redirect to official provider portals.
            </label>
          </div>

          <Button type="submit" variant="saffron" size="md" className="w-full" isLoading={isLoading}>
            Create Account & Continue
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-navy-900 hover:text-saffron-600 transition-colors">
            Sign In with Username
          </Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
