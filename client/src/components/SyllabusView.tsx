import  {useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, AlertTriangle, Crosshair, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface QuickLook {
  important_concepts: string[];
  exam_focus: string[];
  common_traps: string[];
}

export interface SessionData {
  session: string;
  topics: string[];
  quick_advanced_look: QuickLook;
}

export interface SyllabusData {
  subject_id: string;
  subject_name: string;
  syllabus: SessionData[];
}

interface SyllabusViewProps {
  data: SyllabusData;
}

const SessionCard = ({ session, index }: { session: SessionData; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40 hover:bg-white/5 transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={clsx(
            "h-8 w-8 rounded-full flex items-center justify-center font-mono text-sm font-bold border",
            isOpen ? "bg-yellow-500 text-black border-yellow-500" : "bg-cyber-dark text-cyber-muted border-white/20"
          )}>
            {index + 1}
          </div>
          <div className="text-left">
            <div className="text-xs text-cyber-muted font-mono tracking-widest">{session.session.toUpperCase()}</div>
            <div className="text-white font-medium truncate max-w-md">{session.topics[0]} {session.topics.length > 1 && `+ ${session.topics.length - 1} more`}</div>
          </div>
        </div>
        {isOpen ? <ChevronUp className="text-yellow-500" /> : <ChevronDown className="text-cyber-muted" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-black/60"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Topics List */}
              <div>
                <h4 className="flex items-center gap-2 text-yellow-500 font-mono text-xs mb-3 tracking-widest">
                  <BookOpen size={14} /> COVERAGE
                </h4>
                <ul className="space-y-2">
                  {session.topics.map((topic, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 bg-cyber-primary rounded-full shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Advanced Look */}
              <div className="space-y-6">
                 {/* Concepts */}
                 <div>
                    <h4 className="flex items-center gap-2 text-cyber-primary font-mono text-xs mb-2 tracking-widest">
                       <Zap size={14} /> CORE CONCEPTS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {session.quick_advanced_look.important_concepts.map((item, i) => (
                           <span key={i} className="px-2 py-1 bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-primary/80 text-xs rounded">
                               {item}
                           </span>
                       ))}
                    </div>
                 </div>

                 {/* Exam Focus */}
                 <div>
                    <h4 className="flex items-center gap-2 text-green-400 font-mono text-xs mb-2 tracking-widest">
                       <Crosshair size={14} /> EXAM FOCUS
                    </h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                        {session.quick_advanced_look.exam_focus.map((item, i) => (
                            <li key={i}>• {item}</li>
                        ))}
                    </ul>
                 </div>

                 {/* Traps */}
                 <div>
                    <h4 className="flex items-center gap-2 text-red-500 font-mono text-xs mb-2 tracking-widest">
                       <AlertTriangle size={14} /> TRAPS
                    </h4>
                    <ul className="text-xs text-red-400/70 space-y-1">
                        {session.quick_advanced_look.common_traps.map((item, i) => (
                            <li key={i}>• {item}</li>
                        ))}
                    </ul>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SyllabusView = ({ data }: SyllabusViewProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-6">
        <div>
           <div className="text-cyber-muted font-mono text-xs mb-1">PROGRAM ID: {data.subject_id}</div>
           <h2 className="text-3xl font-black text-white tracking-tight leading-none">{data.subject_name}</h2>
        </div>
        <div className="text-right hidden md:block">
            <div className="text-4xl font-bold text-cyber-text/20">{data.syllabus.length}</div>
            <div className="text-xs text-cyber-muted font-mono">SESSIONS</div>
        </div>
      </div>
      
      <div className="space-y-3">
        {data.syllabus.map((session, idx) => (
          <SessionCard key={idx} session={session} index={idx} />
        ))}
      </div>
    </div>
  );
};
