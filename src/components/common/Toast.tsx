import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', isVisible, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const bgColor = type === 'success'
    ? 'bg-green-500'
    : type === 'error'
    ? 'bg-red-500'
    : 'bg-gray-800 dark:bg-gray-200';

  const textColor = type === 'info' ? 'text-white dark:text-gray-900' : 'text-white';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fadeIn">
      <div className={`${bgColor} ${textColor} px-5 py-2.5 rounded-full text-sm font-medium shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
