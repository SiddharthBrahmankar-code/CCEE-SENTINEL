
import { generateAIContent, cleanJson } from './aiCommon';

const NOTES_PROMPT_TEMPLATE = (topic: string, moduleId: string) => `
You are a CCEE Exam Expert. Create STRATEGIC, CONCISE study notes for "${topic}" (Module: ${moduleId}).
Output STRICT JSON ONLY. No Markdown. 
CRITICAL: Keep descriptions brief and punchy. Avoid long paragraphs.
Follow this schema exactly:

{
  "topic": "${topic}",
  "orientation": {
    "examinerIntent": "string (Max 30 words)",
    "primaryTrap": "string (Max 30 words)",
    "secondaryTrap": "string",
    "failurePattern": "string",
    "timeToMaster": "string"
  },
  "absoluteFacts": ["string (fact 1, medium-concise)", "string (fact 2, medium-concise)"],
  "assumptions": [{ "assumption": "string", "reality": "string" }],
  "trapZones": [{ "trap": "string", "why": "string", "reality": "string", "cceeQuestion": "string", "eliminationLogic": "string" }],
  "internalMechanism": ["string (Brief explanation)"],
  "codeTricks": [{ "concept": "string", "snippet": "code string", "behavior": "string", "whyFail": "string", "memoryHook": "string" }],
  "binaryTables": [{ "title": "string", "headers": ["col1", "col2"], "rows": [["val1", "val2"]] }],
  "killShots": ["string (One-liner tips)"],
  "checkpoint": ["string"]
}
`;

export const notesApi = {
  // Single topic generation - unchanged
  generate: (moduleId: string, topic: string) => 
    generateAIContent(
      NOTES_PROMPT_TEMPLATE(topic, moduleId),
      cleanJson
    ),
  
  // NEW: Bulk parallel generation for multiple topics
  generateBulk: async (moduleId: string, topics: string[]) => {
    console.log(`🚀 Generating notes for ${topics.length} topics in PARALLEL`);
    
    // Helper to generate notes for a single topic
    const generateTopicNotes = async (topic: string, index: number) => {
      console.log(`🎯 Topic ${index + 1}/${topics.length}: "${topic}"`);
      
      try {
        const res = await generateAIContent(
          NOTES_PROMPT_TEMPLATE(topic, moduleId),
          cleanJson
        );
        console.log(`✅ Topic ${index + 1} complete: "${topic}"`);
        return { topic, data: res.data, success: true };
      } catch (error) {
        console.error(`❌ Topic ${index + 1} failed: "${topic}"`, error);
        return { topic, data: null, success: false };
      }
    };

    // Execute all topics in PARALLEL with staggered starts
    try {
      const topicPromises = topics.map((topic, index) =>
        new Promise(resolve =>
          setTimeout(() => resolve(generateTopicNotes(topic, index)), index * 300)
        )
      );

      const results = await Promise.all(topicPromises);
      const successCount = results.filter((r: any) => r.success).length;

      console.log(`✅ Bulk generation complete! ${successCount}/${topics.length} topics successful`);

      return results;
    } catch (error) {
      console.error('🚨 Bulk notes generation failed:', error);
      throw new Error('Failed to generate notes in bulk');
    }
  },
};
