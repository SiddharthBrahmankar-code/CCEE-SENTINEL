import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [theme]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="fixed top-3 right-4 z-[9999] p-3 bg-cyber-dark border border-white/20 rounded-lg hover:border-cyber-primary/50 transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-cyber-primary" />
      )}
    </motion.button>
  );
};
