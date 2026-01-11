import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { chatApi } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useChatContextStore } from '../store/chatContextStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your CCEE Study Companion. Ask me anything about Java, C++, OS, or the syllabus!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Global Context Store
  const { currentPageTitle, pageContent, setChatOpen } = useChatContextStore();

  useEffect(() => {
    setChatOpen(isOpen);
  }, [isOpen, setChatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
      
      // Pass the current page context to the AI
      const res = await chatApi.sendMessage(input, history, { 
        title: currentPageTitle, 
        content: pageContent 
      });
      
      const botMsg: Message = { role: 'assistant', content: res.data.response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { role: 'assistant', content: "Sorry, I'm having trouble connecting to the mainframe. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start text-left">
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={clsx(
                        "mb-4 transition-all duration-300 relative",
                        isMinimized ? "w-72 h-14" : "w-80 md:w-96 h-[500px]"
                    )}
                    style={{
                        background: 'linear-gradient(135deg, rgba(8, 8, 15, 0.85) 0%, rgba(18, 18, 26, 0.75) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 240, 255, 0.15)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 240, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}
                >
                    {/* Glass highlight effect */}
                    <div 
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
                            borderRadius: '16px'
                        }}
                    />

                    {/* Header */}
                    <div 
                        className="relative p-4 flex items-center justify-between cursor-pointer"
                        style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(0, 240, 255, 0.03)'
                        }}
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }} />
                             <h3 className="text-white font-bold text-sm tracking-wider">SENTINEL AI</h3>
                        </div>
                        <div className="flex items-center gap-2 text-cyber-muted">
                            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="hover:text-white transition-colors p-1 rounded hover:bg-white/10">
                                <Minimize2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:text-cyber-danger transition-colors p-1 rounded hover:bg-cyber-danger/10">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    {!isMinimized && (
                        <>
                            <div 
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                                style={{ height: 'calc(100% - 130px)' }}
                            >
                                {messages.map((msg, i) => (
                                    <div key={i} className={clsx("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                            msg.role === 'user' 
                                                ? "bg-cyber-primary/20 text-cyber-primary" 
                                                : "bg-amber-500/10 text-amber-400"
                                        )}
                                        style={{ boxShadow: msg.role === 'user' ? '0 0 10px rgba(0, 240, 255, 0.2)' : '0 0 10px rgba(251, 191, 36, 0.1)' }}
                                        >
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>

                                    <div 
                                        className={clsx(
                                            "max-w-[85%] rounded-xl p-3 text-sm leading-relaxed overflow-hidden",
                                            msg.role === 'user' 
                                                ? "text-white" 
                                                : "text-gray-200"
                                        )}
                                        style={{
                                            background: msg.role === 'user' 
                                                ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.05) 100%)' 
                                                : 'rgba(255, 255, 255, 0.03)',
                                            border: msg.role === 'user' 
                                                ? '1px solid rgba(0, 240, 255, 0.25)' 
                                                : '1px solid rgba(255, 255, 255, 0.08)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    >
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Style code blocks
                                                code({node, inline, className, children, ...props}: any) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    return !inline ? (
                                                        <div className="relative my-2 rounded-lg overflow-hidden border border-white/10 bg-[#0d1117]">
                                                            <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/5">
                                                                <span className="text-xs font-mono text-cyber-muted lowercase">
                                                                    {match ? match[1] : 'code'}
                                                                </span>
                                                            </div>
                                                            <pre className="p-3 overflow-x-auto text-xs font-mono text-blue-200 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                                                <code className={className} {...props}>
                                                                    {children}
                                                                </code>
                                                            </pre>
                                                        </div>
                                                    ) : (
                                                        <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyber-primary font-mono text-xs" {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                },
                                                // Style lists
                                                ul: ({children}) => <ul className="list-disc list-outside ml-4 space-y-1 my-2">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2">{children}</ol>,
                                                li: ({children}) => <li className="pl-1">{children}</li>,
                                                // Style headers
                                                h1: ({children}) => <h1 className="text-lg font-bold text-white my-2 pb-1 border-b border-white/10">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-base font-bold text-white my-2">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-sm font-bold text-white my-1">{children}</h3>,
                                                // Style paragraphs
                                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                                // Style links
                                                a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyber-primary hover:underline">{children}</a>,
                                                blockquote: ({children}) => <blockquote className="border-l-2 border-cyber-primary pl-3 my-2 text-cyber-muted italic">{children}</blockquote>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                            <Bot size={14} />
                                        </div>
                                        <div 
                                            className="rounded-xl p-3 flex items-center gap-2"
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)'
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-1.5 h-1.5 bg-cyber-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div 
                                className="absolute bottom-0 left-0 right-0 p-4"
                                style={{
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '0 0 16px 16px'
                                }}
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask a doubt..."
                                        className="w-full rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none placeholder:text-gray-500"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyber-primary hover:bg-cyber-primary/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        style={{ boxShadow: input.trim() ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none' }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Toggle Button */}
        {!isOpen && (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                data-testid="chat-widget-toggle"
                className="w-14 h-14 rounded-full flex items-center justify-center text-cyber-black"
                style={{
                    background: 'linear-gradient(135deg, #00f0ff 0%, #00d4e5 100%)',
                    boxShadow: '0 4px 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(0, 240, 255, 0.2)'
                }}
            >
                <MessageSquare size={24} strokeWidth={2.5} />
            </motion.button>
        )}
    </div>
  );
};
