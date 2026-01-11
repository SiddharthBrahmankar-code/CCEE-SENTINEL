import { useGlobalStore } from '../store/GlobalStore';
import { TrendingUp, Clock, Target, Flame, Trophy, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const ProgressPage = () => {
  const { history, bookmarks, notesCache } = useGlobalStore();
  
  // Calculate stats
  const totalTests = history.attempts.length;
  const totalQuestions = history.attempts.reduce((sum, a) => sum + a.total, 0);
  const correctAnswers = history.attempts.reduce((sum, a) => sum + a.score, 0);
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const totalStudyTime = history.attempts.reduce((sum, a) => sum + a.timeSpent, 0);
  const notesGenerated = Object.keys(notesCache).length;
  const itemsBookmarked = bookmarks.items.length;

  // Calculate streak (simplified - consecutive days with activity)
  const currentStreak = 0; // Simplified for now
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const stats = [
    { label: 'Tests Completed', value: totalTests, icon: Trophy, color: 'text-cyber-danger' },
    { label: 'Overall Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-cyber-success' },
    { label: 'Study Time', value: formatTime(totalStudyTime), icon: Clock, color: 'text-cyber-primary' },
    { label: 'Current Streak', value: `${currentStreak} days`, icon: Flame, color: 'text-yellow-500' },
    { label: 'Notes Generated', value: notesGenerated, icon: TrendingUp, color: 'text-cyan-400' },
    { label: 'Items Bookmarked', value: itemsBookmarked, icon: Calendar, color: 'text-purple-400' },
  ];

  // Recent activity (last 5 tests)
  const recentTests = history.attempts.slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <TrendingUp size={32} className="text-cyber-success" />
          <h1 className="text-4xl font-black tracking-tighter text-white">
            STUDY <span className="text-cyber-success">PROGRESS</span>
          </h1>
        </div>
        <p className="text-cyber-muted font-mono">
          Track your learning metrics and performance trends
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-cyber-dark border border-white/10 rounded-xl p-6 hover:border-cyber-primary/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={clsx("transition-transform group-hover:scale-110", stat.color)} size={24} />
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-cyber-muted uppercase tracking-wider font-mono">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-white flex items-center gap-3">
          <Calendar size={24} className="text-cyber-primary" />
          Recent Activity
        </h2>
        
        {recentTests.length === 0 ? (
          <div className="text-center py-12 bg-cyber-dark/50 border border-white/10 rounded-xl">
            <TrendingUp size={48} className="mx-auto mb-3 text-cyber-muted opacity-20" />
            <p className="text-cyber-muted">No activity yet. Start studying to see your progress!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTests.map((test) => {
              const accuracy = Math.round((test.score / test.total) * 100);
              return (
                <div
                  key={test.id}
                  className="bg-cyber-dark border border-white/10 rounded-lg p-4 flex items-center justify-between hover:border-cyber-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl",
                      accuracy >= 80 ? "bg-cyber-success/20 text-cyber-success" :
                      accuracy >= 60 ? "bg-cyber-primary/20 text-cyber-primary" :
                      "bg-cyber-danger/20 text-cyber-danger"
                    )}>
                      {accuracy}%
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm">
                        {test.mode === 'CCEE' ? 'Full War' : 'Skirmish'} - {test.moduleId}
                      </div>
                      <div className="text-xs text-cyber-muted">
                        {new Date(test.completedAt).toLocaleDateString()} • {test.score}/{test.total} correct
                      </div>
                    </div>
                  </div>
                  <div className="text-cyber-muted text-xs font-mono">
                    {test.timeSpent > 0 && formatTime(test.timeSpent)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Motivational Message */}
      {accuracy > 0 && (
        <div className={clsx(
          "border-l-4 p-6 rounded-r-lg",
          accuracy >= 80 ? "bg-cyber-success/10 border-cyber-success" :
          accuracy >= 60 ? "bg-cyber-primary/10 border-cyber-primary" :
          "bg-yellow-500/10 border-yellow-500"
        )}>
          <div className="font-black text-lg text-white mb-2">
            {accuracy >= 80 ? "🎯 Outstanding Progress!" :
             accuracy >= 60 ? "💪 You're Doing Great!" :
             "📈 Keep Pushing Forward!"}
          </div>
          <p className="text-sm text-cyber-text">
            {accuracy >= 80 ? "You're mastering the material. Keep up the excellent work!" :
             accuracy >= 60 ? "Solid performance! A bit more practice will push you to excellence." :
             "Every question is a learning opportunity. Stay consistent!"}
          </p>
        </div>
      )}
    </div>
  );
};
