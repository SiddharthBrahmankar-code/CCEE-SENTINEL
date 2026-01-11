import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target, TrendingUp, Sparkles, Code, Trophy, Lightbulb } from 'lucide-react';
import { useGlobalStore } from '../store/GlobalStore';

interface TestLoadingScreenProps {
  mode: 'PRACTICE' | 'CCEE';
  module?: string;
}

const MOTIVATIONAL_TIPS = [
  { icon: Brain, text: "Take a deep breath. You've got this!", color: "text-cyan-400" },
  { icon: Target, text: "Focus on understanding, not just memorizing", color: "text-purple-400" },
  { icon: TrendingUp, text: "Every mistake is a learning opportunity", color: "text-green-400" },
  { icon: Sparkles, text: "Confidence comes from preparation", color: "text-yellow-400" },
  { icon: Trophy, text: "Success is the sum of small efforts repeated daily", color: "text-orange-400" },
  { icon: Lightbulb, text: "Read the question carefully before answering", color: "text-pink-400" },
  { icon: Code, text: "Trace code mentally before selecting output", color: "text-blue-400" },
  { icon: Zap, text: "Trust your first instinct, but verify with logic", color: "text-indigo-400" },
];

const EXAM_FACTS = [
  "CCEE tests multiple choice questions with negative marking",
  "Time management is key - don't get stuck on one question",
  "Most CCEE questions test practical application, not theory",
  "Code output questions are 40% of C++/Java exams",
  "Reading error messages carefully helps in debugging questions",
  "CCEE difficulty increases progressively through the test",
  "Practice mode helps build confidence without time pressure",
  "Reviewing incorrect answers doubles learning effectiveness",
];

const TECH_TRIVIA = [
  "C++ was originally called 'C with Classes'",
  "Java was named after the coffee JavaSoft employees drank",
  "The first computer bug was an actual moth found in 1947",
  "Linux kernel has over 27 million lines of code",
  "The '@' symbol was chosen for emails because it meant 'at'",
  "Python is named after Monty Python, not the snake",
  "Git was created by Linus Torvalds in just 10 days",
  "The first 1GB hard drive cost $40,000 in 1980",
];

export const TestLoadingScreen = ({ mode, module: _module }: TestLoadingScreenProps) => {
  // 🔥 USE REAL PROGRESS FROM STORE instead of simulation
  const { generationProgress, generationStage } = useGlobalStore(state => state.mock);
  
  // Use real progress, but ensure smooth animation with min 5%
  const progress = Math.max(generationProgress, 5);
  const stage = generationStage;
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const questionCount = mode === 'CCEE' ? 40 : 10;
  const estimatedTime = mode === 'CCEE' ? '30-60s' : '10-20s';

  // Rotate tips every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % MOTIVATIONAL_TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Rotate facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % EXAM_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentTip = MOTIVATIONAL_TIPS[currentTipIndex];
  const CurrentIcon = currentTip.icon;

  const stageMessages = {
    init: 'Initializing test environment...',
    topics: 'Loading syllabus and topics...',
    generating: `Generating ${questionCount} exam-grade questions...`,
    finalizing: 'Finalizing your test...',
    done: 'Test ready!'
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cyber-black/95 backdrop-blur-sm z-50">
      <div className="max-w-2xl w-full mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-block"
          >
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center relative ${
              mode === 'CCEE' 
                ? 'bg-gradient-to-br from-red-500/20 to-cyber-danger/20 border-2 border-cyber-danger/50' 
                : 'bg-gradient-to-br from-cyan-500/20 to-cyber-primary/20 border-2 border-cyber-primary/50'
            }`}>
              {/* Spinning ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-0 rounded-full border-4 border-transparent ${
                  mode === 'CCEE' ? 'border-t-cyber-danger' : 'border-t-cyber-primary'
                }`}
              />
              <Brain className={mode === 'CCEE' ? 'text-cyber-danger' : 'text-cyber-primary'} size={48} />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black text-white"
          >
            Crafting Your {mode === 'CCEE' ? 'Battle' : 'Training'} Simulation
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-cyber-muted font-mono text-sm"
          >
            {stageMessages[stage]}
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-mono text-cyber-muted">
            <span>Progress</span>
            <span className="text-white font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-3 bg-cyber-dark rounded-full overflow-hidden border border-white/10">
            <motion.div
              className={`h-full relative overflow-hidden ${
                mode === 'CCEE'
                  ? 'bg-gradient-to-r from-red-500 via-cyber-danger to-pink-500'
                  : 'bg-gradient-to-r from-cyan-500 via-cyber-primary to-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Animated shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          </div>

          {/* Stage indicators */}
          <div className="flex justify-between text-xs font-mono">
            {['init', 'topics', 'generating', 'finalizing'].map((s, idx) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-all ${
                  stage === s 
                    ? mode === 'CCEE' ? 'bg-cyber-danger scale-125 animate-pulse' : 'bg-cyber-primary scale-125 animate-pulse'
                    : ['init', 'topics', 'generating'].indexOf(stage) > idx || stage === 'finalizing'
                      ? mode === 'CCEE' ? 'bg-cyber-danger/50' : 'bg-cyber-primary/50'
                      : 'bg-white/20'
                }`} />
                <span className={stage === s ? 'text-white' : 'text-cyber-muted'}>
                  {s === 'init' ? 'Init' : s === 'topics' ? 'Topics' : s === 'generating' ? 'Gen' : 'Done'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`bg-cyber-dark/50 border rounded-lg p-4 text-center ${
            mode === 'CCEE' ? 'border-cyber-danger/30' : 'border-cyber-primary/30'
          }`}>
            <div className="text-2xl font-black text-white">{questionCount}</div>
            <div className="text-xs text-cyber-muted mt-1">Questions</div>
          </div>
          <div className={`bg-cyber-dark/50 border rounded-lg p-4 text-center ${
            mode === 'CCEE' ? 'border-cyber-danger/30' : 'border-cyber-primary/30'
          }`}>
            <div className="text-2xl font-black text-white">{estimatedTime}</div>
            <div className="text-xs text-cyber-muted mt-1">Est. Time</div>
          </div>
          <div className={`bg-cyber-dark/50 border rounded-lg p-4 text-center ${
            mode === 'CCEE' ? 'border-cyber-danger/30' : 'border-cyber-primary/30'
          }`}>
            <div className="text-2xl font-black text-white">{mode}</div>
            <div className="text-xs text-cyber-muted mt-1">Mode</div>
          </div>
        </div>

        {/* Rotating Motivational Tip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTipIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-cyber-dark/50 to-cyber-panel/30 border border-white/10 rounded-lg p-6 text-center"
          >
            <div className="flex items-center justify-center gap-3">
              <CurrentIcon className={`${currentTip.color} animate-pulse`} size={24} />
              <p className="text-lg text-white font-medium">{currentTip.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Rotating Fact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-cyber-muted uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Did you know?</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentFactIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-sm text-cyber-text bg-cyber-black/50 border border-white/5 rounded-lg p-3"
            >
              💡 {stage === 'generating' ? TECH_TRIVIA[currentFactIndex % TECH_TRIVIA.length] : EXAM_FACTS[currentFactIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${
                mode === 'CCEE' ? 'bg-cyber-danger/30' : 'bg-cyber-primary/30'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
