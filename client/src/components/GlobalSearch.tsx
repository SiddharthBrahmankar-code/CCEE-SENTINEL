import { useState, useEffect } from 'react';
import { useGlobalStore } from '../store/GlobalStore';
import { Search, X, FileText, HelpCircle, Zap, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import Fuse from 'fuse.js';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SearchResult {
  type: 'module' | 'topic' | 'bookmark' | 'page';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { bookmarks, history } = useGlobalStore();

  // Build searchable items
  const searchableItems: SearchResult[] = [
    // Pages
    { type: 'page', title: 'AI Notes', path: '/notes', icon: FileText },
    { type: 'page', title: 'Mock Tests', path: '/mock', icon: HelpCircle },
    { type: 'page', title: 'Test History', path: '/mock/history', icon: BookOpen },
    { type: 'page', title: 'Flashcards', path: '/flashcards', icon: Zap },
    { type: 'page', title: 'Bookmarks', path: '/bookmarks', icon: BookOpen },
    { type: 'page', title: 'Progress Dashboard', path: '/progress', icon: FileText },
    { type: 'page', title: 'Syllabus Radar', path: '/syllabus', icon: FileText },
    { type: 'page', title: 'Analytics Heatmap', path: '/analytics', icon: FileText },
    { type: 'page', title: 'PYQ Analysis', path: '/pyq', icon: FileText },
    
    // Bookmarks
    ...bookmarks.items.map(b => ({
      type: 'bookmark' as const,
      title: `Bookmarked ${b.type}`,
      subtitle: b.referenceId,
      path: '/bookmarks',
      icon: BookOpen,
    })),
    
    // Recent tests
    ...history.attempts.slice(0, 5).map(a => ({
      type: 'module' as const,
      title: `${a.mode} Test - ${a.moduleId}`,
      subtitle: `${a.score}/${a.total} (${Math.round((a.score/a.total)*100)}%)`,
      path: '/mock/history',
      icon: HelpCircle,
    })),
  ];

  const fuse = new Fuse(searchableItems, {
    keys: ['title', 'subtitle'],
    threshold: 0.3,
  });

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      const fuseResults = fuse.search(query);
      setResults(fuseResults.map(r => r.item).slice(0, 8));
      setSelectedIndex(0);
    } else {
      setResults(searchableItems.slice(0, 8));
    }
  }, [query]);

  // Open with Ctrl+K
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
    setQuery('');
  }, { enableOnFormTags: true });

  // Close with Escape
  useHotkeys('escape', () => setIsOpen(false), { enabled: isOpen });

  // Navigate with arrows
  useHotkeys('arrowdown', (e) => {
    e.preventDefault();
    setSelectedIndex(i => Math.min(i + 1, results.length - 1));
  }, { enabled: isOpen, enableOnFormTags: true });

  useHotkeys('arrowup', (e) => {
    e.preventDefault();
    setSelectedIndex(i => Math.max(i - 1, 0));
  }, { enabled: isOpen, enableOnFormTags: true });

  // Select with Enter
  useHotkeys('enter', (e) => {
    e.preventDefault();
    if (results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      setIsOpen(false);
    }
  }, { enabled: isOpen, enableOnFormTags: true });

  // Open bookmarks with Ctrl+B
  useHotkeys('ctrl+b, cmd+b', (e) => {
    e.preventDefault();
    navigate('/bookmarks');
  });

  // Open history with Ctrl+H
  useHotkeys('ctrl+h, cmd+h', (e) => {
    e.preventDefault();
    navigate('/mock/history');
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Search Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-cyber-dark border-2 border-cyber-primary/30 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <Search size={20} className="text-cyber-primary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, bookmarks, tests..."
              autoFocus
              className="flex-1 bg-transparent text-white placeholder:text-cyber-muted outline-none text-lg"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X size={18} className="text-cyber-muted" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-8 text-center text-cyber-muted">
                No results found
              </div>
            ) : (
              results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.path}-${index}`}
                    onClick={() => {
                      navigate(result.path);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={clsx(
                      "w-full flex items-center gap-4 p-4 border-b border-white/5 transition-colors text-left",
                      selectedIndex === index
                        ? "bg-cyber-primary/20 border-l-4 border-l-cyber-primary"
                        : "hover:bg-white/5"
                    )}
                  >
                    <div className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedIndex === index ? "bg-cyber-primary/30" : "bg-white/5"
                    )}>
                      <Icon size={20} className="text-cyber-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {result.title}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-cyber-muted truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-cyber-muted uppercase font-mono">
                      {result.type}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 bg-cyber-black/50 border-t border-white/10 text-xs text-cyber-muted font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">Enter</kbd> Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> Close
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
