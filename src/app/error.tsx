'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { reportError } from '@/lib/errorReporting';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const searchParams = useSearchParams();
  const is404 = searchParams.get('status') === '404';
  const errorMessage = is404 
    ? 'The page you’re looking for doesn’t exist.'
    : 'Something went wrong. Please try again later.';

  useEffect(() => {
    // Log the error to an error reporting service
    if (error) {
      reportError(error, {
        tags: {
          error_page: 'true',
          status_code: is404 ? '404' : '500',
        },
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        error_digest: error.digest,
      });
    }
  }, [error, is404]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {is404 ? 'Page Not Found' : 'Something Went Wrong'}
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {errorMessage}
          </p>

          {!is404 && (
            <div className="mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Error details:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md text-sm font-mono text-slate-800 dark:text-slate-200 break-all">
                {error.message || 'No error details available'}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!is404 && (
              <button
                onClick={() => reset()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            <Link
              href="/"
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
