
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types (Same as Web)
export interface NoteContent {
  topic: string;
  data: any;
  timestamp: number;
}

export interface Question {
  id: string;
  question: string;
  snippet?: string;
  options: string[];
  correctAnswer: number;
  type: 'CONCEPTUAL' | 'OUTPUT' | 'DEBUGGING';
  explanation: string;
  trapType?: string;
}

export interface MockState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  isGenerating: boolean;
  moduleId: string | null;
  mode: 'PRACTICE' | 'CCEE';
  startTime: number | null;
}

export interface FlashcardState {
  cards: any[];
  currentIndex: number;
  isGenerating: boolean;
  moduleId: string | null;
  selectedTopic: string | null;
  score: number;
}

export interface NotesState {
  selectedModule: string | null;
  selectedTopic: string | null;
}

export interface SyllabusState {
  selectedFile: string | null;
  data: any | null;
}

export interface Bookmark {
  id: string;
  type: 'question' | 'note' | 'flashcard';
  referenceId: string;
  moduleId?: string;
  userNote?: string;
  timestamp: number;
  tags: string[];
}

export interface BookmarkState {
  items: Bookmark[];
}

export interface MockAttempt {
  id: string;
  moduleId: string;
  mode: 'PRACTICE' | 'CCEE';
  questions: Question[];
  answers: Record<string, number>;
  score: number;
  total: number;
  timeSpent: number;
  completedAt: number;
}

export interface HistoryState {
  attempts: MockAttempt[];
}

export interface FlashcardProgress {
  cardId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReviewed: number;
}

export interface SpacedRepetitionState {
  progress: Record<string, FlashcardProgress>;
}

export interface StudyPlanState {
  currentPlan: any | null;
  lastGenerated: number;
}

interface GlobalState {
  // Notes Caching
  notesCache: Record<string, NoteContent>;
  addNoteToCache: (key: string, content: any) => void;
  getNoteFromCache: (key: string) => NoteContent | undefined;
  refreshNoteTimestamp: (key: string) => void;

  // MCQ Cache
  mcqCache: Record<string, Question[]>;
  addMcqToCache: (key: string, questions: Question[]) => void;
  getMcqFromCache: (key: string) => Question[] | undefined;
  refreshMcqTimestamp: (key: string) => void;

  // Mock Persistence
  mock: MockState;
  setMockGenerating: (isGen: boolean) => void;
  setMockData: (moduleId: string, questions: Question[]) => void;
  updateMockProgress: (index: number, answers: Record<string, number>) => void;
  setMockSelection: (moduleId: string, mode: 'PRACTICE' | 'CCEE') => void;
  clearMock: () => void;

  // Flashcard Persistence
  flashcards: FlashcardState;
  setFlashcardsGenerating: (isGen: boolean) => void;
  setFlashcardData: (moduleId: string, cards: any[]) => void;
  updateFlashcardIndex: (index: number) => void;
  updateFlashcardScore: (score: number) => void;
  setFlashcardSelection: (moduleId: string, topic: string) => void;

  // Notes View Persistence
  notes: NotesState;
  setNotesSelection: (moduleId: string | null, topic: string | null) => void;

  // Syllabus Persistence
  syllabus: SyllabusState;
  setSyllabusData: (file: string, data: any) => void;

