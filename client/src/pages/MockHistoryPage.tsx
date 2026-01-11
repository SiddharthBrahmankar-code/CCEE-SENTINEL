import { useGlobalStore } from '../store/GlobalStore';
import { History, Trophy, Clock, Target, Calendar } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { exportMockResultAsPDF } from '../utils/pdfExport';
import { exportMockResultsAsCSV } from '../utils/csvExport';
import { Download } from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export const MockHistoryPage = () => {
  const { getMockHistory } = useGlobalStore();
  const [filterMode, setFilterMode] = useState<'all' | 'PRACTICE' | 'CCEE'>('all');
  
  const attempts = getMockHistory().filter(a => 
    filterMode === 'all' || a.mode === filterMode
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return { label: 'EXCELLENT', color: 'text-cyber-success' };
    if (percentage >= 60) return { label: 'GOOD', color: 'text-cyber-primary' };
    if (percentage >= 40) return { label: 'AVERAGE', color: 'text-yellow-500' };
    return { label: 'NEEDS WORK', color: 'text-cyber-danger' };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <History size={32} className="text-cyber-danger" />
          <h1 className="text-4xl font-black tracking-tighter text-white">
            TEST <span className="text-cyber-danger">HISTORY</span>
          </h1>
        </div>
        <p className="text-cyber-muted font-mono">
          {attempts.length} completed missions on record
        </p>
      </header>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'PRACTICE', 'CCEE'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={clsx(
              "px-4 py-2 rounded-lg font-mono text-sm uppercase tracking-wider transition-all",
              filterMode === mode
                ? "bg-cyber-danger text-white"
                : "bg-cyber-dark text-cyber-muted hover:text-white border border-white/10"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Export All CSV Button */}
      {attempts.length > 0 && (
        <button
          onClick={() => {
            exportMockResultsAsCSV(attempts);
            toast.success('All results exported as CSV!');
          }}
          className="px-4 py-2 bg-cyber-success/20 text-cyber-success hover:bg-cyber-success/30 rounded-lg font-mono text-sm uppercase tracking-wider transition-all flex items-center gap-2"
        >
          <FileSpreadsheet size={16} />
          Export All as CSV
        </button>
      )}

      {/* History List */}
      {attempts.length === 0 ? (

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-cyber-dark/30 border border-white/5 rounded-2xl"
        >
          <History size={64} className="mx-auto mb-4 text-cyber-muted opacity-20" />
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Log Empty</h3>
          <p className="text-cyber-muted max-w-md mx-auto mb-8">
            No mock skirmishes have been recorded. Deploy into the battlefield to build your tactical profile.
          </p>
          <a href="/mock" className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-primary text-cyber-black font-bold rounded-lg hover:shadow-neon-blue hover:scale-105 transition-all">
            <Target size={18} />
            INITIATE FIRST SKIRMISH
          </a>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {attempts.map((attempt) => {
            const grade = getGrade(attempt.score, attempt.total);
            const accuracy = Math.round((attempt.score / attempt.total) * 100);
            
            return (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "bg-cyber-dark border rounded-lg p-6 hover:border-cyber-danger/30 transition-all",
                  attempt.mode === 'CCEE' ? 'border-cyber-danger/20' : 'border-cyber-primary/20'
                )}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        attempt.mode === 'CCEE' 
                          ? "bg-cyber-danger/20 text-cyber-danger"
                          : "bg-cyber-primary/20 text-cyber-primary"
                      )}>
                        {attempt.mode === 'CCEE' ? 'FULL WAR' : 'SKIRMISH'}
                      </span>
                      <span className="text-sm text-cyber-muted font-mono">
                        {attempt.moduleId}
                      </span>
                      <span className="text-xs text-cyber-muted flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDistanceToNow(attempt.completedAt, { addSuffix: true })}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-cyber-black/50 rounded p-3">
                        <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                          <Trophy size={12} />
                          SCORE
                        </div>
                        <div className="text-2xl font-black text-white">
                          {attempt.score}<span className="text-sm text-cyber-muted">/{attempt.total}</span>
                        </div>
                      </div>
                      
                      <div className="bg-cyber-black/50 rounded p-3">
                        <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                          <Target size={12} />
                          ACCURACY
                        </div>
                        <div className={clsx("text-2xl font-black", grade.color)}>
                          {accuracy}%
                        </div>
                      </div>

                      {attempt.timeSpent > 0 && (
                        <div className="bg-cyber-black/50 rounded p-3">
                          <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                            <Clock size={12} />
                            TIME
                          </div>
                          <div className="text-lg font-black text-white">
                            {formatTime(attempt.timeSpent)}
                          </div>
                        </div>
                      )}

                      <div className="bg-cyber-black/50 rounded p-3">
                        <div className="text-xs text-cyber-muted mb-1">
                          GRADE
                        </div>
                        <div className={clsx("text-sm font-black", grade.color)}>
                          {grade.label}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-cyber-muted">Questions Answered</span>
                        <span className="text-white font-mono">{Object.keys(attempt.answers).length}/{attempt.total}</span>
                      </div>
                      <div className="h-2 bg-cyber-black rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyber-primary to-cyber-success transition-all"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      exportMockResultAsPDF({
                        module: attempt.moduleId,
                        mode: attempt.mode,
                        score: attempt.score,
                        total: attempt.total,
                        accuracy,
                        timeSpent: attempt.timeSpent > 0 ? formatTime(attempt.timeSpent) : undefined,
                        date: new Date(attempt.completedAt).toLocaleDateString(),
                      });
                      toast.success('Test report exported!');
                    }}
                    className="p-3 bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/30 rounded transition-all"
                    title="Export as PDF"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
