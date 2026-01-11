import { useState, useEffect } from 'react';
import { Calendar, Target, Clock, CheckCircle, Brain } from 'lucide-react';
import { generateStudyPlan, type StudyPlan } from '../utils/studyPlanGenerator';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useGlobalStore } from '../store/GlobalStore';

export const StudyPlanPage = () => {
  const navigate = useNavigate();
  const { studyPlan, setStudyPlan, clearStudyPlan } = useGlobalStore();
  const [plan, setPlan] = useState<StudyPlan | null>(studyPlan.currentPlan);

  // Auto-generate plan on first load if not exists
  useEffect(() => {
    if (!studyPlan.currentPlan) {
      const defaultExamDate = new Date('01/12/2026');
      const newPlan = generateStudyPlan({
        examDate: defaultExamDate,
        availableHoursPerDay: 5.5,
      });
      setPlan(newPlan);
      setStudyPlan(newPlan);
    }
  }, [studyPlan.currentPlan, setStudyPlan]);

  const handleRegenerate = () => {
    const defaultExamDate = new Date('01/12/2026');
    const newPlan = generateStudyPlan({
      examDate: defaultExamDate,
      availableHoursPerDay: 5.5,
    });
    setPlan(newPlan);
    setStudyPlan(newPlan);
    toast.success('Study plan regenerated!');
  };

  const markTaskComplete = (dayIndex: number, taskId: string) => {
    if (!plan) return;

    const updatedPlan = { ...plan };
    const task = updatedPlan.dailyGoals[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      
      // Check if all tasks for the day are complete
      const allComplete = updatedPlan.dailyGoals[dayIndex].tasks.every(t => t.completed);
      updatedPlan.dailyGoals[dayIndex].completed = allComplete;
      
      setPlan(updatedPlan);
      setStudyPlan(updatedPlan);
      toast.success(task.completed ? 'Task completed!' : 'Task marked incomplete');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Brain size={32} className="text-cyber-success" />
          <h1 className="text-4xl font-black tracking-tighter text-white">
            STUDY <span className="text-cyber-success">PLANNER</span>
          </h1>
        </div>
        <p className="text-cyber-muted font-mono">
          AI-powered personalized study schedule
        </p>
      </header>

      {plan ? (
        <div className="space-y-6">
          {/* Plan Header */}
          <div className="bg-cyber-dark border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-white">{plan.title}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 bg-cyber-success/20 text-cyber-success rounded-lg hover:bg-cyber-success/30 font-mono text-sm"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    clearStudyPlan();
                    setPlan(null);
                    toast.success('Plan cleared');
                  }}
                  className="px-4 py-2 bg-cyber-danger/20 text-cyber-danger rounded-lg hover:bg-cyber-danger/30 font-mono text-sm"
                >
                  Clear Plan
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-cyber-black/50 rounded p-3">
                <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                  <Calendar size={12} />
                  DAYS REMAINING
                </div>
                <div className="text-2xl font-black text-white">{plan.totalDays}</div>
              </div>
              <div className="bg-cyber-black/50 rounded p-3">
                <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                  <Target size={12} />
                  CURRENT DAY
                </div>
                <div className="text-2xl font-black text-cyber-primary">{plan.currentDay}</div>
              </div>
              <div className="bg-cyber-black/50 rounded p-3">
                <div className="flex items-center gap-2 text-xs text-cyber-muted mb-1">
                  <CheckCircle size={12} />
                  PROGRESS
                </div>
                <div className="text-2xl font-black text-cyber-success">
                  {Math.round((plan.dailyGoals.filter(d => d.completed).length / plan.totalDays) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Daily Goals */}
          <div className="space-y-4">
            {plan.dailyGoals.map((goal, index) => (
              <motion.div
                key={goal.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  "bg-cyber-dark border rounded-lg p-6",
                  goal.completed ? "border-cyber-success/30" : "border-white/10"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-white text-lg">Day {goal.day}</h3>
                    <p className="text-sm text-cyber-muted font-mono">
                      {new Date(goal.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cyber-muted">
                    <Clock size={16} />
                    {goal.estimatedTime} mins
                  </div>
                </div>

                <div className="space-y-2">
                  {goal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={clsx(
                        "flex items-center gap-3 p-3 rounded-lg transition-all group cursor-pointer",
                        task.completed
                          ? "bg-cyber-success/10 border border-cyber-success/30"
                          : "bg-cyber-black/50 border border-white/5 hover:border-cyber-primary/30"
                      )}
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          markTaskComplete(index, task.id);
                        }}
                        className={clsx(
                          "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer",
                          task.completed ? "border-cyber-success bg-cyber-success" : "border-white/30 hover:border-cyber-primary"
                        )}
                      >
                        {task.completed && <CheckCircle size={14} className="text-cyber-black" />}
                      </div>
                      <div 
                        onClick={() => {
                          if (task.path) {
                            navigate(task.path);
                            toast.success(`Navigating to ${task.type}...`);
                          }
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        <div className={clsx(
                          "font-medium flex items-center gap-2",
                          task.completed ? "text-white/70 line-through" : "text-white group-hover:text-cyber-primary"
                        )}>
                          {task.description}
                          {task.path && (
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="text-xs text-cyber-muted">
                          {task.type.toUpperCase()} • {task.estimatedTime} mins
                          {task.moduleData?.topics && task.moduleData.topics.length > 0 && (
                            <span> • {task.moduleData.topics.length} topics available</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-cyber-dark border border-white/10 rounded-xl p-6 text-center">
          <p className="text-cyber-muted">Generating your personalized study plan...</p>
        </div>
      )}
    </div>
  );
};
