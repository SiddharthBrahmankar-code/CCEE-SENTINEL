import { Bookmark as BookmarkIcon } from 'lucide-react';
import { useGlobalStore } from '../store/GlobalStore';
import { toast } from 'sonner';
import clsx from 'clsx';

interface BookmarkButtonProps {
  type: 'question' | 'note' | 'flashcard';
  referenceId: string;
  moduleId?: string;
  className?: string;
  // NEW: Pass actual content for storage and display
  content?: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    snippet?: string;
  };
}

export const BookmarkButton = ({ type, referenceId, moduleId, className, content }: BookmarkButtonProps) => {
  const { bookmarks, addBookmark, removeBookmark } = useGlobalStore();
  
  const isBookmarked = bookmarks.items.some(
    b => b.type === type && 
         b.referenceId === referenceId && 
         (moduleId ? b.moduleId === moduleId : true)
  );

  const handleToggle = () => {
    if (isBookmarked) {
      const bookmark = bookmarks.items.find(
        b => b.type === type && 
             b.referenceId === referenceId && 
             (moduleId ? b.moduleId === moduleId : true)
      );
      if (bookmark) {
        removeBookmark(bookmark.id);
        toast.success('Bookmark removed');
      }
    } else {
      addBookmark({
        type,
        referenceId,
        moduleId,
        tags: [],
        content, // Store the actual content
      });
      toast.success('Bookmarked!');
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      className={clsx(
        "p-2 rounded transition-all",
        isBookmarked
          ? "bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/30"
          : "text-cyber-muted hover:text-white hover:bg-white/5",
        className
      )}
      title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <BookmarkIcon
        size={20}
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
      />
    </button>
  );
};
