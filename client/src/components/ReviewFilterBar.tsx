import clsx from 'clsx';
import { CheckCircle, XCircle, Bookmark, LayoutGrid, MinusCircle } from 'lucide-react';

export type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'bookmarked' | 'unattempted';

interface ReviewFilterBarProps {
  total: number;
  correct: number;
  incorrect: number;
  bookmarked: number;
  unattempted: number;
  activeFilter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
}

export const ReviewFilterBar = ({
  total,
  correct,
  incorrect,
  bookmarked,
  unattempted,
  activeFilter,
  onFilterChange
}: ReviewFilterBarProps) => {
  const filters: { id: ReviewFilter; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    { 
      id: 'all', 
      label: 'All', 
      count: total, 
      icon: <LayoutGrid size={14} />,
      color: 'cyber-primary'
    },
    { 
      id: 'correct', 
      label: 'Correct', 
      count: correct, 
      icon: <CheckCircle size={14} />,
      color: 'emerald-400'
    },
    { 
      id: 'incorrect', 
      label: 'Incorrect', 
      count: incorrect, 
      icon: <XCircle size={14} />,
      color: 'red-400'
    },
    { 
      id: 'unattempted', 
      label: 'Not Attempted', 
      count: unattempted, 
      icon: <MinusCircle size={14} />,
      color: 'gray-400'
    },
    { 
      id: 'bookmarked', 
      label: 'Saved', 
      count: bookmarked, 
      icon: <Bookmark size={14} />,
      color: 'amber-400'
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-cyber-dark/60 rounded-xl border border-white/10">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeFilter === filter.id
              ? `bg-${filter.color}/20 text-${filter.color} border border-${filter.color}/50`
              : 'bg-white/5 text-cyber-muted hover:bg-white/10 border border-transparent'
          )}
          style={activeFilter === filter.id ? {
            backgroundColor: filter.id === 'all' ? 'rgba(0, 255, 255, 0.1)' :
                            filter.id === 'correct' ? 'rgba(16, 185, 129, 0.15)' :
                            filter.id === 'incorrect' ? 'rgba(239, 68, 68, 0.15)' :
                            filter.id === 'unattempted' ? 'rgba(156, 163, 175, 0.15)' :
                            'rgba(245, 158, 11, 0.15)',
            color: filter.id === 'all' ? '#00FFFF' :
                   filter.id === 'correct' ? '#34D399' :
                   filter.id === 'incorrect' ? '#F87171' :
                   filter.id === 'unattempted' ? '#9CA3AF' :
                   '#FBBF24',
            borderColor: filter.id === 'all' ? 'rgba(0, 255, 255, 0.3)' :
                         filter.id === 'correct' ? 'rgba(16, 185, 129, 0.3)' :
                         filter.id === 'incorrect' ? 'rgba(239, 68, 68, 0.3)' :
                         filter.id === 'unattempted' ? 'rgba(156, 163, 175, 0.3)' :
                         'rgba(245, 158, 11, 0.3)'
          } : {}}
        >
          {filter.icon}
          <span>{filter.label}</span>
          <span className={clsx(
            'px-2 py-0.5 rounded-full text-xs font-bold',
            activeFilter === filter.id ? 'bg-black/20' : 'bg-white/10'
          )}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
};
