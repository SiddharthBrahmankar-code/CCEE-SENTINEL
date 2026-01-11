
import { tryPuter, cleanJson } from './aiCommon';
import { modulesApi } from './systemService';

export const mockService = {
  generateMock: async (moduleId: string, mode: 'PRACTICE' | 'CCEE') => {
    // 1. Fetch Context (Topics)
    let topicsList = "General Module Concepts";
    try {
        const topicsRes = await modulesApi.getTopics(moduleId);
        if (topicsRes.data && (Array.isArray(topicsRes.data) || Array.isArray(topicsRes.data.topics))) {
            const raw = Array.isArray(topicsRes.data) ? topicsRes.data : topicsRes.data.topics;
            topicsList = raw.join(', ');
        }
    } catch (e) {
        console.warn("⚠️ Failed to fetch topics for mock, using default.", e);
    }

    // Stub for Mobile with Fallback
    try {
        return await tryPuter("stub", cleanJson);
    } catch (e) {
        // Fallback for Demo
        return [
            { id: '1', question: 'Which functionality ensures specific code execution just before a component unmounts?', options: ['useEffect return function', 'componentWillMount', 'useState lazy init', 'useLayoutEffect'], correctAnswer: 0, snippet: "useEffect(() => {\n  return () => { ... }\n}, [])" },
            { id: '2', question: 'What is the primary difference between useMemo and useCallback?', options: ['useMemo caches value, useCallback caches function', 'useMemo is for side effects', 'useCallback is deprecated', 'They are identical'], correctAnswer: 0 },
            { id: '3', question: 'In React Native, which component replaces the HTML <div>?', options: ['<View>', '<Container>', '<Box>', '<Div>'], correctAnswer: 0 },
            { id: '4', question: 'How do you handle side effects in Redux?', options: ['Reducers', 'Middleware (Thunks/Sagas)', 'Actions', 'State'], correctAnswer: 1 },
            { id: '5', question: 'Which hook allows you to access the context API?', options: ['useContext', 'useProvider', 'useConnect', 'useGlobal'], correctAnswer: 0 }
        ];
    }
  },
};

export const practiceMcqApi = {
  generate: async (moduleId: string, topic: string) => {
    return tryPuter("stub", cleanJson);
  },
};
