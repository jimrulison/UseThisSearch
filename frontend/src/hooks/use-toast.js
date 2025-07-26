import React from 'react';

const ToastContext = React.createContext();

let toastCount = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const toast = React.useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = ++toastCount;
    const newToast = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const dismiss = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};