import { useEffect, useState } from 'react';
import { pyqApi } from '../api';
import { FileText, AlertTriangle, Zap, BarChart3, Binary } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { toast } from 'sonner';

interface PYQData {
  examYear: string;
  totalQuestions: number;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  trapTopics: string[];
  repeatedThemes: string[];
  questionDistribution: {
    codeOutput: number;
    theory: number;
    debugging: number;
  };
}

export const PYQPage = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [data, setData] = useState<PYQData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        pyqApi.getFiles().then(res => setFiles(res.data)).catch(console.error);
    }, []);

    const handleAnalyze = async (file: string) => {
        setLoading(true);
        setSelectedFile(file);
        try {
            const res = await pyqApi.analyze(file);
            setData(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="border-b border-white/10 pb-6">
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                    PYQ <span className="text-cyber-accent">ANALYSIS</span>
                </h1>
                <p className="text-cyber-muted">Extract hidden patterns and Identify high-risk trap zones.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* File List */}
                <div className="space-y-4">
                     <h3 className="text-cyber-muted font-mono text-sm uppercase tracking-widest">Past Papers</h3>
                     <div className="space-y-2">
                        {files.map(file => (
                            <button
                                key={file}
                                onClick={() => handleAnalyze(file)}
                                disabled={loading}
                                className={clsx(
                                    "w-full text-left p-3 rounded border transition-all flex items-center gap-3",
                                    selectedFile === file
                                        ? "bg-cyber-accent/10 border-cyber-accent text-cyber-accent shadow-neon-purple"
                                        : "bg-cyber-panel border-white/5 text-cyber-text hover:bg-cyber-panel/80 hover:border-white/20"
                                )}
                            >
                                <FileText size={18} />
                                <span className="truncate font-mono text-sm">{file}</span>
                                {loading && selectedFile === file && <div className="animate-spin ml-auto h-4 w-4 border-2 border-cyber-accent border-t-transparent rounded-full" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Analysis Dashboard */}
                <div className="md:col-span-3">
                    {!data && !loading && (
                        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-cyber-muted">
                            <BarChart3 size={48} className="mb-4 opacity-50" />
                            <p>Select a paper to run AI pattern extraction</p>
                        </div>
                    )}

                    {data && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Overview Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="card border-l-4 border-l-cyber-primary">
                                    <div className="text-cyber-muted text-xs uppercase tracking-widest mb-1">Difficulty</div>
                                    <div className="text-2xl font-black text-white">{data.difficultyLevel}</div>
                                </div>
                                <div className="card border-l-4 border-l-cyber-accent">
                                    <div className="text-cyber-muted text-xs uppercase tracking-widest mb-1">Total Questions</div>
                                    <div className="text-2xl font-black text-white">{data.totalQuestions}</div>
                                </div>
                                <div className="card border-l-4 border-l-cyber-danger">
                                    <div className="text-cyber-muted text-xs uppercase tracking-widest mb-1">Exam Year</div>
                                    <div className="text-2xl font-black text-white">{data.examYear}</div>
                                </div>
                            </div>

                            {/* Trap Zones */}
                            <div className="card border-cyber-danger/30 bg-cyber-danger/5">
                                <h3 className="text-cyber-danger font-bold flex items-center gap-2 mb-4">
                                    <AlertTriangle size={20} />
                                    Risk Analysis: Trap Zones
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {data.trapTopics.map((topic, i) => (
                                        <span key={i} className="px-3 py-1 bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger rounded-full text-sm font-semibold">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Distribution */}
                                <div className="card">
                                    <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                                        <Binary size={20} className="text-cyber-primary" />
                                        Question Distribution
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-cyber-muted">Code Outputs</span>
                                            <span className="font-mono text-white">{data.questionDistribution.codeOutput}%</span>
                                        </div>
                                        <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden">
                                            <div style={{ width: `${data.questionDistribution.codeOutput}%` }} className="h-full bg-cyber-primary" />
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-cyber-muted">Theory & Concepts</span>
                                            <span className="font-mono text-white">{data.questionDistribution.theory}%</span>
                                        </div>
                                         <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden">
                                            <div style={{ width: `${data.questionDistribution.theory}%` }} className="h-full bg-cyber-accent" />
                                        </div>
                                        
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-cyber-muted">Debugging</span>
                                            <span className="font-mono text-white">{data.questionDistribution.debugging}%</span>
                                        </div>
                                         <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden">
                                            <div style={{ width: `${data.questionDistribution.debugging}%` }} className="h-full bg-cyber-success" />
                                        </div>
                                    </div>
                                </div>

                                {/* Repeated Themes */}
                                <div className="card">
                                    <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                                        <Zap size={20} className="text-yellow-400" />
                                        High Frequency Themes
                                    </h3>
                                    <ul className="space-y-2">
                                        {data.repeatedThemes.map((theme, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-cyber-text">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                                {theme}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
