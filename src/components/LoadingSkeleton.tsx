import React from 'react';

export const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
      </div>
    </div>
  );
};

export const ModalSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
      <div className="space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-md mt-4"></div>
        </div>
      </div>
    </div>
  );
};
