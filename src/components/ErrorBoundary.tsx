"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * ErrorBoundary component
 *
 * A React class component that catches runtime errors in the component tree
 * below it, preventing the entire application from crashing. When an error
 * occurs, it displays a fallback UI and optionally triggers an `onError` callback.
 *
 * Features:
 * - Captures rendering, lifecycle, and constructor errors in child components
 * - Displays a customizable fallback UI when an error is caught
 * - Supports automatic reset when `resetKeys` or props change
 * - Allows external error logging via the `onError` callback
 *
 * @extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
 *
 * @prop {React.ReactNode} children - The wrapped components that the boundary monitors.
 * @prop {React.ReactNode} [fallback] - Optional fallback UI to display when an error is caught.
 * @prop {(error: Error, errorInfo: React.ErrorInfo) => void} [onError] - Optional error handler for logging/reporting.
 * @prop {Array<string | number>} [resetKeys] - Keys that trigger boundary reset when changed.
 * @prop {boolean} [resetOnPropsChange=false] - Automatically reset boundary when props change.
 *
 * @returns {JSX.Element} Renders children when no error is present or the fallback UI when an error is caught.
 */


interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys?.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged || resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Something went wrong
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We encountered an unexpected error. Please try refreshing the page or return to the home page.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs font-mono text-red-800 dark:text-red-200 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetErrorBoundary}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

