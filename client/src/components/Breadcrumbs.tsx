import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  path: string;
}

const routeMap: Record<string, string> = {
  '/': 'Home',
  '/notes': 'AI Notes',
  '/mock': 'Mock Tests',
  '/mock/history': 'Test History',
  '/flashcards': 'Flashcards',
  '/syllabus': 'Syllabus Radar',
  '/analytics': 'Analytics',
  '/dashboard': 'Dashboard',
  '/pyq': 'PYQ Analysis',
  '/bookmarks': 'Bookmarks',
  '/progress': 'Progress',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbs: Breadcrumb[] = [
    { label: 'Home', path: '/' },
  ];

  pathnames.forEach((_, index) => {
    const path = '/' + pathnames.slice(0, index + 1).join('/');
    const label = routeMap[path] || path.split('/').pop() || '';
    breadcrumbs.push({ label, path });
  });

  return (
    <nav className="flex items-center gap-2 text-sm font-mono text-cyber-muted py-2">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-2">
          {index > 0 && <ChevronRight size={14} className="opacity-50" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-white font-semibold">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-cyber-primary transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
