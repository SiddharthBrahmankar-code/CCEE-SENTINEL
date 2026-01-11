import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { useChatContextStore } from '../store/chatContextStore';

const shortcuts = [
  {
    category: 'Global',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open search' },
      { keys: ['Ctrl', 'B'], description: 'Go to bookmarks' },
      { keys: ['Ctrl', 'H'], description: 'Go to test history' },
      { keys: ['Esc'], description: 'Close modal/dialog' },
    ],
  },
  {
    category: 'Mock Tests',
    items: [
      { keys: ['1', '2', '3', '4'], description: 'Select option A/B/C/D' },
      { keys: ['N'], description: 'Next question' },
      { keys: ['P'], description: 'Previous question' },
      { keys: ['Q'], description: 'Quit test' },
    ],
  },
  {
    category: 'Flashcards',
    items: [
      { keys: ['Space'], description: 'Flip card' },
      { keys: ['→'], description: 'Next card (correct)' },
      { keys: ['←'], description: 'Previous card' },
    ],
  },
];

export const ShortcutHints = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isChatOpen } = useChatContextStore();

  // Show hints with ?
  useHotkeys('shift+/', () => setIsOpen(true));
  useHotkeys('escape', () => setIsOpen(false), { enabled: isOpen });

  if (isChatOpen) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-24 w-12 h-12 bg-cyber-primary text-cyber-black rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center z-[9999]"
        title="Keyboard shortcuts (Shift + ?)"
      >
        <Keyboard size={20} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-cyber-dark border-2 border-cyber-primary/30 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Keyboard size={24} className="text-cyber-primary" />
                  <h2 className="text-2xl font-black text-white">
                    KEYBOARD <span className="text-cyber-primary">SHORTCUTS</span>
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={20} className="text-cyber-muted" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {shortcuts.map((section) => (
                  <div key={section.category}>
                    <h3 className="text-sm font-mono text-cyber-primary uppercase tracking-wider mb-3">
                      {section.category}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-cyber-black/50 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-cyber-text">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-3 py-1.5 bg-cyber-dark border border-white/20 rounded text-xs font-mono text-white"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-cyber-black/50 border-t border-white/10 text-center">
                <p className="text-xs text-cyber-muted font-mono">
                  Press <kbd className="px-2 py-1 bg-white/10 rounded mx-1">Shift</kbd> +{' '}
                  <kbd className="px-2 py-1 bg-white/10 rounded mx-1">?</kbd> to toggle this menu
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
