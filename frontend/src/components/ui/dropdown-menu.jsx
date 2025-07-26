import React from 'react';

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

const DropdownMenuTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});

const DropdownMenuContent = ({ 
  children, 
  align = 'start', 
  className = '',
  ...props 
}) => {
  const alignmentClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 transform -translate-x-1/2'
  };

  return (
    <div 
      className={`absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-lg ${alignmentClasses[align]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuLabel = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`px-2 py-1.5 text-sm font-semibold text-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className = '', ...props }) => {
  return (
    <div 
      className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
      {...props}
    />
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};