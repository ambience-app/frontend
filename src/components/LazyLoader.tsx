import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type LazyLoaderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function LazyLoader({ 
  children, 
  fallback = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  ) 
}: LazyLoaderProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
