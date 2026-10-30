import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Target, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-navy-900 flex items-center justify-center text-saffron-500 mx-auto">
          <Target className="w-8 h-8 text-saffron-500" />
        </div>
        <h1 className="text-4xl font-black text-navy-900">404</h1>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested page could not be located. Discover opportunities on the dashboard or explore listings.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="md">
              <ArrowLeft className="w-4 h-4 mr-1" /> Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