  // Bookmarks
  bookmarks: BookmarkState;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'timestamp'>) => void;
  removeBookmark: (id: string) => void;
  getBookmarksByType: (type: Bookmark['type']) => Bookmark[];

  // Mock History
  history: HistoryState;
  addMockAttempt: (attempt: Omit<MockAttempt, 'id'>) => void;
  getMockHistory: () => MockAttempt[];

  // Spaced Repetition
  spacedRepetition: SpacedRepetitionState;
  updateCardProgress: (cardId: string, quality: number) => void;
  getDueCards: () => string[];
  
  // Study Plan
  studyPlan: StudyPlanState;
  setStudyPlan: (plan: any) => void;
  clearStudyPlan: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      // --- Notes Cache ---
      notesCache: {},
      addNoteToCache: (key, content) => set((state) => {
        const [moduleId] = key.split(':');
        const cache = { ...state.notesCache };
        const moduleKeys = Object.keys(cache).filter(k => k.startsWith(moduleId + ':'));
        
        if (!cache[key] && moduleKeys.length >= 5) {
            moduleKeys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            while (moduleKeys.length >= 5) {
                const oldest = moduleKeys.shift();
                if (oldest) delete cache[oldest];
            }
        }
        
        cache[key] = { topic: key, data: content, timestamp: Date.now() };
        return { notesCache: cache };
      }),
      getNoteFromCache: (key) => get().notesCache[key],
      refreshNoteTimestamp: (key) => set((state) => {
        const cache = { ...state.notesCache };
        if (cache[key]) {
            cache[key] = { ...cache[key], timestamp: Date.now() };
            return { notesCache: cache };
        }
        return {};
      }),

      // --- MCQ Cache ---
      mcqCache: {},
      addMcqToCache: (key, questions) => set((state) => {
         const [moduleId] = key.split(':');
         const cache: any = { ...state.mcqCache };
         const moduleKeys = Object.keys(cache).filter(k => k.startsWith(moduleId + ':'));

         if (!cache[key] && moduleKeys.length >= 5) {
             moduleKeys.sort((a, b) => {
                 const tsA = Array.isArray(cache[a]) ? 0 : cache[a].timestamp;
                 const tsB = Array.isArray(cache[b]) ? 0 : cache[b].timestamp;
                 return tsA - tsB;
             });
             while (moduleKeys.length >= 5) {
                 const oldest = moduleKeys.shift();
                 if (oldest) delete cache[oldest];
             }
         }

         cache[key] = { questions, timestamp: Date.now() };
         return { mcqCache: cache };
      }),
      getMcqFromCache: (key) => {
          const val: any = get().mcqCache[key];
          if (!val) return undefined;
          if (Array.isArray(val)) return val;
          return val.questions;
      },
      refreshMcqTimestamp: (key) => set((state) => {
        const cache: any = { ...state.mcqCache };
        if (cache[key]) {
             if (Array.isArray(cache[key])) return {}; 
             cache[key] = { ...cache[key], timestamp: Date.now() };
             return { mcqCache: cache };
        }
        return {};
      }),

      // --- Mock State ---
      mock: {
        questions: [],
        currentQuestionIndex: 0,
        answers: {},
        isGenerating: false,
        moduleId: null,
        mode: 'PRACTICE',
        startTime: null,
      },
      setMockSelection: (moduleId, mode) => set((state) => ({
        mock: { ...state.mock, moduleId, mode }
      })),
      setMockGenerating: (isGenerating) => set((state) => ({
        mock: { ...state.mock, isGenerating }
      })),
      setMockData: (moduleId, questions) => set((state) => ({
        mock: { 
            questions, 
            currentQuestionIndex: 0, 
            answers: {}, 
            isGenerating: false, 
            moduleId,
            mode: state.mock.mode,
            startTime: Date.now() 
        }
      })),
      updateMockProgress: (currentQuestionIndex, answers) => set((state) => ({
        mock: { ...state.mock, currentQuestionIndex, answers }
      })),
      clearMock: () => set({
        mock: { questions: [], currentQuestionIndex: 0, answers: {}, isGenerating: false, moduleId: null, mode: 'PRACTICE', startTime: null }
      }),

      // --- Flashcard State ---
      flashcards: {
        cards: [],
        currentIndex: 0,
        isGenerating: false,
        moduleId: null,
        selectedTopic: null,
        score: 0
      },
      setFlashcardSelection: (moduleId, topic) => set((state) => ({
        flashcards: { ...state.flashcards, moduleId, selectedTopic: topic }
      })),
      setFlashcardsGenerating: (isGenerating) => set((state) => ({
        flashcards: { ...state.flashcards, isGenerating }
      })),
      setFlashcardData: (moduleId, cards) => set((state) => ({
        flashcards: { 
            cards, 
            currentIndex: 0, 
            isGenerating: false, 
            moduleId,
            selectedTopic: state.flashcards.selectedTopic,
            score: 0 
        }
      })),
      updateFlashcardIndex: (currentIndex) => set((state) => ({
        flashcards: { ...state.flashcards, currentIndex }
      })),
      updateFlashcardScore: (score) => set((state) => ({
          flashcards: { ...state.flashcards, score }
      })),

      // --- Notes State ---
      notes: { selectedModule: null, selectedTopic: null },
      setNotesSelection: (moduleId, topic) => set((state) => ({
        notes: { ...state.notes, selectedModule: moduleId, selectedTopic: topic }
      })),

      // --- Syllabus State ---
      syllabus: { selectedFile: null, data: null },
      setSyllabusData: (file, data) => set((state) => ({
        syllabus: { ...state.syllabus, selectedFile: file, data }
      })),

      // --- Bookmarks ---
      bookmarks: { items: [] },
      addBookmark: (bookmark) => set((state) => ({
        bookmarks: {
          items: [
            ...state.bookmarks.items,
            { ...bookmark, id: `bmk_${Date.now()}_${Math.random()}`, timestamp: Date.now() }
          ]
        }
      })),
      removeBookmark: (id) => set((state) => ({
        bookmarks: { items: state.bookmarks.items.filter(b => b.id !== id) }
      })),
      getBookmarksByType: (type) => get().bookmarks.items.filter(b => b.type === type),

      // --- Mock History ---
      history: { attempts: [] },
      addMockAttempt: (attempt) => set((state) => ({
        history: {
          attempts: [
            ...state.history.attempts,
            { ...attempt, id: `attempt_${Date.now()}_${Math.random()}` }
          ]
        }
      })),
      getMockHistory: () => get().history.attempts.sort((a, b) => b.completedAt - a.completedAt),

      // --- Spaced Repetition (SM-2 Algorithm) ---
      spacedRepetition: { progress: {} },
      updateCardProgress: (cardId, quality) => set((state) => {
        const now = Date.now();
        const existing = state.spacedRepetition.progress[cardId] || {
          cardId,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: now,
          lastReviewed: 0,
        };

        let newEaseFactor = existing.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (newEaseFactor < 1.3) newEaseFactor = 1.3;

        let newInterval = 0;
        let newRepetitions = existing.repetitions;

        if (quality < 3) {
          newRepetitions = 0;
          newInterval = 1;
        } else {
          if (existing.repetitions === 0) {
            newInterval = 1;
          } else if (existing.repetitions === 1) {
            newInterval = 6;
          } else {
            newInterval = Math.round(existing.interval * newEaseFactor);
          }
          newRepetitions = existing.repetitions + 1;
        }

        const nextReview = now + newInterval * 24 * 60 * 60 * 1000;

        return {
          spacedRepetition: {
            progress: {
              ...state.spacedRepetition.progress,
              [cardId]: {
                cardId,
                easeFactor: newEaseFactor,
                interval: newInterval,
                repetitions: newRepetitions,
                nextReview,
                lastReviewed: now,
              },
            },
          },
        };
      }),
      getDueCards: () => {
        const now = Date.now();
        return Object.values(get().spacedRepetition.progress)
          .filter(p => p.nextReview <= now)
          .map(p => p.cardId);
      },
      
      // --- Study Plan ---
      studyPlan: { currentPlan: null, lastGenerated: 0 },
      setStudyPlan: (plan) => set({ studyPlan: { currentPlan: plan, lastGenerated: Date.now() } }),
      clearStudyPlan: () => set({ studyPlan: { currentPlan: null, lastGenerated: 0 } }),
    }),
    {
      name: 'ccee-global-storage',
      storage: createJSONStorage(() => AsyncStorage), // Mobile adapter
      partialize: (state) => ({ 
          notesCache: state.notesCache,
          mcqCache: state.mcqCache,
          mock: state.mock,
          flashcards: state.flashcards,
          notes: state.notes,
          syllabus: state.syllabus,
          bookmarks: state.bookmarks,
          history: state.history,
          spacedRepetition: state.spacedRepetition,
          studyPlan: state.studyPlan 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setMockGenerating(false);
          state.setFlashcardsGenerating(false);
        }
      }
    }
  )
);
