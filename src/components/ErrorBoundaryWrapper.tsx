"use client";

import { ErrorBoundary } from "./ErrorBoundary";

/**
 * ErrorBoundaryWrapper component
 *
 * Wraps the entire application with the ErrorBoundary component,
 * ensuring that any errors in the component tree are caught and displayed
 * in a user-friendly way.
 *
 * @param {{ children: React.ReactNode }} props - Nested React components.
 * @returns {JSX.Element} Application wrapped in the ErrorBoundary component.
 */
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

