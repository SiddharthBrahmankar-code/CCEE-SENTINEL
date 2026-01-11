import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X, RotateCcw, ChevronRight, ArrowLeft, Home, Layers, BookOpen } from 'lucide-react';
import { flashcardApi, modulesApi } from '../api';
import { storageService } from '../services/storageService';
import { useGlobalStore } from '../store/GlobalStore';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import clsx from 'clsx';


interface Flashcard {
  type: string;
  front: string;
  back: string;
}

type FlashcardMode = 'topic' | 'module';

export const FlashcardPage = () => {
    const [modules, setModules] = useState<{id: string, name: string, topics: string[]}[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [isFlipped, setIsFlipped] = useState(false);
    const [mode, setMode] = useState<FlashcardMode>('topic');

    // Global Store
    const { 
        flashcards: { cards: rawCards, currentIndex, isGenerating, moduleId: activeModuleId, selectedTopic: savedTopic, score }, 
        setFlashcardData, 
        setFlashcardsGenerating, 
        updateFlashcardIndex,
        updateFlashcardScore,
        setFlashcardSelection
    } = useGlobalStore();

    // Initialize from Store
    useEffect(() => {
        if (activeModuleId) setSelectedModule(activeModuleId);
        if (savedTopic) setSelectedTopic(savedTopic);
    }, []); // Run on mount only for restore

    // Sync Selection to Store
    useEffect(() => {
        setFlashcardSelection(selectedModule, selectedTopic);
    }, [selectedModule, selectedTopic, setFlashcardSelection]);

    const cards = rawCards as Flashcard[];

    // Derived State
    const gameState = cards.length === 0 ? 'SETUP' : (currentIndex >= cards.length ? 'SUMMARY' : 'PLAYING');
    
    // Load modules on mount
    useEffect(() => {
        modulesApi.getAll()
            .then(res => {
                setModules(res.data);
            })
            .catch(console.error);
    }, []);

    // Sync active module
    // Sync active module (if game starts)
    useEffect(() => {
        if (activeModuleId && selectedModule !== activeModuleId) {
            setSelectedModule(activeModuleId);
        }
    }, [activeModuleId]);

    // Load topics when module changes
    useEffect(() => {
        if (selectedModule) {
            const module = modules.find(m => m.id === selectedModule);
            if (module && module.topics) {
                setTopics(module.topics);
                if (selectedModule !== activeModuleId) setSelectedTopic(''); 
            } else {
                modulesApi.getTopics(selectedModule)
                    .then(res => {
                        setTopics(res.data.topics || []);
                        if (selectedModule !== activeModuleId) setSelectedTopic('');
                    })
                    .catch(console.error);
            }
        } else {
            setTopics([]);
            setSelectedTopic('');
        }
    }, [selectedModule, modules]);

    const startGame = async () => {
        if (!selectedModule) return;
        if (mode === 'topic' && !selectedTopic) return;
        
        setFlashcardsGenerating(true);
        try {
            let res;
            if (mode === 'module') {
                // Full module mode - generate from all topics
                res = await flashcardApi.generateFullModule(selectedModule, topics);
                setFlashcardSelection(selectedModule, 'Full Module');
            } else {
                // Single topic mode
                res = await flashcardApi.generate(selectedModule, selectedTopic);
            }
            setFlashcardData(selectedModule, res.data.flashcards);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load cards");
            setFlashcardsGenerating(false);
        }
    };


    // Keyboard shortcuts for flashcards
    useKeyboardShortcuts({
        onFlip: () => gameState === 'PLAYING' && setIsFlipped(!isFlipped),
        onNext: () => gameState === 'PLAYING' && handleNext(true),
        onPrevious: () => gameState === 'PLAYING' && currentIndex > 0 && updateFlashcardIndex(currentIndex - 1),
        enabled: gameState === 'PLAYING',
    });


    const handleNext = (correct: boolean) => {
        if (correct) {
            updateFlashcardScore(score + 1);
            storageService.updateFlashcardStats(1, 1);
        } else {
            storageService.updateFlashcardStats(1, 0);
        }
        setIsFlipped(false);
        
        setTimeout(() => {
            updateFlashcardIndex(currentIndex + 1);
        }, 300);
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return 'text-cyber-success';
        if (accuracy >= 60) return 'text-cyber-primary';
        if (accuracy >= 40) return 'text-yellow-500';
        return 'text-cyber-danger';
    };

    const accuracy = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0;

    return (
        <div className="min-h-[calc(100vh-80px)] p-6 max-w-5xl mx-auto">
            
            {/* Header */}
            <header className="mb-12 text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-cyber-primary/10 blur-3xl rounded-full pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-6xl font-black text-white flex items-center justify-center gap-4 mb-3 relative">
                        <Zap className="text-cyber-primary" size={48} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))' }} />
                        FLASH<span className="text-cyber-primary">BLITZ</span>
                    </h1>
                    <p className="text-cyber-muted font-mono tracking-[0.3em] uppercase text-sm">
                        Rapid Fire Revision Protocol
                    </p>
                </motion.div>
            </header>

            <AnimatePresence mode="wait">
            {/* SETUP MODE */}
            {gameState === 'SETUP' && (
                <motion.div 
                    key="setup"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="max-w-lg mx-auto"
                >
                    <div className="bg-cyber-dark/80 border border-cyber-primary/20 rounded-2xl p-8 space-y-6 backdrop-blur-md shadow-lg shadow-cyber-primary/5">
                        
                        {/* Mode Toggle */}
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-cyber-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                                Study Mode
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMode('topic')}
                                    className={clsx(
                                        "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                                        mode === 'topic' 
                                            ? "bg-cyber-primary/10 border-cyber-primary text-cyber-primary shadow-neon-blue"
                                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                                    )}
                                >
                                    <BookOpen size={24} />
                                    <span className="text-xs font-mono uppercase tracking-wider">Single Topic</span>
                                    <span className="text-[10px] opacity-60">5 cards</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('module')}
                                    className={clsx(
                                        "p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2",
                                        mode === 'module' 
                                            ? "bg-purple-500/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/20"
                                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:bg-white/10"
                                    )}
                                >
                                    <Layers size={24} />
                                    <span className="text-xs font-mono uppercase tracking-wider">Full Module</span>
                                    <span className="text-[10px] opacity-60">15 cards</span>
                                </button>
                            </div>
                        </div>

                        {/* Module Select */}
                        <div className="space-y-3">
                            <label className="text-xs font-mono text-cyber-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                                Select Module
                            </label>
                            <div className="relative group">
                                <select 
                                    className="select-cyber"
                                    value={selectedModule}
                                    onChange={(e) => setSelectedModule(e.target.value)}
                                >
                                    <option value="">⚡ Choose Module</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.name.replace('DAC School TG ', '')}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-0 rounded-xl bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </div>

                        {/* Topic Select - Only show in topic mode */}
                        {mode === 'topic' && (
                            <div className="space-y-3">
                                <label className="text-xs font-mono text-cyber-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                                    Target Topic
                                </label>
                                <div className="relative group">
                                    <select 
                                        className="select-cyber"
                                        value={selectedTopic}
                                        onChange={(e) => setSelectedTopic(e.target.value)}
                                        disabled={!selectedModule || topics.length === 0}
                                    >
                                        <option value="">
                                            {!selectedModule ? '📋 Select Module First' : topics.length === 0 ? '⏳ Loading Topics...' : '🎯 Choose Topic'}
                                        </option>
                                        {topics.map((topic, idx) => (
                                            <option key={idx} value={topic}>{topic}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-0 rounded-xl bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Full Module Info */}
                        {mode === 'module' && selectedModule && topics.length > 0 && (
                            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                <p className="text-purple-400 text-sm font-mono">
                                    📚 Will cover {Math.min(topics.length, 8)} topics with 15 flashcards
                                </p>
                            </div>
                        )}

                        {/* Start Button */}
                        <button 
                            onClick={startGame}
                            disabled={isGenerating || !selectedModule || (mode === 'topic' && !selectedTopic)}
                            className={clsx(
                                "w-full py-4 font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 group",
                                mode === 'module' 
                                    ? "bg-purple-500 text-white hover:bg-purple-400 hover:shadow-lg hover:shadow-purple-500/30"
                                    : "bg-cyber-primary text-cyber-black hover:shadow-neon-blue"
                            )}
                        >
                            {isGenerating ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                <>
                                    {mode === 'module' ? 'FULL MODULE BLITZ' : 'INITIATE BLITZ'}
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* PLAYING MODE */}
            {gameState === 'PLAYING' && cards.length > 0 && (
                <motion.div 
                    key="playing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-2xl mx-auto"
                >
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center text-cyber-muted font-mono text-xs mb-2">
                            <span>CARD {currentIndex + 1} / {cards.length}</span>
                            <span className="text-cyber-success">SCORE: {score}</span>
                        </div>
                        <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-cyber-primary to-cyber-success"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Flashcard */}
                    <div 
                        className="relative h-80 md:h-96 w-full cursor-pointer group perspective-1000" 
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <motion.div 
                            className="w-full h-full relative"
                            style={{ transformStyle: 'preserve-3d' }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                        >
                            {/* FRONT */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-br from-cyber-dark to-cyber-panel border-2 border-cyber-primary/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-cyber-primary/60 transition-all duration-300"
                                style={{ backfaceVisibility: 'hidden', boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)' }}
                            >
                                <span className="absolute top-5 left-5 px-3 py-1.5 bg-cyber-primary/10 border border-cyber-primary/30 rounded text-xs text-cyber-primary font-mono">
                                    {cards[currentIndex].type}
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold text-white leading-relaxed px-4">
                                    {cards[currentIndex].front}
                                </h3>
                                <div className="absolute bottom-5 text-cyber-muted text-xs font-mono flex items-center gap-2 animate-pulse">
                                    <span className="w-4 h-[1px] bg-cyber-muted" />
                                    Click to Reveal
                                    <span className="w-4 h-[1px] bg-cyber-muted" />
                                </div>
                            </div>

                            {/* BACK */}
                            <div 
                                className="absolute inset-0 bg-gradient-to-br from-cyber-primary to-cyan-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
                                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)' }}
                            >
                                <h3 className="text-lg md:text-xl font-semibold text-cyber-black leading-relaxed px-4">
                                    {cards[currentIndex].back}
                                </h3>
                            </div>
                        </motion.div>
                    </div>

                    {/* Navigation Bar */}
                    <div className="mt-6 flex justify-between items-center px-4">
                        <button
                            onClick={() => setFlashcardData('', [])} 
                            className="flex items-center gap-2 px-4 py-2 text-cyber-muted hover:text-white hover:bg-white/5 font-mono text-sm transition-all rounded-lg border border-transparent hover:border-white/10"
                        >
                            <Home size={16} /> EXIT
                        </button>
                        <button
                            onClick={() => { if (currentIndex > 0) { updateFlashcardIndex(currentIndex - 1); setIsFlipped(false); } }}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2 text-cyber-primary hover:text-white hover:bg-cyber-primary/10 font-mono text-sm transition-all rounded-lg border border-cyber-primary/30 hover:border-cyber-primary/50 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-cyber-primary/30"
                        >
                            <ArrowLeft size={16} /> PREVIOUS
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="mt-6 flex gap-6 justify-center">
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNext(false)}
                            className="p-5 rounded-full bg-cyber-danger/10 text-cyber-danger border-2 border-cyber-danger/50 hover:bg-cyber-danger hover:text-white hover:shadow-lg transition-all duration-300"
                            style={{ boxShadow: '0 0 20px rgba(255, 0, 60, 0.2)' }}
                        >
                            <X size={28} strokeWidth={3} />
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNext(true)}
                            className="p-5 rounded-full bg-cyber-success/10 text-cyber-success border-2 border-cyber-success/50 hover:bg-cyber-success hover:text-cyber-black hover:shadow-lg transition-all duration-300"
                            style={{ boxShadow: '0 0 20px rgba(0, 255, 159, 0.2)' }}
                        >
                            <Check size={28} strokeWidth={3} />
                        </motion.button>
                    </div>
                </motion.div>
            )}

            {/* SUMMARY MODE */}
            {gameState === 'SUMMARY' && (
                <motion.div 
                    key="summary"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 100 }}
                    className="max-w-md mx-auto text-center"
                >
                    <div className="bg-cyber-dark/80 border border-white/10 rounded-2xl p-10 backdrop-blur-md">
                        {/* Score Circle */}
                        <div className="relative w-40 h-40 mx-auto mb-8">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="none"
                                    className="text-white/10"
                                />
                                <motion.circle 
                                    cx="80" cy="80" r="70" 
                                    stroke="currentColor" 
                                    strokeWidth="8" 
                                    fill="none"
                                    strokeLinecap="round"
                                    className={getAccuracyColor(accuracy)}
                                    strokeDasharray={`${accuracy * 4.4} 440`}
                                    initial={{ strokeDasharray: '0 440' }}
                                    animate={{ strokeDasharray: `${accuracy * 4.4} 440` }}
                                    transition={{ duration: 1, delay: 0.2 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span 
                                    className={`text-5xl font-black ${getAccuracyColor(accuracy)}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {accuracy}%
                                </motion.span>
                            </div>
                        </div>

                        <div className="text-cyber-muted font-mono tracking-[0.2em] uppercase text-sm mb-2">
                            Accuracy Rating
                        </div>
                        <div className="text-white/60 text-sm mb-8">
                            {score} correct out of {cards.length} cards
                        </div>
                        
                        <button 
                            onClick={() => setFlashcardData('', [])}
                            className="flex items-center gap-3 mx-auto px-8 py-4 bg-cyber-primary/10 border border-cyber-primary/30 rounded-lg hover:bg-cyber-primary/20 hover:border-cyber-primary transition-all text-cyber-primary font-mono"
                        >
                            <RotateCcw size={18} /> 
                            RESTART PROTOCOL
                        </button>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};
