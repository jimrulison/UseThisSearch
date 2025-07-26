import React from 'react';
import { useToast } from '../../hooks/use-toast';

const Toaster = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, variant, ...props }) => (
        <div
          key={id}
          className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all ${
            variant === 'destructive' 
              ? 'border-red-200 bg-red-50 text-red-900' 
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          {...props}
        >
          <div className="grid gap-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && <div className="text-sm opacity-90">{description}</div>}
          </div>
          <button
            onClick={() => dismiss(id)}
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export { Toaster };