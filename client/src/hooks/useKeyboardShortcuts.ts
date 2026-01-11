import { useHotkeys } from 'react-hotkeys-hook';


interface UseKeyboardShortcutsProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: (index: number) => void;
  onQuit?: () => void;
  onFlip?: () => void;
  onBookmark?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onNext,
  onPrevious,
  onSelect,
  onQuit,
  onFlip,
  onBookmark,
  enabled = true,
}: UseKeyboardShortcutsProps) => {
  // Navigation shortcuts
  useHotkeys('n', () => onNext?.(), { enabled: enabled && !!onNext }, [onNext]);
  useHotkeys('p', () => onPrevious?.(), { enabled: enabled && !!onPrevious }, [onPrevious]);
  useHotkeys('q', () => onQuit?.(), { enabled: enabled && !!onQuit }, [onQuit]);
  useHotkeys('b', () => onBookmark?.(), { enabled: enabled && !!onBookmark }, [onBookmark]);
  
  // Flashcard flip
  useHotkeys('space', () => onFlip?.(), { enabled: enabled && !!onFlip }, [onFlip]);
  
  // Option selection (1-4)
  useHotkeys('1', () => onSelect?.(0), { enabled: enabled && !!onSelect }, [onSelect]);
  useHotkeys('2', () => onSelect?.(1), { enabled: enabled && !!onSelect }, [onSelect]);
  useHotkeys('3', () => onSelect?.(2), { enabled: enabled && !!onSelect }, [onSelect]);
  useHotkeys('4', () => onSelect?.(3), { enabled: enabled && !!onSelect }, [onSelect]);
  
  // Arrow keys for flashcards
  useHotkeys('ArrowRight', () => onNext?.(), { enabled: enabled && !!onNext }, [onNext]);
  useHotkeys('ArrowLeft', () => onPrevious?.(), { enabled: enabled && !!onPrevious }, [onPrevious]);
};
