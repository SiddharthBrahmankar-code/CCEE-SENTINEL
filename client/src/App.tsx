import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import { Breadcrumbs } from './components/Breadcrumbs';
import { PageSkeleton } from './components/Skeletons';
import { ThemeToggle } from './components/ThemeToggle';
import { NetworkStatus } from './components/NetworkStatus';
import { LayoutDashboard, BookOpen, Target, Zap, BarChart3, Calendar, Bookmark, TrendingUp } from 'lucide-react';
import '../src/styles/theme.css';

// Lazy load heavy components for faster initial load
const ChatWidget = lazy(() => import('./components/ChatWidget').then(m => ({ default: m.ChatWidget })));
const ImageGenerator = lazy(() => import('./components/ImageGenerator'));
const GlobalSearch = lazy(() => import('./components/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
const ShortcutHints = lazy(() => import('./components/ShortcutHints').then(m => ({ default: m.ShortcutHints })));

// Lazy load pages for code splitting
const SyllabusPage = lazy(() => import('./pages/SyllabusPage').then(m => ({ default: m.SyllabusPage })));
const PYQPage = lazy(() => import('./pages/PYQPage').then(m => ({ default: m.PYQPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })));
const MockPage = lazy(() => import('./pages/MockPage').then(m => ({ default: m.MockPage })));
const WelcomePage = lazy(() => import('./pages/WelcomePage').then(m => ({ default: m.WelcomePage })));
const FlashcardPage = lazy(() => import('./pages/FlashcardPage').then(m => ({ default: m.FlashcardPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));
const MockHistoryPage = lazy(() => import('./pages/MockHistoryPage').then(m => ({ default: m.MockHistoryPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const StudyPlanPage = lazy(() => import('./pages/StudyPlanPage').then(m => ({ default: m.StudyPlanPage })));

function App() {
  // Delay mounting heavy widgets until after initial render
  const [mountHeavyWidgets, setMountHeavyWidgets] = useState(false);
  
  useEffect(() => {
    // Mount heavy widgets after a short delay to prioritize initial paint
    const timer = setTimeout(() => setMountHeavyWidgets(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <ToastProvider />
      <ThemeToggle />
      <NetworkStatus />
      
      {/* Heavy widgets loaded after initial paint */}
      {mountHeavyWidgets && (
        <Suspense fallback={null}>
          <GlobalSearch />
          <ShortcutHints />
          <ChatWidget />
          <ImageGenerator />
        </Suspense>
      )}
      
      <div className="min-h-screen bg-cyber-black text-cyber-text selection:bg-cyber-primary/30 selection:text-white pb-20 md:pb-0">
        <nav className="border-b border-white/5 bg-cyber-panel/30 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-12">
            <Link to="/" className="font-black text-xl tracking-tighter text-white hover:opacity-80 transition-opacity">
              CCEE <span className="text-cyber-danger">SENTINEL</span>
            </Link>
            <div className="hidden md:flex gap-4">
              {[
                  { to: "/notes", label: "AI Notes" },
                  { to: "/mock", label: "Mock Tests" },
                  { to: "/flashcards", label: "Flashcards" },
                  { to: "/analytics", label: "Heatmap" },
                  { to: "/bookmarks", label: "Bookmarks" },
                  { to: "/progress", label: "Progress" },
                  { to: "/study-plan", label: "Study Plan" },
                  { to: "/dashboard", label: "Dashboard" }
              ].map(link => (
                <NavLink 
                    key={link.to}
                    to={link.to} 
                    className={({ isActive }) => 
                        `px-4 py-2 text-sm font-medium transition-colors ${
                            isActive ? 'nav-link-active' : 'text-cyber-muted hover:text-white'
                        }`
                    }
                >
                    {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-cyber-black/90 backdrop-blur-lg border-t border-white/10 z-50 overflow-x-auto">
          <div className="flex items-center h-full px-4 gap-6 min-w-max">
             {[
                  { to: "/dashboard", label: "Dash", icon: <LayoutDashboard size={20} /> },
                  { to: "/notes", label: "Notes", icon: <BookOpen size={20} /> },
                  { to: "/mock", label: "Mock", icon: <Target size={20} /> },
                  { to: "/flashcards", label: "Flash", icon: <Zap size={20} /> },
                  { to: "/analytics", label: "Stats", icon: <BarChart3 size={20} /> },
                  { to: "/study-plan", label: "Plan", icon: <Calendar size={20} /> },
                  { to: "/bookmarks", label: "Saved", icon: <Bookmark size={20} /> },
                  { to: "/progress", label: "Growth", icon: <TrendingUp size={20} /> },
              ].map(link => (
                <NavLink 
                    key={link.to}
                    to={link.to} 
                    className={({ isActive }) => 
                        `flex flex-col items-center justify-center gap-1 min-w-[60px] ${
                            isActive ? 'text-cyber-primary' : 'text-cyber-muted'
                        }`
                    }
                >
                    {({ isActive }: { isActive: boolean }) => (
                        <>
                            <div className={isActive ? "text-cyber-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" : ""}>
                                {link.icon}
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wider">{link.label}</span>
                        </>
                    )}
                </NavLink>
              ))}
          </div>
        </nav>
        
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-6">
          <Breadcrumbs />
        </div>
        
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>

            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/syllabus" element={<SyllabusPage />} />
              <Route path="/pyq" element={<PYQPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/mock" element={<MockPage />} />
              <Route path="/mock/history" element={<MockHistoryPage />} />
              <Route path="/flashcards" element={<FlashcardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/study-plan" element={<StudyPlanPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}

export default App;
