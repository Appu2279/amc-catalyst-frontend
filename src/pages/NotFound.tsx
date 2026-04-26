import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-bold text-brand-secondary opacity-20">404</h1>
      <h2 className="text-3xl font-bold text-slate-900 mt-4">Page Not Found</h2>
      <p className="text-slate-600 mt-2 mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/">
        <Button size="lg">Go Back Home</Button>
      </Link>
    </div>
  );
};
