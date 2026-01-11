import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Download, Loader2, Code, Maximize2 } from 'lucide-react';
import mermaid from 'mermaid';

export default function ImageGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        darkMode: true,
        background: '#1F2937',
        primaryColor: '#3B82F6',
        primaryTextColor: '#F3F4F6',
        primaryBorderColor: '#60A5FA',
        lineColor: '#60A5FA',
        secondaryColor: '#8B5CF6',
        tertiaryColor: '#EC4899',
        fontSize: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }
    });
  }, []);

  // Render diagram when modal opens
  useEffect(() => {
    const renderDiagram = async () => {
      if (showModal && mermaidCode && diagramRef.current) {
        try {
          // Small delay to ensure modal DOM is fully mounted
          await new Promise(resolve => setTimeout(resolve, 100));
          
          diagramRef.current.innerHTML = '';
          const { svg } = await mermaid.render('diagram-' + Date.now(), mermaidCode);
          diagramRef.current.innerHTML = svg;
        } catch (err) {
          console.error('Mermaid render error:', err);
          setError('Failed to render diagram');
        }
      }
    };
    renderDiagram();
  }, [showModal, mermaidCode]);

  const generateDiagram = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { generateAIContent } = await import('../services/aiCommon');
      
      const diagramPrompt = `You are a CCEE exam mentor. Generate a Mermaid.js diagram for: "${prompt}".
      
      CRITICAL RULES:
      1. Output ONLY Mermaid code.
      2. NO markdown formatting, NO backticks.
      3. NO explanations.
      4. Start with "graph TD" or "sequenceDiagram" followed by a NEWLINE.
      5. Use simple labels, no special chars like () [] {} unless part of syntax.
      `;

      // Use unified AI service: Tries Window.ai -> Falls back to /chat
      const { data } = await generateAIContent(diagramPrompt, undefined, '/chat');
      
      let cleanCode = (data as string).trim();
      // Extra cleanup just in case
      cleanCode = cleanCode
        .replace(/```mermaid\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // FIX: Comprehensive Mermaid code formatting
      // 1. Ensure newline after graph definition (handles 'graph TDroot...' -> 'graph TD\nroot...')
      cleanCode = cleanCode.replace(/^(graph\s*(?:TD|LR|RL|TB|BT))\s*([^\n\s])/i, '$1\n    $2');
      
      // 2. Insert newlines before arrow operators (-->, --->, --, .->)
      cleanCode = cleanCode.replace(/(\]|\)|\w)(-->|---|->|\.->)/g, '$1\n    $2');
      
      // 3. Insert newlines after arrow targets before next node
      cleanCode = cleanCode.replace(/(-->|---|->|\.->) *(\w+)(\[|\()/g, '$1 $2$3');
      cleanCode = cleanCode.replace(/(\]|\))([A-Za-z_])/g, '$1\n    $2');
      
      // 4. Fix sequenceDiagram without newline
      if (cleanCode.startsWith('sequenceDiagram') && !cleanCode.match(/sequenceDiagram\s*\n/)) {
        cleanCode = cleanCode.replace(/^sequenceDiagram\s*/, 'sequenceDiagram\n    ');
      }
      
      // 5. Insert newlines before participant, actor, Note, loop, alt, etc.
      cleanCode = cleanCode.replace(/([^\n])(participant|actor|Note|loop|alt|else|end|rect)/g, '$1\n    $2');
      
      console.log('📊 Cleaned Mermaid code:', cleanCode.substring(0, 200) + '...');

      if (cleanCode) {
          setMermaidCode(cleanCode);
          setShowModal(true);
      } else {
          throw new Error('Empty response from AI');
      }

    } catch (err: any) {
      console.error('Diagram generation failed:', err);
      setError('Failed to generate diagram. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const downloadDiagram = () => {
    if (!diagramRef.current) return;
    
    const svg = diagramRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `diagram-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group"
        title="Generate Technical Diagram"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Compact Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Diagram Generator</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Binary search flowchart'"
              className="w-full h-20 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              disabled={loading}
            />

            <button
              onClick={generateDiagram}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Success - View Button */}
          {mermaidCode && !showModal && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 w-full bg-purple-600/20 text-purple-400 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              View Diagram
            </button>
          )}

          {/* Powered by */}
          <p className="mt-3 text-[10px] text-gray-500 text-center">
            Mermaid.js + AI
          </p>
        </div>
      )}

      {/* Diagram Modal */}
      {showModal && mermaidCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Generated Diagram</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadDiagram}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Diagram Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-900">
              <div ref={diagramRef} className="flex items-center justify-center min-h-full" />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setMermaidCode(null);
                  setShowModal(false);
                }}
                className="bg-purple-600/20 text-purple-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600/30 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                New Diagram
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
