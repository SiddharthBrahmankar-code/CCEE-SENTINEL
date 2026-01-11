import { useState, useEffect } from 'react';
import { notesApi, modulesApi, mockApi } from '../api';
import { useChatContextStore } from '../store/chatContextStore';
import { useGlobalStore } from '../store/GlobalStore';
import { toast } from 'sonner';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Table as TableIcon, Terminal, Shield, Target, Skull, Crosshair, CheckCircle, BookOpen } from 'lucide-react';

interface NoteData {
  topic: string;
  orientation: {
    examinerIntent: string;
    primaryTrap: string;
    secondaryTrap: string;
    failurePattern: string;
    timeToMaster: string;
  };
  absoluteFacts: string[];
  assumptions: { assumption: string; reality: string }[];
  trapZones: { trap: string; why: string; reality: string; cceeQuestion: string; eliminationLogic: string }[];
  internalMechanism: string[];
  codeTricks: { concept: string; snippet: string; behavior: string; whyFail: string; memoryHook: string }[];
  binaryTables: { title: string; headers: string[]; rows: string[][] }[];
  killShots: string[];
  checkpoint: string[];
}

interface Module {
  id: string;
  name: string;
  topics: string[];
}

export const NotesPage = () => {
    const [modules, setModules] = useState<Module[]>([]);
    const [topics, setTopics] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('BRIEFING');
    const [loading, setLoading] = useState(false);

    // Global Store
    const { 
        addNoteToCache, 
        getNoteFromCache,
        notes: { selectedModule: savedModule, selectedTopic: savedTopic },
        setNotesSelection
    } = useGlobalStore();

    // Local State (Synced with Store)
    const [selectedModule, setSelectedModule] = useState(savedModule || '');
    const [selectedTopic, setSelectedTopic] = useState(savedTopic || '');

    // MCQ State
    const [revealedAnswers, setRevealedAnswers] = useState<Record<string, number>>({});
    
    // Store Actions
    const { 
        addMcqToCache, 
        getMcqFromCache,
        refreshNoteTimestamp,
        refreshMcqTimestamp
    } = useGlobalStore();

    const cachedMcq = selectedModule && selectedTopic 
        ? getMcqFromCache(`${selectedModule}:${selectedTopic}`) 
        : undefined;

    useEffect(() => {
        setRevealedAnswers({});
        if (selectedModule && selectedTopic) {
            const key = `${selectedModule}:${selectedTopic}`;
            refreshNoteTimestamp(key);
            refreshMcqTimestamp(key);
        }
    }, [selectedTopic, selectedModule, refreshNoteTimestamp, refreshMcqTimestamp]);

    // Auto-generate MCQs when tab is opened
    // Auto-generate MCQs removed (now handled in main generation flow)

    // Sync changes to Global Store
    useEffect(() => {
        setNotesSelection(selectedModule, selectedTopic);
    }, [selectedModule, selectedTopic, setNotesSelection]);

    // Derived State (Instant Load from Cache)
    const cachedNote = selectedModule && selectedTopic 
        ? getNoteFromCache(`${selectedModule}:${selectedTopic}`) 
        : undefined;
    const notes = cachedNote ? (cachedNote.data as NoteData) : null;
    
    // Chat Context
    const { setContext, clearContext } = useChatContextStore();

    useEffect(() => {
        if (notes) {
            setContext(`Notes on ${selectedTopic} (${selectedModule})`, notes);
        }
        return () => clearContext(); // Cleanup on unmount
    }, [notes, selectedTopic, selectedModule]);

    useEffect(() => {
        modulesApi.getAll().then(res => setModules(res.data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedModule) {
            const module = modules.find(m => m.id === selectedModule);
            setTopics(module?.topics || []);
            // Don't auto-clear topic if it exists in new module (unlikely but safe)
            if (module && !module.topics.includes(selectedTopic)) {
                setSelectedTopic('');
            }
        }
    }, [selectedModule, modules]);

    // 3-Cache Prefetch: Generate notes & MCQs for next 2 topics IN PARALLEL
    useEffect(() => {
        if (!selectedModule || !selectedTopic || topics.length === 0) return;
        
        const currentIdx = topics.indexOf(selectedTopic);
        if (currentIdx === -1) return;
        
        // Get next 2 topics to prefetch
        const next2Topics = topics.slice(currentIdx + 1, currentIdx + 3);
        if (next2Topics.length === 0) return;
        
        console.log(`🚀 [3-Cache] Prefetching ${next2Topics.length} topics in PARALLEL:`, next2Topics);
        
        // Parallel prefetch for all targets
        Promise.all(next2Topics.map(async (nextTopic) => {
            const key = `${selectedModule}:${nextTopic}`;
            const promises: Promise<void>[] = [];
            
            // Prefetch note if not cached
            if (!getNoteFromCache(key)) {
                console.log(`📝 [Prefetch] Note: ${nextTopic}`);
                promises.push(
                    notesApi.generate(selectedModule, nextTopic)
                        .then(res => { addNoteToCache(key, res.data); console.log(`✅ Cached Note: ${nextTopic}`); })
                        .catch(e => console.warn(`⚠️ Note prefetch failed: ${nextTopic}`, e))
                );
            }
            
            // Prefetch MCQ if not cached (using topic-specific generator)
            if (!getMcqFromCache(key)) {
                console.log(`📝 [Prefetch] MCQ: ${nextTopic}`);
                promises.push(
                    mockApi.generateForTopic(selectedModule, nextTopic, 5)
                        .then(res => { addMcqToCache(key, res.data); console.log(`✅ Cached MCQ: ${nextTopic}`); })
                        .catch(e => console.warn(`⚠️ MCQ prefetch failed: ${nextTopic}`, e))
                );
            }
            
            return Promise.all(promises);
        })).then(() => console.log('✨ [3-Cache] Prefetch complete'));
    }, [selectedModule, selectedTopic, topics, getNoteFromCache, addNoteToCache, getMcqFromCache, addMcqToCache]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule || !selectedTopic) return;
        
        const key = `${selectedModule}:${selectedTopic}`;
        
        // Check Cache
        const hasNote = getNoteFromCache(key);
        const hasMcq = getMcqFromCache(key);

        if (hasNote && hasMcq) {
            console.log(`⚡ Instant Load from Cache: ${selectedTopic}`);
            setActiveTab('BRIEFING');
            return;
        }

        setLoading(true);
        // We might need to load both or just one
        const promises = [];

        if (!hasNote) {
            promises.push(notesApi.generate(selectedModule, selectedTopic)
                .then(res => addNoteToCache(key, res.data)));
        }

        if (!hasMcq) {
            // Generate topic-specific MCQs (not full module)
            promises.push(mockApi.generateForTopic(selectedModule, selectedTopic, 5)
                .then(res => addMcqToCache(key, res.data)));
        }

        try {
            await Promise.all(promises);
            setActiveTab('BRIEFING');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate content.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-8 min-h-screen md:h-screen flex flex-col">
            <header className="border-b border-white/10 pb-4 md:pb-6 shrink-0">
                <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-2">
                    CCEE <span className="text-cyber-danger">SENTINEL</span>
                </h1>
                <p className="text-cyber-muted font-mono text-xs md:text-base">EXAM INTELLIGENCE ENGINE // CACHED & PREDICTIVE</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 flex-1 md:overflow-hidden">
                {/* Input Form */}
                <div className="space-y-6">
                    <form onSubmit={handleGenerate} className="card bg-cyber-dark/50 space-y-4">
                        <div>
                            <label className="block text-sm font-mono text-cyber-muted mb-2">MODULE</label>
                            <select 
                                value={selectedModule}
                                onChange={e => setSelectedModule(e.target.value)}
                                className="w-full bg-cyber-black border border-white/10 rounded p-3 text-white focus:border-cyber-primary outline-none transition-colors"
                                required
                            >
                                <option value="">Select Module...</option>
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-mono text-cyber-muted mb-2">TOPIC</label>
                            <select 
                                value={selectedTopic}
                                onChange={e => setSelectedTopic(e.target.value)}
                                className="w-full bg-cyber-black border border-white/10 rounded p-3 text-white focus:border-cyber-primary outline-none transition-colors"
                                disabled={!selectedModule}
                                required
                            >
                                <option value="">Select Topic...</option>
                                {topics.map(t => (
                                    <option key={t} value={t}>
                                        {t} {getNoteFromCache(`${selectedModule}:${t}`) ? '⚡' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !selectedModule || !selectedTopic}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" /> : <Shield size={18} />}
                            {loading ? 'ANALYZING...' : 'INITIATE SENTINEL'}
                        </button>
                    </form>
                </div>

                {/* Notes Display */}
                <div className="md:col-span-2 h-full overflow-hidden flex flex-col">
                    {notes && (
                        <motion.div 
                            key={selectedTopic} // Trigger animation on topic change
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-cyber-dark/30 rounded-lg border border-white/5 h-full flex flex-col"
                        >
                            {/* Tabs */}
                            <div className="flex border-b border-white/10 bg-black/20 shrink-0 overflow-x-auto">
                                {[
                                    { id: 'BRIEFING', icon: Target }, 
                                    { id: 'CODE & INTERNALS', icon: Terminal }, 
                                    { id: 'TRAP ZONES', icon: Skull }, 
                                    { id: 'KILL SHOTS', icon: Crosshair },
                                    { id: 'PRACTICE MCQ', icon: BookOpen }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-4 text-sm font-bold tracking-wider transition-all border-b-2 hover:bg-white/5",
                                            activeTab === tab.id 
                                                ? "border-cyber-danger text-cyber-danger bg-cyber-danger/5" 
                                                : "border-transparent text-cyber-muted hover:text-white"
                                        )}
                                    >
                                        <tab.icon size={16} />
                                        {tab.id}
                                    </button>
                                ))}
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                
                                {/* TAB 1: BRIEFING */}
                                {activeTab === 'BRIEFING' && (
                                    <div className="space-y-8">
                                        {/* Orientation Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-cyber-primary/10 p-4 rounded border border-cyber-primary/20">
                                                <div className="text-xs font-mono text-cyber-primary mb-1">EXAMINER INTENT</div>
                                                <div className="text-sm text-white font-medium">{notes.orientation.examinerIntent}</div>
                                            </div>
                                            <div className="bg-cyber-danger/10 p-4 rounded border border-cyber-danger/20">
                                                <div className="text-xs font-mono text-cyber-danger mb-1">PRIMARY TRAP</div>
                                                <div className="text-sm text-white font-medium">{notes.orientation.primaryTrap}</div>
                                            </div>
                                            <div className="bg-yellow-500/10 p-4 rounded border border-yellow-500/20">
                                                <div className="text-xs font-mono text-yellow-500 mb-1">FAILURE PATTERN</div>
                                                <div className="text-sm text-white font-medium">{notes.orientation.failurePattern}</div>
                                            </div>
                                            <div className="bg-blue-500/10 p-4 rounded border border-blue-500/20">
                                                <div className="text-xs font-mono text-blue-500 mb-1">TIME TO MASTER</div>
                                                <div className="text-sm text-white font-medium">{notes.orientation.timeToMaster}</div>
                                            </div>
                                        </div>

                                        {/* Absolute Facts */}
                                        <section>
                                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                                                <CheckCircle className="text-cyber-success" /> ABSOLUTE EXAM FACTS
                                            </h3>
                                            <ul className="space-y-3">
                                                {notes.absoluteFacts.map((fact, i) => (
                                                    <li key={i} className="flex gap-3 text-lg text-cyber-text bg-black/20 p-3 rounded">
                                                        <span className="text-cyber-success font-bold">✔</span> {fact}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>

                                        {/* Assumptions vs Reality */}
                                        <section>
                                            <h3 className="text-xl font-black text-white mb-4">FALSE ASSUMPTIONS</h3>
                                            <div className="grid gap-4">
                                                {notes.assumptions.map((item, i) => (
                                                    <div key={i} className="p-4 bg-white/5 rounded border-l-4 border-cyber-danger">
                                                        <div className="flex gap-2 text-cyber-danger mb-1 font-mono text-sm">
                                                            <Skull size={14} /> ASSUMPTION
                                                        </div>
                                                        <p className="text-cyber-muted mb-3 line-through">{item.assumption}</p>
                                                        <div className="flex gap-2 text-cyber-success mb-1 font-mono text-sm">
                                                            <CheckCircle size={14} /> REALITY
                                                        </div>
                                                        <p className="text-white font-bold">{item.reality}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {/* TAB 2: TRAP ZONES */}
                                {activeTab === 'TRAP ZONES' && (
                                    <div className="space-y-6">
                                        {notes.trapZones.map((trap, i) => (
                                            <div key={i} className="bg-cyber-dark border border-cyber-danger/30 rounded-lg overflow-hidden">
                                                <div className="bg-cyber-danger/10 p-4 border-b border-cyber-danger/20 flex justify-between items-center">
                                                    <div className="text-cyber-danger font-black text-lg flex items-center gap-2">
                                                        <AlertTriangle /> {trap.trap}
                                                    </div>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div>
                                                            <div className="text-xs text-cyber-muted font-mono mb-1">WHY IT FOOLS STUDENTS</div>
                                                            <p className="text-white">{trap.why}</p>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-cyber-success font-mono mb-1">REALITY</div>
                                                            <p className="text-white font-bold">{trap.reality}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/30 p-4 rounded border border-white/5">
                                                        <div className="text-xs text-yellow-500 font-mono mb-1">CCEE QUESTION FORM</div>
                                                        <p className="text-cyber-text italic">"{trap.cceeQuestion}"</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-cyber-primary bg-cyber-primary/5 p-2 rounded">
                                                        <Target size={14} />
                                                        <span className="font-mono">ELIMINATION LOGIC:</span> {trap.eliminationLogic}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* TAB 3: CODE & INTERNALS */}
                                {activeTab === 'CODE & INTERNALS' && (
                                    <div className="space-y-8">
                                        {/* Internal Mechanism */}
                                        <div className="bg-blue-900/10 border border-blue-500/20 p-6 rounded-lg">
                                            <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                                                <Zap /> INTERNAL MECHANISM
                                            </h3>
                                            <ul className="list-disc list-inside space-y-2 text-blue-100">
                                                {notes.internalMechanism.map((mech, i) => (
                                                    <li key={i}>{mech}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Code Tricks */}
                                        {notes.codeTricks.map((trick, i) => (
                                            <div key={i} className="card bg-[#0d1117] border border-white/10 overflow-hidden">
                                                <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                                                    <span className="text-xs font-mono text-cyber-accent uppercase tracking-wider">{trick.concept}</span>
                                                    <span className="text-xs text-cyber-danger font-bold">TRICK SNIPPET</span>
                                                </div>
                                                <pre className="p-4 whitespace-pre-wrap break-words text-sm font-mono text-cyber-text bg-black/50">
                                                    <code>{trick.snippet}</code>
                                                </pre>
                                                <div className="p-4 border-t border-white/10 bg-white/5 grid gap-2">
                                                    <div className="flex gap-2">
                                                        <span className="text-cyber-success font-bold text-sm">▶ OUTPUT:</span>
                                                        <span className="text-white font-mono text-sm">{trick.behavior}</span>
                                                    </div>
                                                    <div className="text-sm text-cyber-muted">
                                                        <span className="text-cyber-danger font-bold">☠ FAILURE:</span> {trick.whyFail}
                                                    </div>
                                                    <div className="text-xs font-mono text-yellow-500 mt-1 border-t border-white/5 pt-2">
                                                        💡 MEMORY HOOK: {trick.memoryHook}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Binary Tables */}
                                        {notes.binaryTables.map((table, i) => (
                                             <section key={i} className="space-y-2">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <TableIcon size={16} className="text-cyber-accent" /> {table.title}
                                                </h3>
                                                <div className="overflow-x-auto rounded border border-white/10">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-cyber-panel text-cyber-muted text-sm uppercase">
                                                                {table.headers.map((h, k) => <th key={k} className="p-3 border-b border-white/10">{h}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-cyber-dark">
                                                            {table.rows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5">
                                                                    {row.map((cell, cIdx) => <td key={cIdx} className="p-3 text-sm text-cyber-text">{cell}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}

                                {/* TAB 4: KILL SHOTS */}
                                {activeTab === 'KILL SHOTS' && (
                                    <div className="space-y-8">
                                        <div className="grid gap-3">
                                            {notes.killShots.map((shot, i) => (
                                                <div key={i} className="bg-red-500/10 border-l-4 border-red-500 p-4 flex items-center gap-4 text-white font-bold text-lg">
                                                    <Crosshair className="text-red-500 shrink-0" />
                                                    {shot}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-cyber-success/10 border border-cyber-success/30 rounded p-6">
                                            <h3 className="text-cyber-success font-black text-xl mb-4 flex items-center gap-2">
                                                <CheckCircle /> EXAM READY CHECKPOINT
                                            </h3>
                                            <ul className="space-y-3">
                                                {notes.checkpoint.map((pt, i) => (
                                                    <li key={i} className="flex gap-3 text-cyber-text">
                                                        <div className="w-5 h-5 rounded border border-cyber-success/50 flex items-center justify-center shrink-0">
                                                            <div className="w-3 h-3 bg-cyber-success rounded-full" />
                                                        </div>
                                                        {pt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: PRACTICE MCQ */}
                                {activeTab === 'PRACTICE MCQ' && (
                                    <div className="space-y-6">
                                        {!cachedMcq ? (
                                            <div className="text-center p-12 text-cyber-muted border border-dashed border-white/10 rounded-lg">
                                                Click "INITIATE SENTINEL" or reload to generate content.
                                            </div>
                                        ) : (
                                            cachedMcq.map((q, i) => (
                                                <div key={q.id} className="bg-cyber-dark border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors">
                                                    <div className="flex gap-4 mb-4">
                                                        <span className="text-cyber-primary font-mono font-bold shrink-0">Q{i + 1}.</span>
                                                        <p className="text-lg text-white font-medium">{q.question}</p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-10">
                                                        {q.options.map((opt, optIdx) => {
                                                            const isRevealed = revealedAnswers[q.id] !== undefined;
                                                            const isSelected = revealedAnswers[q.id] === optIdx;
                                                            const isCorrect = q.correctAnswer === optIdx;
                                                            
                                                            let  btnClass = "border-white/10 hover:bg-white/5 text-cyber-text";
                                                            if (isRevealed) {
                                                                if (isCorrect) btnClass = "border-cyber-success bg-cyber-success/10 text-cyber-success font-bold";
                                                                else if (isSelected) btnClass = "border-cyber-danger bg-cyber-danger/10 text-cyber-danger";
                                                                else btnClass = "border-white/5 opacity-40";
                                                            }

                                                            return (
                                                                <button
                                                                    key={optIdx}
                                                                    onClick={() => {
                                                                        if (!isRevealed) {
                                                                            setRevealedAnswers(prev => ({...prev, [q.id]: optIdx}));
                                                                        }
                                                                    }}
                                                                    disabled={isRevealed}
                                                                    className={clsx("text-left p-3 rounded border transition-all flex items-start", btnClass)}
                                                                >
                                                                    <span className="font-mono mr-2 opacity-70">{String.fromCharCode(65 + optIdx)}.</span>
                                                                    <span>{opt}</span>
                                                                    {isRevealed && isCorrect && <CheckCircle size={16} className="ml-auto shrink-0" />}
                                                                    {isRevealed && isSelected && !isCorrect && <AlertTriangle size={16} className="ml-auto shrink-0" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {revealedAnswers[q.id] !== undefined && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="mt-4 pl-10"
                                                        >
                                                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded text-sm text-blue-200 flex gap-3">
                                                                <BookOpen className="shrink-0 text-blue-400" size={18} />
                                                                <div>
                                                                    <span className="font-bold text-blue-400 block mb-1">EXPLANATION</span>
                                                                    {q.explanation}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
