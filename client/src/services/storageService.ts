
interface MockResult {
    moduleId: string;
    score: number;
    total: number;
    date: string;
}

interface FlashcardStats {
    totalCards: number;
    correct: number;
}

const KEYS = {
    MOCKS: 'ccee_sentinel_mocks',
    FLASHCARDS: 'ccee_sentinel_flashcards'
};

export const storageService = {
    saveMockResult: (result: MockResult) => {
        const existing = JSON.parse(localStorage.getItem(KEYS.MOCKS) || '[]');
        localStorage.setItem(KEYS.MOCKS, JSON.stringify([...existing, result]));
    },

    getMockResults: (): MockResult[] => {
        return JSON.parse(localStorage.getItem(KEYS.MOCKS) || '[]');
    },

    updateFlashcardStats: (count: number, correct: number) => {
        const current = JSON.parse(localStorage.getItem(KEYS.FLASHCARDS) || '{"totalCards": 0, "correct": 0}');
        const updated = {
            totalCards: current.totalCards + count,
            correct: current.correct + correct
        };
        localStorage.setItem(KEYS.FLASHCARDS, JSON.stringify(updated));
    },

    getFlashcardStats: (): FlashcardStats => {
        return JSON.parse(localStorage.getItem(KEYS.FLASHCARDS) || '{"totalCards": 0, "correct": 0}');
    }
};
