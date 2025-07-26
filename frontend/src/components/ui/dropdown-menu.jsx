import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  );
};

const DropdownMenuTrigger = React.forwardRef(({ 
  children, 
  asChild, 
  open, 
  setOpen, 
  ...props 
}, ref) => {
  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild) {
    return React.cloneElement(children, { 
      ref, 
      onClick: handleClick,
      ...props 
    });
  }
  
  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

const DropdownMenuContent = ({ 
  children, 
  align = 'start', 
  className = '',
  open,
  setOpen,
  ...props 
}) => {
  if (!open) return null;

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
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === DropdownMenuItem) {
          return React.cloneElement(child, { setOpen });
        }
        return child;
      })}
    </div>
  );
};

const DropdownMenuItem = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  setOpen,
  ...props 
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      if (setOpen) {
        setOpen(false);
      }
    }
  };

  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
      onClick={handleClick}
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