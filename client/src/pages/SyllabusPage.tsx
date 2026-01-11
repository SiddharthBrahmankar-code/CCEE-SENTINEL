import { useEffect, useState } from 'react';
import { syllabusApi } from '../api';
import { FileText, Target, Scan, Lock} from 'lucide-react';
import clsx from 'clsx';
import { SyllabusView } from '../components/SyllabusView';
import { useGlobalStore } from '../store/GlobalStore';
import { toast } from 'sonner';

export const SyllabusPage = () => {
  const [files, setFiles] = useState<string[]>([]);
  const { syllabus: { selectedFile, data }, setSyllabusData } = useGlobalStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    syllabusApi.getFiles().then(res => setFiles(res.data)).catch(console.error);
  }, []);

  const handleParse = async (file: string) => {
    setLoading(true);
    setSyllabusData(file, null); // Clear previous data
    try {
      const res = await syllabusApi.parse(file);
      setSyllabusData(file, res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to decode syllabus protocols.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[calc(100vh-80px)] flex flex-col">
      <header className="border-b border-white/10 pb-6 shrink-0">
        <h1 className="text-4xl font-black tracking-tighter text-white mb-2 flex items-center gap-4">
           <Target className="text-yellow-500" size={40} />
           SYLLABUS <span className="text-yellow-500">RADAR</span>
        </h1>
        <p className="text-cyber-muted font-mono tracking-widest uppercase">TERRITORY MAPPING // DEEP SCAN</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 flex-1">
        {/* Sidebar: File List */}
        <div className="space-y-6">
          <div className="bg-cyber-dark/50 p-4 rounded border border-white/10">
              <h3 className="text-cyber-muted font-mono text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Scan size={14} /> Scan Targets
              </h3>
              <div className="space-y-2">
                {files.map(file => (
                  <button
                    key={file}
                    onClick={() => handleParse(file)}
                    disabled={loading}
                    className={clsx(
                      "w-full text-left p-4 rounded border transition-all flex items-center gap-3 relative overflow-hidden group",
                      selectedFile === file 
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-500/10" 
                        : "bg-cyber-black/40 border-white/5 text-cyber-text hover:bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <FileText size={18} className="shrink-0" />
                    <span className="truncate font-mono text-sm">{file.replace('.pdf', '')}</span>
                    {loading && selectedFile === file && <div className="animate-spin ml-auto h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />}
                  </button>
                ))}
                {files.length === 0 && (
                  <div className="text-center p-8 border border-dashed border-white/10 rounded text-cyber-muted">
                      <Lock className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs">NO INTEL FILES DETECTED</span>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Main Content: Parsed Tree */}
        <div className="md:col-span-3 h-full">
          {!data && !loading && (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-cyber-muted bg-cyber-dark/30 p-12 text-center">
              <Scan size={64} className="mb-6 opacity-20 text-yellow-500 animate-pulse" />
              <h3 className="text-xl font-bold text-white mb-2">AWAITING DEEP SCAN</h3>
              <p className="max-w-md opacity-70">Select a syllabus file to initiate expert-level curriculum analysis.</p>
            </div>
          )}
          
          {loading && !data && (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mb-4" />
                <div className="text-yellow-500 font-mono animate-pulse">ANALYZING SECTORS...</div>
            </div>
          )}

          {data && (
             <SyllabusView data={data} />
          )}
        </div>
      </div>
    </div>
  );
};
