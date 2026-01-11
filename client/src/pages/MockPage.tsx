import { useState, useEffect } from 'react';
import { mockApi, modulesApi } from '../api';
import { storageService } from '../services/storageService';
import { useGlobalStore, type Question } from '../store/GlobalStore';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, AlertOctagon, Timer, Zap, Shield, LogOut, Flag, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { BookmarkButton } from '../components/BookmarkButton';
import { QuestionNav } from '../components/QuestionNav';
import { ReviewFilterBar, type ReviewFilter } from '../components/ReviewFilterBar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TestLoadingScreen } from '../components/TestLoadingScreen';



interface Module {
  id: string;
  name: string;
  topics: string[];
}

export const MockPage = () => {
    const [modules, setModules] = useState<Module[]>([]);
    // Global Store State
    const { 
        mock: { 
            questions: rawQuestions, 
            currentQuestionIndex, 
            answers: rawAnswers, 
            markedForReview: rawMarkedForReview,
            reviewBookmarks: rawReviewBookmarks,
            isGenerating, 
            moduleId: activeModuleId, 
            mode: savedMode, 
            startTime 
        }, 
        setMockData, 
        setMockSelection,
        setMockGenerating,
        updateMockGenerationProgress,
        updateMockProgress,
        toggleMarkForReview,
        clearMock,
        addMockAttempt,
        // Global Bookmarks
        bookmarks,
        addBookmark,
        removeBookmark 
    } = useGlobalStore();

    // Safe fallbacks for store values
    const reviewBookmarks = rawReviewBookmarks ?? [];
    const markedForReview = rawMarkedForReview ?? {};
    const answers = rawAnswers ?? {};

    // Local State (Synced with Store)
    const [selectedModule, setSelectedModule] = useState(activeModuleId || '');
    const [mode, setMode] = useState<'PRACTICE' | 'CCEE'>(savedMode || 'PRACTICE');
    const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');

    // Sync Selection to Store
    useEffect(() => {
        setMockSelection(selectedModule, mode);
    }, [selectedModule, mode, setMockSelection]);

    const questions = rawQuestions as Question[];

    // Derived Local State
    const started = questions.length > 0;
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        modulesApi.getAll().then(res => setModules(res.data)).catch(console.error);
    }, []);

    // Prevent browser back button from returning to completed exam
    // Handler is always active - catches back press even during instant submit
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If the state indicates exam was completed, reset immediately
            if (event.state?.mockCompleted) {
                clearMock();
                setShowResult(false);
                setSelectedModule('');
                setMode('PRACTICE');
                setReviewFilter('all');
                // Replace state to prevent further back navigation
                window.history.replaceState(null, '');
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [clearMock]);

    // Sync active module if exists
    useEffect(() => {
        if (activeModuleId && selectedModule !== activeModuleId) {
            setSelectedModule(activeModuleId);
        }
    }, [activeModuleId]);

    // Timer Logic (Persistent)
    useEffect(() => {
        if (!started || showResult || mode !== 'CCEE' || !startTime) return;

        const duration = 50 * 60; // 50 mins
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
                setShowResult(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [started, showResult, mode, startTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule) return;
        
        setMockGenerating(true);
        try {
            // Note: This promise continues even if component unmounts (mostly), 
            // but for safety, the Global Store is updated in the .then()
            const res = await mockApi.generate(selectedModule, mode, (progress, stage) => {
                // Report real progress to Global Store for TestLoadingScreen
                updateMockGenerationProgress(progress, stage);
            });
            setMockData(selectedModule, res.data);
            setShowResult(false);
            setReviewFilter('all');
            // Timer sets automatically via useEffect observing startTime
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate mock test. Ensure backend is running and configured.');
            setMockGenerating(false);
        }
    };

    const handleAnswer = (optionIdx: number) => {
        updateMockProgress(currentQuestionIndex, { ...answers, [currentQuestionIndex]: optionIdx });
    };

    const handleQuit = () => {
        if (window.confirm('ABORT MISSION? All progress will be lost.')) {
            console.log("🚨 Aborting Mission...");
            clearMock();
            setSelectedModule(''); // Reset selection
            setMode('PRACTICE');   // Reset mode
            setShowResult(false);
            setReviewFilter('all');
        }
    };

    const handleMarkForReview = () => {
        toggleMarkForReview(currentQuestionIndex);
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onSelect: (index) => started && !showResult && handleAnswer(index),
        onNext: () => started && !showResult && currentQuestionIndex < questions.length - 1 && updateMockProgress(currentQuestionIndex + 1, answers),
        onPrevious: () => started && !showResult && currentQuestionIndex > 0 && updateMockProgress(currentQuestionIndex - 1, answers),
        onQuit: () => started && !showResult && handleQuit(),
        enabled: started && !showResult,
    });

    // Add M key for mark for review
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!started || showResult) return;
            if (e.key.toLowerCase() === 'm') {
                handleMarkForReview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [started, showResult, currentQuestionIndex]);

    const calculateScore = () => {
        let score = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) score++;
        });
        return score;
    };

    // Filter questions for review
    const getFilteredQuestions = () => {
        return questions.map((q, idx) => ({
            question: q,
            originalIndex: idx,
            isCorrect: answers[idx] === q.correctAnswer,
            // Align with BookmarkButton logic (Global State + Module Scoping)
            isBookmarked: bookmarks.items.some(
                b => b.type === 'question' && 
                     b.referenceId === q.id && 
                     (selectedModule ? b.moduleId === selectedModule : true)
            ),
            isUnattempted: answers[idx] === undefined
        })).filter(item => {
            switch (reviewFilter) {
                case 'correct': return item.isCorrect && !item.isUnattempted;
                case 'incorrect': return !item.isCorrect && !item.isUnattempted;
                case 'bookmarked': return item.isBookmarked;
                case 'unattempted': return item.isUnattempted;
                default: return true;
            }
        });
    };

    const filteredQuestions = getFilteredQuestions();
    const unattemptedCount = questions.filter((_, idx) => answers[idx] === undefined).length;
    const attemptedCount = questions.length - unattemptedCount;
    const correctCount = questions.filter((_, idx) => answers[idx] !== undefined && answers[idx] === questions[idx].correctAnswer).length;
    const incorrectCount = attemptedCount - correctCount;
    const bookmarkedCount = reviewBookmarks.length;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-80px)]">
            {/* Loading Screen Overlay */}
            {isGenerating && <TestLoadingScreen mode={mode} module={selectedModule} />}
            
            {!started ? (
                // Configuration Screen
                <div className="max-w-xl mx-auto mt-20">
                     <header className="text-center mb-12">
                        <h1 data-testid="mock-page-title" className="text-5xl font-black tracking-tighter text-white mb-4">
                            MOCK <span className="text-cyber-danger">WARGAME</span>
                        </h1>
                        <p className="text-cyber-muted text-lg">Select your battlefield capability.</p>
                    </header>
                    
                    <form onSubmit={handleStart} className="card bg-cyber-dark/50 space-y-8 p-8 border border-white/10">
                        <div>
                            <label className="block text-sm font-mono text-cyber-muted mb-3 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                                Target Module
                            </label>
                            <div className="relative group">
                                <select 
                                    value={selectedModule}
                                    onChange={e => setSelectedModule(e.target.value)}
                                    className={clsx("select-cyber text-lg", isGenerating && "opacity-50 cursor-not-allowed")}
                                    required
                                    disabled={isGenerating}
                                >
                                    <option value="">🎯 Select Command Module...</option>
                                    {modules.map(m => (
                                        <option key={m.id} value={m.id}>{m.name.replace('DAC School TG ', '')}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-0 rounded-xl bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-mono text-cyber-muted mb-4 uppercase tracking-wider">Engagement Mode</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => !isGenerating && setMode('PRACTICE')}
                                    className={clsx(
                                        "p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden group",
                                        mode === 'PRACTICE' 
                                            ? "border-cyber-primary bg-cyber-primary/10 text-white shadow-neon-blue" 
                                            : "border-white/10 text-cyber-muted hover:border-white/30 hover:bg-white/5",
                                        isGenerating && "opacity-50 cursor-not-allowed grayscale"
                                    )}
                                    disabled={isGenerating}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Zap className={mode === 'PRACTICE' ? "text-cyber-primary" : "text-cyber-muted"} />
                                        {mode === 'PRACTICE' && <motion.div layoutId="sel" className="w-2 h-2 rounded-full bg-cyber-primary" />}
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">SKIRMISH</h3>
                                    <p className="text-xs opacity-70">10 Questions • Practice • Instant Feedback</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => !isGenerating && setMode('CCEE')}
                                    className={clsx(
                                        "p-4 rounded-lg border-2 text-left transition-all relative overflow-hidden group",
                                        mode === 'CCEE' 
                                            ? "border-cyber-danger bg-cyber-danger/10 text-white shadow-neon-red" 
                                            : "border-white/10 text-cyber-muted hover:border-white/30 hover:bg-white/5",
                                        isGenerating && "opacity-50 cursor-not-allowed grayscale"
                                    )}
                                    disabled={isGenerating}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <Shield className={mode === 'CCEE' ? "text-cyber-danger" : "text-cyber-muted"} />
                                        {mode === 'CCEE' && <motion.div layoutId="sel" className="w-2 h-2 rounded-full bg-cyber-danger" />}
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">FULL WAR</h3>
                                    <p className="text-xs opacity-70">40 Questions • 50 Mins • CCEE Pattern</p>
                                </button>
                            </div>
                        </div>

                         <button 
                            type="submit" 
                            disabled={isGenerating || !selectedModule}
                            className={clsx(
                                "w-full py-4 text-lg font-bold rounded-lg flex justify-center items-center gap-3 transition-all transform hover:scale-[1.02]",
                                mode === 'PRACTICE' 
                                    ? "bg-cyber-primary text-cyber-black hover:bg-cyan-400 shadow-neon-blue"
                                    : "bg-cyber-danger text-white hover:bg-red-600 shadow-neon-red"
                            )}
                        >
                            {isGenerating ? <div className="animate-spin h-6 w-6 border-3 border-current border-t-transparent rounded-full" /> : <Play size={24} />}
                            {isGenerating ? 'INITIALIZING PROTOCOLS...' : 'INITIATE SIMULATION'}
                        </button>
                    </form>
                </div>
            ) : !showResult ? (
                // Quiz Runner with Navigation Sidebar on Right
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Top Header Section - Full Width */}
                    <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                            <div className="bg-cyber-dark/40 border border-white/10 rounded-lg p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyber-primary/10 flex items-center justify-center text-cyber-primary">
                                    <AlertOctagon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs text-cyber-muted uppercase tracking-wider">Active Module</h4>
                                    <p className="font-bold text-white text-sm truncate">
                                        {modules.find(m => m.id === selectedModule)?.name.replace('DAC School TG ', '') || selectedModule}
                                    </p>
                                </div>
                            </div>
                            <div className={clsx("bg-cyber-dark/40 border rounded-lg p-4 flex items-center gap-3", 
                                mode === 'CCEE' ? "border-cyber-danger/30" : "border-cyber-primary/30")}>
                                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center", 
                                    mode === 'CCEE' ? "bg-cyber-danger/10 text-cyber-danger" : "bg-cyber-primary/10 text-cyber-primary")}>
                                    {mode === 'CCEE' ? <Shield size={20} /> : <Zap size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-xs text-cyber-muted uppercase tracking-wider">Engagement Protocol</h4>
                                    <p className="font-bold text-white text-sm">
                                        {mode === 'CCEE' ? 'FULL WAR (TIMED)' : 'SKIRMISH (PRACTICE)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleQuit}
                            className="flex items-center gap-2 text-cyber-danger hover:text-red-400 transition-colors font-mono text-xs tracking-widest uppercase border border-cyber-danger/30 hover:border-cyber-danger px-4 py-2 rounded ml-4"
                        >
                            <LogOut size={14} /> Abort
                        </button>
                    </div>

                    {/* Question Counter & Timer Bar */}
                    <div className="flex justify-between items-center text-cyber-muted font-mono text-sm bg-cyber-black/50 p-4 rounded-lg border border-white/5 max-w-3xl">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse"/> QUESTION {currentQuestionIndex + 1} / {questions.length}</span>
                        <div className="flex items-center gap-2 text-white">
                            <Timer size={16} className={clsx(mode === 'CCEE' && timeLeft < 300 ? "text-red-500 animate-pulse" : "text-cyber-primary")}/> 
                            <span className="font-bold tracking-wider">{mode === 'CCEE' ? formatTime(timeLeft) : 'UNLIMITED'}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden border border-white/5 max-w-3xl">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            className={clsx("h-full", mode === 'CCEE' ? "bg-gradient-to-r from-red-500 to-cyber-danger" : "bg-gradient-to-r from-cyan-500 to-cyber-primary")}
                        />
                    </div>

                    {/* Main Content with Sidebar */}
                    <div className="flex gap-6">
                        {/* Question Card */}
                        <div className="flex-1 max-w-3xl">
                            <motion.div
                                key={currentQuestionIndex} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card min-h-[400px] flex flex-col p-8 border border-white/10 shadow-2xl bg-cyber-dark/80 backdrop-blur-sm"
                            >
                             <div className="flex-1 space-y-8">
                                <div className="flex items-start justify-between">
                                    <span className={clsx("inline-block px-3 py-1 rounded text-xs font-bold tracking-widest", 
                                        questions[currentQuestionIndex].type === 'OUTPUT' ? "bg-purple-500/20 text-purple-400" :
                                        questions[currentQuestionIndex].type === 'DEBUGGING' ? "bg-orange-500/20 text-orange-400" :
                                        "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {questions[currentQuestionIndex].type} PROTOCOL
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {/* Mark for Review Button */}
                                        <button
                                            onClick={handleMarkForReview}
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                                markedForReview[currentQuestionIndex]
                                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                                                    : "bg-white/5 text-cyber-muted border border-white/10 hover:bg-white/10"
                                            )}
                                            title="Press M to toggle"
                                        >
                                            <Flag size={14} className={markedForReview[currentQuestionIndex] ? "fill-amber-400" : ""} />
                                            {markedForReview[currentQuestionIndex] ? 'Marked' : 'Review'}
                                        </button>
                                        <BookmarkButton
                                          type="question"
                                          referenceId={questions[currentQuestionIndex].id}
                                          moduleId={selectedModule}
                                          content={{
                                            question: questions[currentQuestionIndex].question,
                                            options: questions[currentQuestionIndex].options,
                                            correctAnswer: questions[currentQuestionIndex].correctAnswer,
                                            explanation: questions[currentQuestionIndex].explanation,
                                            snippet: questions[currentQuestionIndex].snippet
                                          }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="text-xl md:text-2xl font-medium text-white leading-relaxed font-sans space-y-6">
                                    {/* Question Text */}
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({children}) => <div className="mb-4 last:mb-0">{children}</div>,
                                            // Inline code (single backticks)
                                            code: ({node, inline, className, children, ...props}: any) => {
                                                // If it's a code block (triple backticks), render as a block
                                                if (!inline) {
                                                    return (
                                                        <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                                                <span className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
                                                                    Code Block
                                                                </span>
                                                                <div className="flex gap-1.5">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                                                                </div>
                                                            </div>
                                                            <pre className="p-6 overflow-x-auto text-sm md:text-base font-mono text-blue-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                                <code className={className} {...props}>{children}</code>
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                // Inline code (single backticks) - keep original formatting
                                                return <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyber-accent font-mono text-[0.9em]" {...props}>{children}</code>;
                                            },
                                            strong: ({children}) => <strong className="text-cyber-primary">{children}</strong>,
                                            // Add pre handling to ensure proper formatting
                                            pre: ({children}) => <>{children}</>
                                        }}
                                    >
                                        {questions[currentQuestionIndex].question}
                                    </ReactMarkdown>

                                    {/* Separate Code Snippet (from snippet field) */}
                                    {questions[currentQuestionIndex].snippet && (
                                        <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
                                            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                                <span className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
                                                    Code Context
                                                </span>
                                                <div className="flex gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                                                </div>
                                            </div>
                                            <pre className="p-6 text-sm md:text-base font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-words">
                                                <code>{
                                                    // Process escaped characters in snippet
                                                    questions[currentQuestionIndex].snippet
                                                        .replace(/\\n/g, '\n')  // Convert \n to actual newlines
                                                        .replace(/\\t/g, '\t')  // Convert \t to actual tabs
                                                        .replace(/\\"/g, '"')   // Convert \" to actual quotes
                                                }</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    {questions[currentQuestionIndex].options.map((opt: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            className={clsx(
                                                "w-full text-left p-5 rounded-lg border-2 transition-all flex items-center gap-6 group relative overflow-hidden",
                                                answers[currentQuestionIndex] === idx 
                                                    ? "bg-cyber-primary/10 border-cyber-primary text-white" 
                                                    : "bg-cyber-black/40 border-white/5 text-cyber-text hover:bg-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-10 h-10 rounded-flex flex-shrink-0 flex items-center justify-center border-2 font-black text-sm transition-colors",
                                                answers[currentQuestionIndex] === idx ? "border-cyber-primary bg-cyber-primary text-cyber-black" : "border-white/10 text-cyber-muted group-hover:border-white/30"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className="text-lg">{opt}</span>
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <div className="border-t border-white/10 pt-8 mt-8 flex justify-between items-center">
                                <button 
                                    onClick={() => updateMockProgress(Math.max(0, currentQuestionIndex - 1), answers)}
                                    disabled={currentQuestionIndex === 0}
                                    className="text-cyber-muted hover:text-white disabled:opacity-30 font-mono text-sm tracking-wider flex items-center gap-2"
                                >
                                    ← RETREAT
                                </button>
                                
                                {currentQuestionIndex < questions.length - 1 ? (
                                    <button 
                                        onClick={() => updateMockProgress(currentQuestionIndex + 1, answers)}
                                        className="px-8 py-3 bg-white text-cyber-black font-black rounded hover:bg-gray-200 uppercase tracking-widest shadow-lg hover:shadow-white/20 transition-all"
                                    >
                                        Next Sector →
                                    </button>
                                ) : (
        
                                        <button 
                                        onClick={() => {
                                            // IMMEDIATELY prevent back navigation - before anything else
                                            window.history.pushState({ mockCompleted: true }, '');
                                            window.history.replaceState({ mockCompleted: true }, '');
                                            
                                            const score = calculateScore();
                                            const timeSpent = mode === 'CCEE' && startTime 
                                                ? Math.floor((Date.now() - startTime) / 1000)
                                                : 0;
                                            
                                            // Save to history
                                            addMockAttempt({
                                                moduleId: selectedModule,
                                                mode,
                                                questions,
                                                answers,
                                                score,
                                                total: questions.length,
                                                timeSpent,
                                                completedAt: Date.now()
                                            });
                                            
                                            // Save to storage service
                                            storageService.saveMockResult({
                                                moduleId: selectedModule,
                                                score: score,
                                                total: questions.length,
                                                date: new Date().toLocaleDateString()
                                            });
                                            setShowResult(true);
                                            toast.success('Test completed and saved!');
                                        }}
                                        className="px-8 py-3 bg-cyber-primary text-cyber-black font-black rounded hover:bg-cyan-400 uppercase tracking-widest shadow-neon-blue transition-all"
                                    >
                                        Finalize Operations
                                    </button>
                                )}
                             </div>
                        </motion.div>
                        </div>

                        {/* Right Sidebar - Question Navigation (Desktop) */}
                        <div className="hidden lg:block w-80 flex-shrink-0">
                            <QuestionNav
                                questions={questions}
                                currentIndex={currentQuestionIndex}
                                answers={answers}
                                markedForReview={markedForReview}
                                onNavigate={(idx) => updateMockProgress(idx, answers)}
                                mode="exam"
                            />
                        </div>
                    </div>

                    {/* Mobile Question Nav (below main content) */}
                    <div className="lg:hidden mt-6">
                        <QuestionNav
                            questions={questions}
                            currentIndex={currentQuestionIndex}
                            answers={answers}
                            markedForReview={markedForReview}
                            onNavigate={(idx) => updateMockProgress(idx, answers)}
                            mode="exam"
                        />
                    </div>
                </div>
            ) : (
                // Result Screen with Review Features
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                     <header className="text-center space-y-4">
                        <h2 className="text-cyber-muted text-sm uppercase tracking-[0.5em]">After Action Report</h2>
                        <div className="text-8xl font-black text-white p-8">
                            {calculateScore()} <span className="text-4xl text-cyber-muted font-normal">/ {questions.length}</span>
                        </div>
                        <div className="inline-block px-6 py-2 rounded-full border border-white/10 bg-cyber-black/50">
                            <p className={clsx("font-mono font-bold tracking-widest", calculateScore() / questions.length > 0.6 ? "text-cyber-success" : "text-cyber-danger")}>
                                {calculateScore() / questions.length > 0.6 ? "● MISSION ACCOMPLISHED" : "● MISSION FAILED: CRITICAL FAILURE"}
                            </p>
                        </div>
                    </header>

                    {/* Filter Bar */}
                    <ReviewFilterBar
                        total={questions.length}
                        correct={correctCount}
                        incorrect={incorrectCount}
                        bookmarked={bookmarkedCount}
                        unattempted={unattemptedCount}
                        activeFilter={reviewFilter}
                        onFilterChange={setReviewFilter}
                    />

                    <div className="grid gap-6">
                        {filteredQuestions.map((item) => {
                            const { question: q, originalIndex: idx, isCorrect, isBookmarked } = item;
                            const wasMarkedForReview = markedForReview[idx];
                            
                            return (
                                <div key={idx} className={clsx("card border-l-[6px] p-6 bg-cyber-dark/50 relative", isCorrect ? "border-l-cyber-success" : "border-l-cyber-danger")}>
                                    {/* Badges */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {wasMarkedForReview && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-bold">
                                                <Flag size={12} className="fill-amber-400" /> Reviewed
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isBookmarked) {
                                                    const bmk = bookmarks.items.find(
                                                        b => b.type === 'question' && 
                                                             b.referenceId === q.id && 
                                                             (selectedModule ? b.moduleId === selectedModule : true)
                                                    );
                                                    if (bmk) {
                                                        removeBookmark(bmk.id);
                                                        toast.success('Bookmark removed');
                                                    }
                                                } else {
                                                    addBookmark({
                                                        type: 'question',
                                                        referenceId: q.id,
                                                        moduleId: selectedModule,
                                                        tags: [],
                                                        content: {
                                                            question: q.question,
                                                            options: q.options,
                                                            correctAnswer: q.correctAnswer,
                                                            explanation: q.explanation,
                                                            snippet: q.snippet
                                                        }
                                                    });
                                                    toast.success('Question saved!');
                                                }
                                            }}
                                            className={clsx(
                                                "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all",
                                                isBookmarked
                                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                    : "bg-white/5 text-cyber-muted hover:bg-white/10 border border-white/10"
                                            )}
                                        >
                                            <Bookmark size={12} className={isBookmarked ? "fill-amber-400" : ""} />
                                            {isBookmarked ? 'Saved' : 'Save'}
                                        </button>
                                    </div>

                                     <div className="flex gap-6">
                                         <div className="mt-1 flex-shrink-0">
                                            {isCorrect ? <CheckCircle className="text-cyber-success" size={32} /> : <XCircle className="text-cyber-danger" size={32} />}
                                         </div>
                                         <div className="space-y-4 flex-1 pr-24">
                                             <div className="flex items-center gap-3 text-xs text-cyber-muted">
                                                 <span className="font-mono">Q{idx + 1}</span>
                                                 <span className={clsx(
                                                     "px-2 py-0.5 rounded",
                                                     q.type === 'OUTPUT' ? "bg-purple-500/20 text-purple-400" :
                                                     q.type === 'DEBUGGING' ? "bg-orange-500/20 text-orange-400" :
                                                     "bg-blue-500/20 text-blue-400"
                                                 )}>{q.type}</span>
                                             </div>
                                             <h3 className="font-medium text-xl text-white leading-relaxed">{q.question}</h3>
                                             
                                             {/* Code Snippet in Review */}
                                             {q.snippet && (
                                                <div className="relative my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
                                                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                                                        <span className="text-xs font-mono text-cyber-muted uppercase tracking-wider">
                                                            Code Context
                                                        </span>
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                                                        </div>
                                                    </div>
                                                    <pre className="p-6 text-sm md:text-base font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-words">
                                                        <code>{
                                                            // Process escaped characters in snippet
                                                            q.snippet
                                                                .replace(/\\n/g, '\n')
                                                                .replace(/\\t/g, '\t')
                                                                .replace(/\\"/g, '"')
                                                        }</code>
                                                    </pre>
                                                </div>
                                             )}
                                             
                                             {/* Display all options */}
                                             <div className="space-y-3 mt-4">
                                                 {q.options.map((opt: string, optIdx: number) => {
                                                     const isUserAnswer = answers[idx] === optIdx;
                                                     const isCorrectAnswer = q.correctAnswer === optIdx;
                                                     
                                                     let borderColor = "border-white/10";
                                                     let bgColor = "bg-cyber-black/40";
                                                     let textColor = "text-cyber-text";
                                                     let icon = null;
                                                     
                                                     if (isCorrectAnswer) {
                                                         borderColor = "border-cyber-success/50";
                                                         bgColor = "bg-cyber-success/10";
                                                         textColor = "text-cyber-success";
                                                         icon = <CheckCircle size={18} className="text-cyber-success" />;
                                                     } else if (isUserAnswer && !isCorrectAnswer) {
                                                         borderColor = "border-cyber-danger/50";
                                                         bgColor = "bg-cyber-danger/10";
                                                         textColor = "text-cyber-danger";
                                                         icon = <XCircle size={18} className="text-cyber-danger" />;
                                                     }
                                                     
                                                     return (
                                                         <div
                                                             key={optIdx}
                                                             className={clsx(
                                                                 "p-4 rounded-lg border-2 flex items-start gap-3 transition-all",
                                                                 borderColor,
                                                                 bgColor
                                                             )}
                                                         >
                                                             <div className={clsx(
                                                                 "w-7 h-7 rounded flex-shrink-0 flex items-center justify-center font-bold text-xs border-2",
                                                                 isCorrectAnswer ? "border-cyber-success bg-cyber-success text-cyber-black" :
                                                                 isUserAnswer ? "border-cyber-danger bg-cyber-danger text-white" :
                                                                 "border-white/20 text-cyber-muted"
                                                             )}>
                                                                 {String.fromCharCode(65 + optIdx)}
                                                             </div>
                                                             <span className={clsx("flex-1 text-sm", textColor)}>{opt}</span>
                                                             {icon && <div className="flex-shrink-0">{icon}</div>}
                                                             <div className="flex items-center gap-2">
                                                                 {isUserAnswer && (
                                                                     <span className={clsx(
                                                                         "text-xs font-mono px-2 py-0.5 rounded border",
                                                                         isCorrectAnswer 
                                                                             ? "text-cyber-success bg-cyber-success/10 border-cyber-success/50 font-bold" 
                                                                             : "text-cyber-danger bg-cyber-danger/10 border-cyber-danger/50 font-bold"
                                                                     )}>YOUR CHOICE</span>
                                                                 )}
                                                                 {isCorrectAnswer && (
                                                                     <span className="text-xs font-mono text-cyber-success bg-cyber-success/10 px-2 py-0.5 rounded border border-cyber-success/50 font-bold">CORRECT</span>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                             
                                             {q.explanation && (
                                                 <div className={clsx(
                                                     "bg-cyber-black/50 p-6 rounded-lg border border-white/5 text-sm space-y-3 mt-4 relative overflow-hidden",
                                                 )}>
                                                     <div className={clsx(
                                                         "absolute top-0 left-0 w-1 h-full",
                                                         isCorrect ? "bg-cyber-success" : "bg-cyber-accent"
                                                     )}></div>
                                                     <div className={clsx(
                                                         "flex items-center gap-2 font-bold uppercase tracking-wider",
                                                         isCorrect ? "text-cyber-success" : "text-cyber-accent"
                                                     )}>
                                                         <AlertOctagon size={16} /> Tactical Analysis
                                                     </div>
                                                     <div className="text-cyber-text leading-relaxed">
                                                         <ReactMarkdown components={{
                                                             p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                                             code: ({children}) => <code className={clsx(
                                                                 "bg-white/10 px-1 py-0.5 rounded font-mono text-xs",
                                                                 isCorrect ? "text-cyber-success" : "text-cyber-accent"
                                                             )}>{children}</code>
                                                         }}>{q.explanation}</ReactMarkdown>
                                                     </div>
                                                     {q.trapType && (
                                                         <div className="inline-block px-2 py-1 bg-cyber-accent/10 rounded text-cyber-accent text-xs font-mono border border-cyber-accent/20">
                                                            TRAP IDENTIFIED: {q.trapType}
                                                         </div>
                                                     )}
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredQuestions.length === 0 && (
                        <div className="text-center py-16 text-cyber-muted">
                            <p className="text-lg">No questions match the selected filter.</p>
                            <button
                                onClick={() => setReviewFilter('all')}
                                className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                            >
                                Show All Questions
                            </button>
                        </div>
                    )}

                     <div className="flex justify-center pt-8 pb-20">
                        <button onClick={() => { clearMock(); setShowResult(false); setReviewFilter('all'); }} className="px-8 py-4 bg-white text-cyber-black font-black rounded hover:bg-gray-200 uppercase tracking-widest shadow-xl transform transition-all hover:-translate-y-1">
                            Re-Initialize War Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

