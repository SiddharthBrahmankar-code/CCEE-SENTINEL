import { useState } from 'react';
import { useGlobalStore, type Bookmark } from '../store/GlobalStore';
import { Bookmark as BookmarkIcon, Search, Trash2, StickyNote, HelpCircle, Zap, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const BookmarksPage = () => {
  const { bookmarks, removeBookmark } = useGlobalStore();
  const [filter, setFilter] = useState<Bookmark['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['all']));

  const filteredBookmarks = bookmarks.items.filter(b => {
    const matchesType = filter === 'all' || b.type === filter;
    const matchesSearch = !searchQuery || 
      b.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userNote?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.moduleId?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Group bookmarks by moduleId
  const groupedBookmarks = filteredBookmarks.reduce((acc, bookmark) => {
    const moduleKey = bookmark.moduleId || 'uncategorized';
    if (!acc[moduleKey]) {
      acc[moduleKey] = [];
    }
    acc[moduleKey].push(bookmark);
    return acc;
  }, {} as Record<string, Bookmark[]>);

  // Sort each group by timestamp (newest first)
  Object.keys(groupedBookmarks).forEach(key => {
    groupedBookmarks[key].sort((a, b) => b.timestamp - a.timestamp);
  });

  // Sort module keys alphabetically but keep 'uncategorized' last
  const sortedModuleKeys = Object.keys(groupedBookmarks).sort((a, b) => {
    if (a === 'uncategorized') return 1;
    if (b === 'uncategorized') return -1;
    return a.localeCompare(b);
  });

  const toggleModule = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };

  const handleDelete = (id: string) => {
    removeBookmark(id);
    toast.success('Bookmark removed');
  };

  const getIcon = (type: Bookmark['type']) => {
    switch (type) {
      case 'question': return <HelpCircle size={16} />;
      case 'note': return <StickyNote size={16} />;
      case 'flashcard': return <Zap size={16} />;
    }
  };

  const getTypeLabel = (type: Bookmark['type']) => {
    switch (type) {
      case 'question': return 'Mock Question';
      case 'note': return 'AI Note';
      case 'flashcard': return 'Flashcard';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <BookmarkIcon size={32} className="text-cyber-primary" />
          <h1 className="text-4xl font-black tracking-tighter text-white">
            SAVED <span className="text-cyber-primary">BOOKMARKS</span>
          </h1>
        </div>
        <p className="text-cyber-muted font-mono">
          {bookmarks.items.length} items saved for review
        </p>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-10 pr-4 py-3 bg-cyber-dark border border-white/10 rounded-lg text-white placeholder:text-cyber-muted focus:border-cyber-primary outline-none transition-colors"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'question', 'note', 'flashcard'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={clsx(
                "px-4 py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all",
                filter === type
                  ? "bg-cyber-primary text-cyber-black"
                  : "bg-cyber-dark text-cyber-muted hover:text-white border border-white/10"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks List - Grouped by Module */}
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-20">
          <BookmarkIcon size={64} className="mx-auto mb-4 text-cyber-muted opacity-20" />
          <h3 className="text-xl font-bold text-white mb-2">No Bookmarks Found</h3>
          <p className="text-cyber-muted">
            {searchQuery ? 'Try a different search term' : 'Start bookmarking items to find them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedModuleKeys.map((moduleKey) => {
            const moduleBookmarks = groupedBookmarks[moduleKey];
            const isExpanded = expandedModules.has(moduleKey);
            const displayName = moduleKey === 'uncategorized' 
              ? 'Uncategorized' 
              : moduleKey.replace('dac_school_tg_', '').replace(/_/g, ' ').toUpperCase();

            // Count by type
            const typeCounts = moduleBookmarks.reduce((acc, b) => {
              acc[b.type] = (acc[b.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div key={moduleKey} className="border border-white/10 rounded-lg overflow-hidden bg-cyber-dark/30">
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(moduleKey)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-cyber-primary" />
                    ) : (
                      <ChevronRight size={20} className="text-cyber-muted group-hover:text-cyber-primary" />
                    )}
                    <h3 className="text-lg font-bold text-white font-mono">
                      {displayName}
                    </h3>
                    <span className="text-sm text-cyber-muted font-mono">
                      ({moduleBookmarks.length} {moduleBookmarks.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  {/* Type badges in header */}
                  <div className="flex items-center gap-2">
                    {typeCounts.question && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-mono">
                        {typeCounts.question} <HelpCircle size={12} className="inline" />
                      </span>
                    )}
                    {typeCounts.note && (
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono">
                        {typeCounts.note} <StickyNote size={12} className="inline" />
                      </span>
                    )}
                    {typeCounts.flashcard && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-mono">
                        {typeCounts.flashcard} <Zap size={12} className="inline" />
                      </span>
                    )}
                  </div>
                </button>

                {/* Module Bookmarks */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-3">
                        {moduleBookmarks.map((bookmark) => (
                          <motion.div
                            key={bookmark.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-cyber-dark border border-white/5 rounded-lg p-4 hover:border-cyber-primary/30 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={clsx(
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                    bookmark.type === 'question' && "bg-purple-500/20 text-purple-400",
                                    bookmark.type === 'note' && "bg-cyan-500/20 text-cyan-400",
                                    bookmark.type === 'flashcard' && "bg-yellow-500/20 text-yellow-400"
                                  )}>
                                    {getIcon(bookmark.type)}
                                    {getTypeLabel(bookmark.type)}
                                  </span>
                                </div>
                                
                                {/* Display actual question content if available */}
                                {bookmark.content?.question ? (
                                  <div className="space-y-2">
                                    <p className="text-white font-medium">{bookmark.content.question}</p>
                                    {bookmark.content.snippet && (
                                      <pre className="bg-cyber-black/50 p-2 rounded text-xs font-mono text-cyber-primary overflow-x-auto">
                                        {bookmark.content.snippet}
                                      </pre>
                                    )}
                                    {bookmark.content.options && (
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        {bookmark.content.options.map((opt, idx) => (
                                          <div 
                                            key={idx} 
                                            className={clsx(
                                              "px-3 py-2 rounded border",
                                              idx === bookmark.content?.correctAnswer
                                                ? "border-green-500/50 bg-green-500/10 text-green-400"
                                                : "border-white/10 bg-cyber-black/30 text-cyber-muted"
                                            )}
                                          >
                                            <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
                                            {opt}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {bookmark.content.explanation && (
                                      <p className="text-xs text-cyber-muted italic border-l-2 border-cyber-primary/30 pl-2">
                                        {bookmark.content.explanation}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  /* Fallback for old bookmarks without content */
                                  <div className="text-white font-mono text-sm mb-2">
                                    ID: {bookmark.referenceId}
                                  </div>
                                )}
                                
                                {bookmark.userNote && (
                                  <div className="bg-cyber-black/50 border border-white/5 rounded p-3 text-sm text-cyber-text mt-2">
                                    {bookmark.userNote}
                                  </div>
                                )}
                                
                                <div className="text-xs text-cyber-muted mt-2">
                                  Saved {new Date(bookmark.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleDelete(bookmark.id)}
                                className="p-2 text-cyber-danger hover:bg-cyber-danger/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete bookmark"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
