
import { tryPuter, cleanJson } from './aiCommon';

export const notesService = {
  generateNote: async (moduleId: string, topic: string) => {
    try {
        return await tryPuter("stub", cleanJson);
    } catch (e) {
        return {
            content: `# ${topic}\n\n## Overview\nThis is a **offline demo note** generated because the AI brain is currently on the server.\n\n## Key Concepts\n- **Concept A**: The definition of A.\n- **Concept B**: The definition of B.\n\n\`\`\`javascript\nconsole.log("Hello Mobile");\n\`\`\`\n\n## Summary\nMobile requires a different architecture for AI generation. In the future, this will connect to a cloud API.`
        };
    }
  },
};
