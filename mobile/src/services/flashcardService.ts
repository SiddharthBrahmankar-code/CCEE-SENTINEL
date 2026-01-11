import { tryPuter, cleanJson } from './aiCommon';

export const flashcardService = {
  generate: async (moduleId: string, topic: string) => {
    try {
        return await tryPuter(
            `Generate 5 flashcards for "${topic}" (${moduleId}) in JSON format: { "flashcards": [{ "type": "concept", "front": "question", "back": "answer" }] }. Strictly valid JSON object. No Markdown blocks.`,
            cleanJson
        );
    } catch (e) {
        return {
            flashcards: [
                { type: 'concept', front: 'Virtual DOM', back: 'A lightweight copy of the real DOM that React uses to optimize updates.' },
                { type: 'concept', front: 'Hoisting', back: 'JavaScript behavior where variable and function declarations are moved to the top of their scope.' },
                { type: 'concept', front: 'Closure', back: 'A function that has access to its outer function scope even after the outer function has returned.' },
                { type: 'concept', front: 'Promise', back: 'An object representing the eventual completion or failure of an asynchronous operation.' },
                { type: 'concept', front: 'Flexbox', back: 'A layout model that allows elements to align and distribute space within a container.' }
            ]
        };
    }
  },
};
