
import { generateAIContent, cleanJson } from './aiCommon';

export const flashcardApi = {
  // Single topic generation (5 cards) - unchanged
  generate: (moduleId: string, topic: string) => 
    generateAIContent(
      `Generate 5 flashcards for "${topic}" (${moduleId}) in JSON format: { "flashcards": [{ "type": "concept", "front": "question", "back": "answer" }] }. Strictly valid JSON object. No Markdown blocks.`,
      cleanJson
    ),
  
  // Full module generation with PARALLEL BATCHING
  generateFullModule: async (moduleId: string, topics: string[]) => {
    const TOTAL_CARDS = 15;
    const BATCH_SIZE = 5;
    const BATCHES = 3;
    
    console.log(`🚀 Generating ${TOTAL_CARDS} flashcards in ${BATCHES} parallel batches`);
    
    // Helper to generate a single batch
    const generateBatch = async (batchNumber: number) => {
      const topicSubset = topics.slice(
        Math.floor((batchNumber * topics.length) / BATCHES),
        Math.floor(((batchNumber + 1) * topics.length) / BATCHES)
      );
      
      console.log(`🎯 Batch ${batchNumber + 1}/${BATCHES} - Generating ${BATCH_SIZE} flashcards`);
      console.log(`   Topics: ${topicSubset.slice(0, 3).join(', ')}...`);
      
      const prompt = `Generate ${BATCH_SIZE} flashcards (Batch ${batchNumber + 1}/${BATCHES}) covering important concepts from these topics: ${topicSubset.join(', ')} for module "${moduleId}". 

Mix of concept, definition, and application questions.

JSON format: { "flashcards": [{ "type": "concept|definition|application", "front": "question", "back": "answer" }] }. 

CRITICAL: Return EXACTLY ${BATCH_SIZE} flashcards.
Strictly valid JSON object. No Markdown blocks.`;

      try {
        const res = await generateAIContent(prompt, cleanJson);
        const flashcards = res.data?.flashcards || [];
        console.log(`✅ Batch ${batchNumber + 1} complete (${flashcards.length} flashcards)`);
        return flashcards;
      } catch (error) {
        console.error(`❌ Batch ${batchNumber + 1} failed:`, error);
        return [];
      }
    };

    // Execute all batches in PARALLEL with staggered starts
    try {
      const batchPromises = [];
      for (let i = 0; i < BATCHES; i++) {
        // Stagger by 200ms to avoid rate limiting
        const delayedPromise = new Promise(resolve =>
          setTimeout(() => resolve(generateBatch(i)), i * 200)
        );
        batchPromises.push(delayedPromise);
      }

      const batchResults = await Promise.all(batchPromises);
      const allFlashcards = batchResults.flat();

      console.log(`✅ All ${BATCHES} parallel batches complete! Total: ${allFlashcards.length} flashcards`);

      return {
        data: {
          flashcards: allFlashcards
        }
      };
    } catch (error) {
      console.error('🚨 Parallel flashcard generation failed:', error);
      throw new Error('Failed to generate flashcards');
    }
  },
};
