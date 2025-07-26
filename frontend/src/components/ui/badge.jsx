import React from 'react';

const Badge = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-primary hover:bg-primary/80 text-primary-foreground bg-blue-600 text-white',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground bg-gray-100 text-gray-900',
    destructive: 'bg-destructive hover:bg-destructive/80 text-destructive-foreground bg-red-600 text-white',
    outline: 'text-foreground border border-gray-300 text-gray-900'
  };
  
  return (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };