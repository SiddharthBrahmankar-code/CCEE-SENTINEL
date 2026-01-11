import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-hide offline message after 5 seconds
    if (!isOnline) {
      const timer = setTimeout(() => setShowOffline(false), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && showOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-cyber-danger rounded-lg shadow-lg flex items-center gap-3"
        >
          <WifiOff size={20} className="text-white" />
          <span className="text-white font-mono text-sm">
            You are offline. Some features may not work.
          </span>
        </motion.div>
      )}
      
      {/* Small indicator in corner */}
      <div className="fixed bottom-6 left-6 z-[9999]">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-cyber-success' : 'bg-cyber-danger'} animate-pulse`} title={isOnline ? 'Online' : 'Offline'} />
      </div>
    </AnimatePresence>
  );
};
