import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center text-saffron-500 mb-3 shadow-xs">
          <Target className="w-6 h-6 text-saffron-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-navy-900">
          Username Authentication
        </h2>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Direct Username & Password Access</span>
          </div>
          <p>
            Nexus AI uses email-free username authentication. Email-based password recovery is disabled.
          </p>
          <p>
            Please sign in directly with your chosen username and password, or register a new student account.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link to="/login">
            <Button variant="primary" size="md" className="w-full">
              Go to Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="md" className="w-full">
              Create New Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
