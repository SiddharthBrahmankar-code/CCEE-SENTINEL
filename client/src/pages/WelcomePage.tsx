import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Crosshair, Target, ChevronRight, Lock } from 'lucide-react';
import clsx from 'clsx';

export const WelcomePage = () => {
    const navigate = useNavigate();

    const options = [
        {
            title: "SENTINEL NOTES",
            description: "Generate high-yield trap notes. Detect examiner intent.",
            icon: Shield,
            path: "/notes",
            color: "text-cyber-primary",
            bg: "bg-cyber-primary/10",
            border: "border-cyber-primary/20",
            hover: "hover:border-cyber-primary",
            locked: false
        },
        {
            title: "MOCK WARGAME",
            description: "Test your survival skills. Negative marking protocols active.",
            icon: Crosshair,
            path: "/mock",
            color: "text-cyber-danger",
            bg: "bg-cyber-danger/10",
            border: "border-cyber-danger/20",
            hover: "hover:border-cyber-danger",
            locked: false
        },
        {
            title: "SYLLABUS RADAR",
            description: "Analyze enemy territory. Map exam boundaries.",
            icon: Target,
            path: "/syllabus",
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
            hover: "hover:border-yellow-500",
            locked: false
        }
    ];

    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-danger/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="max-w-5xl w-full z-10 space-y-16">
                <header className="text-center space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white mb-2">
                            CCEE <span className="text-cyber-danger relative inline-block">
                                SENTINEL
                                <span className="absolute -top-4 -right-8 text-xs font-mono text-cyber-muted opacity-50 tracking-widest">V.2.0</span>
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-cyber-muted font-mono tracking-widest uppercase">
                            Exam Intelligence Engine
                        </p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {options.map((opt, idx) => (
                        <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            onClick={() => !opt.locked && navigate(opt.path)}
                            disabled={opt.locked}
                            className={clsx(
                                "group text-left p-8 rounded-xl border-2 transition-all relative overflow-hidden h-full flex flex-col justify-between",
                                opt.bg, opt.border, 
                                opt.locked ? "opacity-50 cursor-not-allowed" : `${opt.hover} hover:scale-[1.02] hover:shadow-2xl`
                            )}
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <opt.icon size={48} className={opt.color} />
                                    {opt.locked ? (
                                        <Lock size={20} className="text-cyber-muted" />
                                    ) : (
                                        <ChevronRight size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-wide">{opt.title}</h3>
                                    <p className="text-cyber-text font-medium leading-relaxed">{opt.description}</p>
                                </div>
                            </div>
                            
                            {!opt.locked && (
                                <div className={`absolute bottom-0 left-0 w-full h-1 ${opt.color.replace('text-', 'bg-')} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
                            )}
                        </motion.button>
                    ))}
                </div>

                <motion.footer 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center border-t border-white/5 pt-8"
                >
                    <p className="text-cyber-muted font-mono text-xs tracking-[0.2em] uppercase">
                        Authorized Personnel Only // CDAC Entrance Protocol
                    </p>
                </motion.footer>
            </div>
        </div>
    );
}
