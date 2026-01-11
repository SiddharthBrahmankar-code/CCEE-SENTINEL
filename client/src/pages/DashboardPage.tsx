import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Database, AlertTriangle, Zap, Activity, BarChart3, Award, Flame } from 'lucide-react';
import { storageService } from '../services/storageService';
import { useGlobalStore } from '../store/GlobalStore';

export const DashboardPage = () => {
    // Use Global Store for reactive updates
    const { history, addMockAttempt } = useGlobalStore();
    const mockData = history.attempts;
    
    // Migration: One-time sync from legacy storage if history is empty
    useEffect(() => {
        if (mockData.length === 0) {
            const legacy = storageService.getMockResults();
            if (legacy.length > 0) {
                console.log(`🔄 Migrating ${legacy.length} legacy mock results to GlobalStore...`);
                legacy.forEach(l => {
                    addMockAttempt({
                         moduleId: l.moduleId || 'unknown',
                         mode: 'PRACTICE',
                         questions: [], // Legacy data didn't store questions
                         answers: {},
                         score: l.score,
                         total: l.total,
                         timeSpent: 0,
                         completedAt: new Date(l.date).getTime() || Date.now()
                    });
                });
            }
        }
    }, [addMockAttempt, mockData.length]);
    
    // Flashcard stats still rely on storage service (legacy)
    const [flashcardData, setFlashcardData] = useState<any>(null);

    useEffect(() => {
        setFlashcardData(storageService.getFlashcardStats());
    }, []);

    const integrity = mockData.length > 0 
        ? Math.round(mockData.reduce((acc, curr) => acc + ((curr.total > 0 ? curr.score / curr.total : 0) * 100), 0) / mockData.length)
        : 0;
    
    // Safety check for NaN
    const safeIntegrity = isNaN(integrity) ? 0 : integrity;

    const flashcardAccuracy = flashcardData && flashcardData.totalCards > 0
        ? Math.round((flashcardData.correct / flashcardData.totalCards) * 100)
        : 0;

    // Format mock data for charts
    const chartData = mockData.map((item, index) => ({
        name: `Test ${index + 1}`,
        score: Math.round((item.total > 0 ? item.score / item.total : 0) * 100),
    }));

    const hasData = mockData.length > 0 || (flashcardData && flashcardData.totalCards > 0);

    const getIntegrityLevel = (value: number) => {
        if (value >= 80) return { label: 'OPTIMAL', color: 'text-emerald-400', bg: 'from-emerald-500 to-green-400', glow: 'shadow-emerald-500/30' };
        if (value >= 60) return { label: 'STABLE', color: 'text-cyber-primary', bg: 'from-cyber-primary to-cyan-400', glow: 'shadow-cyber-primary/30' };
        if (value >= 40) return { label: 'MODERATE', color: 'text-yellow-400', bg: 'from-yellow-500 to-amber-400', glow: 'shadow-yellow-500/30' };
        return { label: 'CRITICAL', color: 'text-cyber-danger', bg: 'from-cyber-danger to-red-400', glow: 'shadow-cyber-danger/30' };
    };

    const integrityStatus = getIntegrityLevel(safeIntegrity);
    
    // Calculate streak/rank based on performance
    const performanceRank = safeIntegrity >= 90 ? 'S' : safeIntegrity >= 75 ? 'A' : safeIntegrity >= 60 ? 'B' : safeIntegrity >= 40 ? 'C' : 'D';

    return (
        <div className="min-h-[calc(100vh-80px)] p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header with animated gradient */}
            <header className="relative mb-10 pb-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-primary/5 via-transparent to-cyber-danger/5 blur-3xl" />
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-3 flex items-center gap-4">
                       <Shield 
                           className="text-cyber-primary" 
                           size={52} 
                           style={{ filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.6))' }} 
                       />
                       <span>SENTINEL <span className="text-cyber-primary text-glow-cyan">READINESS</span></span>
                    </h1>
                    <p className="text-cyber-muted font-mono tracking-[0.25em] uppercase text-sm">
                        Operative Status Report • Performance Analytics
                    </p>
                </motion.div>
            </header>

            {/* No Data State */}
            {!hasData && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-dashed border-white/20 rounded-2xl p-16 text-center relative overflow-hidden flex flex-col items-center justify-center max-w-3xl mx-auto"
                >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0)_25%,rgba(0,240,255,0.02)_50%,rgba(0,0,0,0)_75%)] bg-[length:400%_400%] animate-scan" />
                    
                    <div className="relative z-10 p-6 bg-cyber-black/50 rounded-full border border-cyber-primary/20 mb-8">
                        <Shield className="text-cyber-muted animate-pulse" size={64} />
                        <div className="absolute -bottom-2 -right-2 bg-yellow-500/20 p-2 rounded-full border border-yellow-500/50">
                            <AlertTriangle size={24} className="text-yellow-500" />
                        </div>
                    </div>

                    <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">System Standby</h3>
                    <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-xs font-mono mb-6 border border-yellow-500/20">
                        ⚠️ INSUFFICIENT TACTICAL DATA
                    </div>
                    
                    <p className="text-cyber-muted max-w-lg mx-auto mb-10 leading-relaxed font-mono text-sm">
                        Sentinel core cannot generate analytics without operative performance logs. 
                        Engage in <span className="text-cyber-primary">Mock Skirmishes</span> or <span className="text-cyber-primary">Flash Blitz</span> drills to populate the integrity matrix.
                    </p>

                    <div className="flex gap-4 justify-center flex-wrap">
                        <a href="/mock" className="px-6 py-3 bg-gradient-to-r from-cyber-primary to-cyan-400 text-cyber-black font-bold rounded-xl hover:shadow-neon-blue hover:scale-105 transition-all flex items-center gap-2">
                            <Target size={18} /> INITIATE MOCK
                        </a>
                        <a href="/flashcards" className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all flex items-center gap-2">
                            <Zap size={18} /> FLASH BLITZ
                        </a>
                    </div>
                </motion.div>
            )}

            {/* Stats Cards */}
            {hasData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                        {/* Mock Integrity Score - Large Card */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`md:col-span-2 bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-cyber-primary/30 rounded-2xl p-8 relative overflow-hidden group hover:border-cyber-primary/50 transition-all`}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-primary/10 rounded-full blur-3xl group-hover:bg-cyber-primary/15 transition-colors" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl" />
                            
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <div className="text-7xl md:text-8xl font-black text-white mb-2 text-glow-cyan">{safeIntegrity}%</div>
                                    <div className="text-cyber-primary font-mono tracking-widest text-sm mb-2">AVERAGE MOCK INTEGRITY</div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 ${integrityStatus.color} text-xs font-mono`}>
                                        <Flame size={12} /> STATUS: {integrityStatus.label}
                                    </div>
                                </div>
                                
                                {/* Performance Rank Badge */}
                                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${integrityStatus.bg} flex items-center justify-center shadow-lg ${integrityStatus.glow}`}>
                                    <span className="text-4xl font-black text-white">{performanceRank}</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Flashcard Stats */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/50 transition-all"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
                            <Zap className="text-yellow-500 mb-3" size={28} style={{ filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))' }} />
                            <div className="text-4xl font-black text-white mb-1">{flashcardAccuracy}%</div>
                            <div className="text-yellow-500 font-mono tracking-widest text-xs mb-2">FLASHCARD REFLEX</div>
                            <div className="text-xs text-cyber-muted font-mono">
                                {flashcardData?.totalCards || 0} cards reviewed
                            </div>
                        </motion.div>

                        {/* Total Drills */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                            <Award className="text-cyber-muted mb-3" size={28} />
                            <div className="text-4xl font-black text-white mb-1">{mockData.length}</div>
                            <div className="text-cyber-muted font-mono tracking-widest text-xs mb-2">DRILLS COMPLETED</div>
                            <div className="text-xs text-cyber-muted font-mono flex items-center gap-1">
                                <Activity size={10} /> Training Sessions
                            </div>
                        </motion.div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Performance Chart - CSS Based Bar Chart */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-3 bg-gradient-to-br from-cyber-dark/80 to-cyber-panel/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
                        >
                            <h3 className="text-white font-mono mb-6 flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-cyber-primary/10">
                                    <BarChart3 size={18} className="text-cyber-primary" />
                                </div>
                                PERFORMANCE TRAJECTORY
                            </h3>
                            
                            {chartData.length > 0 ? (
                                <div className="space-y-3">
                                    {chartData.slice(-8).map((item, index) => {
                                        const barColor = item.score >= 80 ? 'from-cyber-primary to-cyan-400' :
                                                        item.score >= 60 ? 'from-emerald-500 to-green-400' :
                                                        item.score >= 40 ? 'from-yellow-500 to-amber-400' :
                                                        'from-cyber-danger to-red-400';
                                        const glowColor = item.score >= 80 ? 'rgba(0, 240, 255, 0.4)' :
                                                         item.score >= 60 ? 'rgba(16, 185, 129, 0.3)' :
                                                         item.score >= 40 ? 'rgba(234, 179, 8, 0.3)' :
                                                         'rgba(255, 0, 60, 0.3)';
                                        return (
                                            <div key={index} className="flex items-center gap-4 group">
                                                <span className="text-xs font-mono text-cyber-muted w-16 shrink-0">
                                                    {item.name}
                                                </span>
                                                <div className="flex-1 h-10 bg-cyber-black/60 rounded-xl overflow-hidden relative border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.score}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                                                        className={`h-full rounded-xl bg-gradient-to-r ${barColor} relative`}
                                                        style={{ boxShadow: `0 0 20px ${glowColor}` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                    </motion.div>
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white font-mono">
                                                        {item.score}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center text-cyber-muted font-mono text-sm">
                                    No mock test data available
                                </div>
                            )}
                        </motion.div>

                        {/* System Integrity Gauge - CSS Based */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="lg:col-span-2 bg-gradient-to-br from-cyber-dark/80 to-cyber-panel/50 border border-white/10 rounded-2xl p-6 flex flex-col backdrop-blur-sm"
                        >
                            <h3 className="text-white font-mono mb-6 flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-cyber-primary/10">
                                    <Database size={18} className="text-cyber-primary" />
                                </div>
                                SYSTEM INTEGRITY
                            </h3>
                            
                            <div className="flex-1 flex items-center justify-center">
                                {/* Circular Progress */}
                                <div className="relative w-52 h-52">
                                    <svg className="w-full h-full transform -rotate-90">
                                        {/* Outer track */}
                                        <circle 
                                            cx="104" cy="104" r="90" 
                                            stroke="currentColor" 
                                            strokeWidth="8" 
                                            fill="none"
                                            className="text-white/5"
                                        />
                                        {/* Inner track */}
                                        <circle 
                                            cx="104" cy="104" r="75" 
                                            stroke="currentColor" 
                                            strokeWidth="6" 
                                            fill="none"
                                            className="text-white/5"
                                        />
                                        {/* Outer progress (Integrity) */}
                                        <motion.circle 
                                            cx="104" cy="104" r="90" 
                                            stroke="url(#gradientCyan)" 
                                            strokeWidth="8" 
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${safeIntegrity * 5.65} 565`}
                                            initial={{ strokeDasharray: '0 565' }}
                                            animate={{ strokeDasharray: `${safeIntegrity * 5.65} 565` }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                            style={{ filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))' }}
                                        />
                                        {/* Inner progress (Vulnerability) */}
                                        <motion.circle 
                                            cx="104" cy="104" r="75" 
                                            stroke="url(#gradientRed)" 
                                            strokeWidth="6" 
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(100 - safeIntegrity) * 4.71} 471`}
                                            initial={{ strokeDasharray: '0 471' }}
                                            animate={{ strokeDasharray: `${(100 - safeIntegrity) * 4.71} 471` }}
                                            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                                            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 0, 60, 0.4))' }}
                                        />
                                        {/* Gradient definitions */}
                                        <defs>
                                            <linearGradient id="gradientCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#00f0ff" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                            <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#ff003c" />
                                                <stop offset="100%" stopColor="#f87171" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span 
                                            className="text-5xl font-black text-white text-glow-cyan"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            {safeIntegrity}%
                                        </motion.span>
                                        <span className={`text-xs font-mono mt-1 ${integrityStatus.color}`}>
                                            {integrityStatus.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyber-primary to-cyan-400" style={{ boxShadow: '0 0 8px rgba(0, 240, 255, 0.5)' }} />
                                    <span className="text-xs font-mono text-cyber-muted">INTEGRITY</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyber-danger to-red-400" style={{ boxShadow: '0 0 8px rgba(255, 0, 60, 0.5)' }} />
                                    <span className="text-xs font-mono text-cyber-muted">VULNERABILITY</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
};
