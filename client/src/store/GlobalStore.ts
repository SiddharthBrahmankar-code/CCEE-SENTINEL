import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define types for our state
export interface NoteContent {
  topic: string;
  data: any; // The robust JSON structure
  timestamp: number;
}

// Define shared types
export interface Question {
  id: string;
  question: string;
  snippet?: string; // New separate field for code
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
  markedForReview: Record<number, boolean>; // Track questions marked for review
  reviewBookmarks: string[]; // Bookmarked question IDs during answer review
  isGenerating: boolean;
  generationProgress: number; // 0-100 real progress
  generationStage: 'init' | 'topics' | 'generating' | 'finalizing' | 'done';
  moduleId: string | null;
  mode: 'PRACTICE' | 'CCEE'; // Persist mode
  startTime: number | null; // For persistent timer
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
  // NEW: Store actual content for display on bookmarks page
  content?: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    explanation?: string;
    snippet?: string;
  };
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
  easeFactor: number; // 2.5 default
  interval: number; // days
  repetitions: number;
  nextReview: number; // timestamp
  lastReviewed: number;
}

export interface SpacedRepetitionState {
  progress: Record<string, FlashcardProgress>;
}

export interface StudyPlanState {
  currentPlan: any | null; // StudyPlan type from studyPlanGenerator
  lastGenerated: number;
}

interface GlobalState {
  // Notes Caching
  notesCache: Record<string, NoteContent>; // Key: "moduleId:topic"
  addNoteToCache: (key: string, content: any) => void;
  getNoteFromCache: (key: string) => NoteContent | undefined;
  refreshNoteTimestamp: (key: string) => void;

  // MCQ Cache
  mcqCache: Record<string, Question[]>; // Key: "moduleId:topic"
  addMcqToCache: (key: string, questions: Question[]) => void;
  getMcqFromCache: (key: string) => Question[] | undefined;
  refreshMcqTimestamp: (key: string) => void;

  // Mock Persistence
  mock: MockState;
  setMockGenerating: (isGen: boolean) => void;
  updateMockGenerationProgress: (progress: number, stage: MockState['generationStage']) => void;
  setMockData: (moduleId: string, questions: Question[]) => void;
  updateMockProgress: (index: number, answers: Record<string, number>) => void;
  setMockSelection: (moduleId: string, mode: 'PRACTICE' | 'CCEE') => void;
  toggleMarkForReview: (index: number) => void;
  toggleReviewBookmark: (questionId: string) => void;
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
      // --- Notes Cache ---
      notesCache: {},
      addNoteToCache: (key, content) => set((state) => {
        // Eviction Policy: Keep max 3 topics per module
        const [moduleId] = key.split(':');
        const cache = { ...state.notesCache };
        
        // Find keys belonging to this module
        const moduleKeys = Object.keys(cache).filter(k => k.startsWith(moduleId + ':'));
        
        // If adding a NEW key and we are at limit
        if (!cache[key] && moduleKeys.length >= 5) {
            // Sort by timestamp (Oldest first)
            moduleKeys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            // Delete oldest(s) until we have space (keep 4, add 1 = 5)
            while (moduleKeys.length >= 5) {
                const oldest = moduleKeys.shift();
                console.log(`🗑️ Evicting Note: ${oldest}`);
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
      // Stored as { questions: Question[], timestamp: number } or Check for legacy Question[]
      mcqCache: {},
      addMcqToCache: (key, questions) => set((state) => {
         const [moduleId] = key.split(':');
         const cache: any = { ...state.mcqCache };
         
         // Normalize cache entries for checking (handle legacy arrays)
         const moduleKeys = Object.keys(cache).filter(k => k.startsWith(moduleId + ':'));

         if (!cache[key] && moduleKeys.length >= 5) {
             moduleKeys.sort((a, b) => {
                 const tsA = Array.isArray(cache[a]) ? 0 : cache[a].timestamp;
                 const tsB = Array.isArray(cache[b]) ? 0 : cache[b].timestamp;
                 return tsA - tsB;
             });
             while (moduleKeys.length >= 5) {
                 const oldest = moduleKeys.shift();
                 console.log(`🗑️ Evicting MCQ: ${oldest}`);
                 if (oldest) delete cache[oldest];
             }
         }

         cache[key] = { questions, timestamp: Date.now() };
         return { mcqCache: cache };
      }),
      getMcqFromCache: (key) => {
          const val: any = get().mcqCache[key];
          if (!val) return undefined;
          // Handle legacy array storage
          if (Array.isArray(val)) return val;
          return val.questions;
      },
      refreshMcqTimestamp: (key) => set((state) => {
        const cache: any = { ...state.mcqCache };
        if (cache[key]) {
             if (Array.isArray(cache[key])) return {}; // Can't update legacy without migrate
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
        markedForReview: {},
        reviewBookmarks: [],
        isGenerating: false,
        generationProgress: 0,
        generationStage: 'init' as const,
        moduleId: null,
        mode: 'PRACTICE',
        startTime: null,
      },
      setMockSelection: (moduleId, mode) => set((state) => ({
        mock: { ...state.mock, moduleId, mode }
      })),
      setMockGenerating: (isGenerating) => set((state) => ({
        mock: { ...state.mock, isGenerating, generationProgress: isGenerating ? 0 : state.mock.generationProgress, generationStage: isGenerating ? 'init' : state.mock.generationStage }
      })),
      updateMockGenerationProgress: (progress, stage) => set((state) => ({
        mock: { ...state.mock, generationProgress: progress, generationStage: stage }
      })),
      setMockData: (moduleId, questions) => set((state) => ({
        mock: { 
            questions, 
            currentQuestionIndex: 0, 
            answers: {}, 
            markedForReview: {},
            reviewBookmarks: [],
            isGenerating: false,
            generationProgress: 100,
            generationStage: 'done',
            moduleId,
            mode: state.mock.mode,
            startTime: Date.now() 
        }
      })),
      updateMockProgress: (currentQuestionIndex, answers) => set((state) => ({
        mock: { ...state.mock, currentQuestionIndex, answers }
      })),
      toggleMarkForReview: (index) => set((state) => ({
        mock: { 
          ...state.mock, 
          markedForReview: { 
            ...state.mock.markedForReview, 
            [index]: !state.mock.markedForReview[index] 
          } 
        }
      })),
      toggleReviewBookmark: (questionId) => set((state) => {
        const current = state.mock.reviewBookmarks;
        const exists = current.includes(questionId);
        return {
          mock: {
            ...state.mock,
            reviewBookmarks: exists 
              ? current.filter(id => id !== questionId)
              : [...current, questionId]
          }
        };
      }),
      clearMock: () => set({
        mock: { questions: [], currentQuestionIndex: 0, answers: {}, markedForReview: {}, reviewBookmarks: [], isGenerating: false, generationProgress: 0, generationStage: 'init', moduleId: null, mode: 'PRACTICE', startTime: null }
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
      name: 'ccee-global-storage', // unique name
      partialize: (state) => ({ 
          // Persist everything so it survives reload
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
          // Force generation flags to false on hydrate
          state.setMockGenerating(false);
          state.setFlashcardsGenerating(false);
        }
      }
    }
  )
);
