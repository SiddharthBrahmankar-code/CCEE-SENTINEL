
// Main API Entry Point (Facade)
// Re-exports services for backward compatibility and centralized access

import api from './services/apiClient';

export { generateAIContent, cleanJson, waitForPuter, clearPuterCache } from './services/aiCommon';
export { modulesApi, analyticsApi } from './services/systemService';
export { notesApi } from './services/notesService';
export { mockApi } from './services/mockService';
export { flashcardApi } from './services/flashcardService';
export { syllabusApi, pyqApi } from './services/syllabusService';
export { chatApi } from './services/chatService';

// Default export for generic axios usage
export default api;
