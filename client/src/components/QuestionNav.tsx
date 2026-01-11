import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Flag, CheckCircle, Circle, CircleDot } from 'lucide-react';
import type { Question } from '../store/GlobalStore';

interface QuestionNavProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, number>;
  markedForReview: Record<number, boolean>;
  onNavigate: (index: number) => void;
  disabled?: boolean;
  mode?: 'exam' | 'review';
}

export const QuestionNav = ({
  questions,
  currentIndex,
  answers,
  markedForReview,
  onNavigate,
  disabled = false,
  mode = 'exam'
}: QuestionNavProps) => {
  const getQuestionStatus = (index: number) => {
    const isAnswered = answers[index] !== undefined;
    const isMarked = markedForReview[index];
    
    if (isMarked && isAnswered) return 'marked-answered';
    if (isMarked) return 'marked';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  // Calculate stats
  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const remainingCount = questions.length - answeredCount;

  return (
    <div className="bg-cyber-dark/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl w-full">
      {/* Header with inline stats */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyber-primary/10 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono uppercase tracking-widest text-white/80 flex items-center gap-2">
            <CircleDot size={14} className="text-cyber-primary" />
            {mode === 'exam' ? 'Navigator' : 'Review'}
          </h3>
          {/* Compact inline stats */}
          <div className="flex items-center gap-4 text-sm font-mono">
            <span className="text-emerald-400 font-bold">{answeredCount}✓</span>
            <span className="text-amber-400 font-bold">{markedCount}⚑</span>
            <span className="text-white/50">{remainingCount}○</span>
          </div>
        </div>
      </div>

      {/* Question Grid - Large buttons with generous spacing */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-2">
          {questions.map((_, index) => {
            const status = getQuestionStatus(index);
            const isCurrent = index === currentIndex;
            
            return (
              <motion.button
                key={index}
                whileHover={{ scale: disabled ? 1 : 1.05 }}
                whileTap={{ scale: disabled ? 1 : 0.95 }}
                onClick={() => !disabled && onNavigate(index)}
                disabled={disabled}
                className={clsx(
                  'relative w-14 h-14 rounded-xl text-lg font-semibold transition-all duration-150',
                  'flex items-center justify-center',
                  disabled ? 'cursor-default' : 'cursor-pointer',
                  // Status styles
                  status === 'answered' && !isCurrent && 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25',
                  status === 'marked' && !isCurrent && 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25',
                  status === 'marked-answered' && !isCurrent && 'bg-purple-500/15 text-purple-400 border border-purple-500/30 hover:bg-purple-500/25',
                  status === 'unanswered' && !isCurrent && 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70',
                  // Current question - prominent highlight
                  isCurrent && 'bg-cyber-primary text-cyber-black border-2 border-cyber-primary shadow-lg shadow-cyber-primary/40 font-bold'
                )}
              >
                {index + 1}
                {/* Small status indicators */}
                {status === 'marked' && !isCurrent && (
                  <Flag size={11} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400" />
                )}
                {status === 'answered' && !isCurrent && (
                  <CheckCircle size={11} className="absolute -top-1 -right-1 text-emerald-400" />
                )}
                {status === 'marked-answered' && !isCurrent && (
                  <Flag size={10} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Clean Legend */}
      <div className="px-6 pb-5 border-t border-white/5 pt-4">
        <div className="flex items-center justify-around text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Circle size={10} className="fill-emerald-500 text-emerald-500" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <Flag size={10} className="fill-amber-500 text-amber-500" />
            <span>Flag</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle size={10} className="text-white/30" />
            <span>Skip</span>
          </div>
        </div>
      </div>
    </div>
  );
};
