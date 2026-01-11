import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Flame, TrendingUp, AlertTriangle, ChevronRight, Zap, RefreshCw, Filter } from 'lucide-react';
import { analyticsApi } from '../api';

interface TopicWeight {
  name: string;
  weight: number;
  priority?: string;
}

interface CategoryData {
  category: string;
  averageWeight?: number;
  topics: TopicWeight[];
}

type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export const AnalyticsPage = () => {
    const [data, setData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');

    const fetchData = (refresh = false) => {
        if (refresh) setRegenerating(true);
        else setLoading(true);
        
        analyticsApi.getHeatmap(refresh)
            .then((res: any) => {
                setData(res.data);
                if (res.data.length > 0) {
                    setSelectedCategory(res.data[0].category);
                }
            })
            .catch(console.error)
            .finally(() => {
                setLoading(false);
                setRegenerating(false);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getHeatColor = (weight: number) => {
        if (weight >= 90) return { 
            bg: 'from-red-600 to-red-500', 
            border: 'border-red-500/50',
            glow: 'shadow-red-500/30',
            text: 'text-red-400',
            label: 'CRITICAL'
        };
        if (weight >= 80) return { 
            bg: 'from-orange-500 to-amber-500', 
            border: 'border-orange-500/50',
            glow: 'shadow-orange-500/30',
            text: 'text-orange-400',
            label: 'HIGH'
        };
        if (weight >= 70) return { 
            bg: 'from-yellow-500 to-yellow-400', 
            border: 'border-yellow-500/50',
            glow: 'shadow-yellow-500/20',
            text: 'text-yellow-400',
            label: 'MODERATE'
        };
        return { 
            bg: 'from-emerald-500 to-green-500', 
            border: 'border-emerald-500/50',
            glow: 'shadow-emerald-500/20',
            text: 'text-emerald-400',
            label: 'LOW'
        };
    };

    const selectedData = data.find(d => d.category === selectedCategory);
    
    // Filter topics by priority
    const filterTopicsByPriority = (topics: TopicWeight[]): TopicWeight[] => {
        if (priorityFilter === 'ALL') return topics;
        return topics.filter(t => {
            const weight = t.weight;
            switch (priorityFilter) {
                case 'CRITICAL': return weight >= 90;
                case 'HIGH': return weight >= 80 && weight < 90;
                case 'MODERATE': return weight >= 70 && weight < 80;
                case 'LOW': return weight < 70;
                default: return true;
            }
        });
    };
    
    const filteredTopics = selectedData ? filterTopicsByPriority(selectedData.topics) : [];

    return (
        <div className="min-h-[calc(100vh-80px)] p-6 md:p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2 flex items-center gap-4"
                        >
                            <Activity 
                                className="text-cyber-danger" 
                                size={44} 
                                style={{ filter: 'drop-shadow(0 0 15px rgba(255, 0, 60, 0.6))' }} 
                            />
                            PYQ <span className="text-cyber-danger">INTELLIGENCE</span>
                        </motion.h1>
                        <p className="text-cyber-muted font-mono tracking-[0.2em] uppercase text-sm flex items-center gap-3">
                            Historical Exam Pattern Analysis • {data.length} Modules
                            <button
                                onClick={() => fetchData(true)}
                                disabled={regenerating}
                                className="ml-2 p-1.5 rounded bg-cyber-dark border border-white/10 hover:border-cyber-primary/50 hover:text-cyber-primary transition-all disabled:opacity-50"
                                title="Regenerate AI Analysis"
                            >
                                <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                            </button>
                        </p>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex gap-4 text-xs font-mono">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-red-600 to-red-500" />
                            <span className="text-red-400">CRITICAL 90+</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-500 to-amber-500" />
                            <span className="text-orange-400">HIGH 80+</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-yellow-400" />
                            <span className="text-yellow-400">MOD 70+</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-green-500" />
                            <span className="text-emerald-400">LOW</span>
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-6 gap-3 animate-pulse">
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-lg" />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {data.map((cat, i) => (
                            <motion.button
                                key={cat.category}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setSelectedCategory(cat.category)}
                                className={`px-5 py-3 rounded-lg font-mono text-sm transition-all duration-300 flex items-center gap-2 ${
                                    selectedCategory === cat.category
                                        ? 'bg-cyber-primary text-cyber-black font-bold shadow-neon-blue'
                                        : 'bg-cyber-dark/80 text-cyber-muted border border-white/10 hover:border-cyber-primary/50 hover:text-white'
                                }`}
                            >
                                <Flame size={14} className={selectedCategory === cat.category ? 'text-cyber-black' : 'text-cyber-primary'} />
                                {cat.category}
                            </motion.button>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    {selectedData && (
                        <motion.div
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Stats Bar */}
                            <div className="bg-cyber-dark/60 border border-white/10 rounded-xl p-4 flex flex-wrap gap-6 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center">
                                        <TrendingUp size={20} className="text-cyber-primary" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{selectedData.topics.length}</div>
                                        <div className="text-xs font-mono text-cyber-muted">TOPICS TRACKED</div>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-red-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {selectedData.topics.filter(t => t.weight >= 90).length}
                                        </div>
                                        <div className="text-xs font-mono text-cyber-muted">CRITICAL PRIORITY</div>
                                    </div>
                                </div>
                                <div className="w-px h-10 bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                        <Zap size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">
                                            {Math.round(selectedData.topics.reduce((a, b) => a + b.weight, 0) / selectedData.topics.length)}%
                                        </div>
                                        <div className="text-xs font-mono text-cyber-muted">AVG. WEIGHT</div>
                                    </div>
                                </div>
                            </div>

                            {/* Priority Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 text-cyber-muted text-sm font-mono mr-2">
                                    <Filter size={14} />
                                    FILTER:
                                </div>
                                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as PriorityFilter[]).map((filter) => {
                                    const counts: Record<PriorityFilter, number> = {
                                        'ALL': selectedData.topics.length,
                                        'CRITICAL': selectedData.topics.filter(t => t.weight >= 90).length,
                                        'HIGH': selectedData.topics.filter(t => t.weight >= 80 && t.weight < 90).length,
                                        'MODERATE': selectedData.topics.filter(t => t.weight >= 70 && t.weight < 80).length,
                                        'LOW': selectedData.topics.filter(t => t.weight < 70).length,
                                    };
                                    const filterColors: Record<PriorityFilter, string> = {
                                        'ALL': 'border-cyber-primary text-cyber-primary bg-cyber-primary/10',
                                        'CRITICAL': 'border-red-500 text-red-400 bg-red-500/10',
                                        'HIGH': 'border-orange-500 text-orange-400 bg-orange-500/10',
                                        'MODERATE': 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
                                        'LOW': 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
                                    };
                                    const isActive = priorityFilter === filter;
                                    
                                    return (
                                        <button
                                            key={filter}
                                            onClick={() => setPriorityFilter(filter)}
                                            disabled={counts[filter] === 0}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
                                                isActive 
                                                    ? filterColors[filter]
                                                    : 'border-white/10 text-cyber-muted hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {filter}
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                isActive ? 'bg-white/20' : 'bg-white/5'
                                            }`}>
                                                {counts[filter]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Topic Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredTopics.map((topic, index) => {
                                    const colors = getHeatColor(topic.weight);
                                    const isHovered = hoveredTopic === topic.name;
                                    
                                    return (
                                        <motion.div
                                            key={topic.name}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            onMouseEnter={() => setHoveredTopic(topic.name)}
                                            onMouseLeave={() => setHoveredTopic(null)}
                                            className={`relative overflow-hidden rounded-xl border ${colors.border} transition-all duration-300 cursor-pointer group ${
                                                isHovered ? `shadow-lg ${colors.glow}` : ''
                                            }`}
                                        >
                                            {/* Background Gradient */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-20 group-hover:opacity-30 transition-opacity`} />
                                            
                                            {/* Heat Bar */}
                                            <div className="absolute bottom-0 left-0 right-0 h-1">
                                                <motion.div 
                                                    className={`h-full bg-gradient-to-r ${colors.bg}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${topic.weight}%` }}
                                                    transition={{ duration: 0.8, delay: index * 0.05 }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="relative p-4 min-h-[100px] flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${colors.text} bg-black/30`}>
                                                        {colors.label}
                                                    </span>
                                                    <span className={`text-lg font-black ${colors.text}`}>
                                                        {topic.weight}%
                                                    </span>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-white font-semibold text-sm leading-tight group-hover:text-white/90 transition-colors">
                                                        {topic.name}
                                                    </h4>
                                                </div>

                                                {/* Hover indicator */}
                                                <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                                                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                                                }`}>
                                                    <ChevronRight size={16} className={colors.text} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Priority Breakdown */}
                            <div className="bg-cyber-dark/40 border border-white/5 rounded-xl p-6 mt-8">
                                <h3 className="text-white font-mono text-sm mb-4 flex items-center gap-2">
                                    <Activity size={14} className="text-cyber-primary" />
                                    PRIORITY DISTRIBUTION
                                </h3>
                                <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
                                    {(() => {
                                        const critical = selectedData.topics.filter(t => t.weight >= 90).length;
                                        const high = selectedData.topics.filter(t => t.weight >= 80 && t.weight < 90).length;
                                        const moderate = selectedData.topics.filter(t => t.weight >= 70 && t.weight < 80).length;
                                        const low = selectedData.topics.filter(t => t.weight < 70).length;
                                        const total = selectedData.topics.length;
                                        
                                        return (
                                            <>
                                                {critical > 0 && (
                                                    <div 
                                                        className="bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center text-xs font-bold text-white"
                                                        style={{ width: `${(critical / total) * 100}%` }}
                                                    >
                                                        {critical}
                                                    </div>
                                                )}
                                                {high > 0 && (
                                                    <div 
                                                        className="bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white"
                                                        style={{ width: `${(high / total) * 100}%` }}
                                                    >
                                                        {high}
                                                    </div>
                                                )}
                                                {moderate > 0 && (
                                                    <div 
                                                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center text-xs font-bold text-black/70"
                                                        style={{ width: `${(moderate / total) * 100}%` }}
                                                    >
                                                        {moderate}
                                                    </div>
                                                )}
                                                {low > 0 && (
                                                    <div 
                                                        className="bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-xs font-bold text-white"
                                                        style={{ width: `${(low / total) * 100}%` }}
                                                    >
                                                        {low}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex justify-between mt-2 text-xs font-mono text-cyber-muted">
                                    <span>← More Frequent in Exams</span>
                                    <span>Less Frequent →</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
