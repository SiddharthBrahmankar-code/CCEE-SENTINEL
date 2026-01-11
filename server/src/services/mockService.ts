import { generateContent } from './aiService';
import { getModuleById, getModuleContent } from './pdfProcessor';
import fs from 'fs';
import path from 'path';

// Helper to load fallback questions prevents duplication and handles partial failures
const getFallbackQuestions = (count: number): any[] => {
  try {
    const fallbackPath = path.resolve(process.cwd(), 'data', 'fallback_ccee.json');
    if (!fs.existsSync(fallbackPath)) {
        console.warn("Fallback file not found.");
        return [];
    }
    
    const fileContent = fs.readFileSync(fallbackPath, 'utf-8');
    const cachedQuestions = JSON.parse(fileContent);
    
    const results = [];
    // Randomly sample questions to avoid predictable sequences
    for (let i = 0; i < count; i++) {
        const randomIdx = Math.floor(Math.random() * cachedQuestions.length);
        const template = cachedQuestions[randomIdx];
        results.push({ ...template }); 
    }
    return results;
  } catch (err) {
    console.error("Failed to load fallback questions:", err);
    // Ultimate emergency fallback
    return Array(count).fill(0).map((_, i) => ({
        id: `fb-${Date.now()}-${i}`,
        question: "System temporarily unavailable.",
        options: ["Retry later", "Check connection", "Contact support", "Refresh"],
        correctAnswer: 0,
        type: "CONCEPTUAL",
        explanation: "Please try again later."
    }));
  }
};

export const generateMockExam = async (moduleId: string, mode: 'PRACTICE' | 'CCEE') => {
  const module = getModuleById(moduleId);
  
  if (!module) {
    throw new Error('Module not found');
  }

  // Fetch content on-demand (async)
  const fullContent = await getModuleContent(moduleId);
  if (!fullContent) {
    console.warn(`⚠️ No content found for module ${moduleId}. AI will rely on internal knowledge.`);
  }

  // Helper function to generate questions
  const fetchQuestions = async (count: number, partLabel: string, contextContent: string): Promise<any[]> => {
    const topicsList = module.topics && module.topics.length > 0 
      ? module.topics.join(', ') 
      : 'General topics from the module';

    console.log("DEBUG PROMPT TOPICS:", topicsList);

    /* -----------------------------------------
      Language / Module Classification
    ------------------------------------------*/
    const codeHeavyLanguage = Math.random() < 0.5 ? 'java' : 'c++';

    const id = moduleId.toLowerCase();
    const isJava = id.includes('java');
    const isCpp = id.includes('c++') || id.includes('cplusplus');

    const isCodeHeavyModule =
      (isJava && codeHeavyLanguage === 'java') ||
      (isCpp && codeHeavyLanguage === 'c++');

    const isTheoryModule =
      id.includes('cos') ||
      id.includes('operating') ||
      id.includes('os') ||
      id.includes('sdm') ||
      id.includes('network') ||
      id.includes('dbms') ||
      id.includes('ads') ||
      id.includes('aptitude');

    let codeLanguage = 'pseudocode';
    if (isJava) codeLanguage = 'Java';
    else if (isCpp) codeLanguage = 'C++';
    else if (id.includes('dotnet') || id.includes('.net')) codeLanguage = 'C#';
    else if (id.includes('python')) codeLanguage = 'Python';

    console.log(`📚 Backend Mock | Code-Heavy: ${codeHeavyLanguage.toUpperCase()} | This module: ${isCodeHeavyModule ? 'CODE-HEAVY' : 'CONCEPT-HEAVY'}`);

    const prompt = `
      
      2. "CONCEPTUAL" - Theory/definition questions
         - Ask about concepts, definitions, syntax rules
         - MAY have code snippet if explaining a concept
         - Can have snippet: null if purely theoretical
      
      3. "DEBUGGING" - Error finding/fixing questions  
         - Ask "What's wrong with this code?" or "How to fix?"
         - MUST have code in 'snippet' field
         - Test ability to identify bugs

      ⚠️ MANDATORY CODE FORMATTING RULES (VERY IMPORTANT):
      
      1. **ALWAYS use the 'snippet' field for ANY code example**
      2. **NEVER put multi-line code in the 'question' field**
      3. For OUTPUT questions: snippet field is MANDATORY
      4. For DEBUGGING questions: snippet field is MANDATORY
      5. For CONCEPTUAL questions: snippet field is OPTIONAL
      6. The 'question' field should ONLY contain the question text
      7. Use \\n for newlines in snippet (example: "int x = 5;\\nSystem.out.println(x);")
      8. Keep question text clean and simple
      
      ✅ CORRECT OUTPUT question:
      {
        "question": "What is the output of the following program?",
        "snippet": "public class Test {\\n    public static void main(String[] args) {\\n        String s1 = \\"hello\\";\\n        String s2 = \\"hello\\";\\n        System.out.println(s1 == s2);\\n    }\\n}",
        "type": "OUTPUT"
      }
      
      ✅ CORRECT CONCEPTUAL question with code:
      {
        "question": "Which statement correctly initializes a static member?",
        "snippet": "class MyClass {\\n    static int count;\\n};",
        "type": "CONCEPTUAL"
      }
      
      ✅ CORRECT CONCEPTUAL question without code:
      {
        "question": "What is the purpose of the virtual keyword in C++?",
        "snippet": null,
        "type": "CONCEPTUAL"
      }
      
      ❌ WRONG - Code embedded in question (DO NOT DO THIS):
      {
        "question": "What is the output?\\n\\nclass Test {\\n    public static void main(String[] args) {\\n        String s = \\"hello\\";\\n    }\\n}",
        "snippet": null,
        "type": "OUTPUT"
      }

      Remember: 
      - Generate a BALANCED MIX: 40% OUTPUT, 30% CONCEPTUAL, 30% DEBUGGING
      - Always populate 'snippet' for OUTPUT and DEBUGGING questions
      - The output must be valid JSON
      - Escape special characters properly (use \\\\ for backslash, \\" for quotes, \\n for newlines)
      - Keep 'question' field clean and text-only
    `;

    // ... (Retry logic)
    let attempts = 0;
    const MAX_RETRIES = 2;
    
    while (attempts <= MAX_RETRIES) {
      try {
        attempts++;
        const response = await generateContent(prompt);
        // ... (JSON parsing)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        const cleanResponse = jsonMatch ? jsonMatch[0] : response.replace(/```json|```/g, '').trim();
        
        const json = JSON.parse(cleanResponse);
        if (Array.isArray(json)) return json;
        throw new Error("Parsed result is not an array");
        // ...
      } catch (e: any) {
        // ... (Error handling)
        const errorMsg = e.message || JSON.stringify(e);
        if (errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('Rate Limit') || errorMsg.includes('404')) {
             console.warn(`🛑 Rate Limit/Quota Hit. Stopping.`);
             throw new Error("Rate Limit Exceeded");
        }
        console.warn(`Attempt ${attempts} failed: ${errorMsg}`);
        if (attempts >= MAX_RETRIES) throw new Error(`AI Gen Failed: ${errorMsg}`);
        await new Promise(r => setTimeout(r, 4000 * attempts));
      }
    }
    return [];
  };

  try {
    if (mode === 'CCEE') {
      console.log(`Generating CCEE Mock for ${module.name}...`);
      
      const TOTAL_QUESTIONS = 40;
      const CHUNK_SIZE = 10;
      const chunks = Math.ceil(TOTAL_QUESTIONS / CHUNK_SIZE);

      // SLIDING WINDOW LOGIC
      const totalLen = fullContent.length;
      const textPerBatch = Math.ceil(totalLen / chunks);
      
      const promises = Array.from({ length: chunks }, (_, i) => {
        const start = i * textPerBatch;
        const end = Math.min(totalLen, start + textPerBatch + 2000); 
        const chunkContext = fullContent.substring(start, end);
        return () => fetchQuestions(CHUNK_SIZE, `Batch ${i + 1}/${chunks}`, chunkContext);
      });

      const results: any[] = [];
      let skipAI = false;
      
      // ========================================
      // NEW PARALLEL LOADING STRATEGY
      // ========================================
      console.log('🚀 Using PARALLEL batch loading for faster generation');
      
      // STEP 1: Generate Batch 1 FIRST (sequential, safe, reliable)
      console.log('Processing Batch 1/4 (sequential)...');
      try {
        const batch1Result = await promises[0]();
        results.push(...batch1Result);
        console.log('✅ Batch 1 complete. Test can start now!');
      } catch (batch1Error: any) {
        console.error('🚨 Batch 1 failed:', batch1Error.message);
        if (batch1Error.message.includes("Rate Limit") || batch1Error.message.includes("Quota")) {
          skipAI = true;
        }
        results.push(...getFallbackQuestions(CHUNK_SIZE));
      }

      // STEP 2: Generate Batches 2-4 in PARALLEL (while user answers batch 1)
      if (!skipAI) {
        console.log('Processing Batches 2-4 in PARALLEL...');
        try {
          // Parallel execution of remaining batches
          const parallelPromises = [
            promises[1](),
            promises[2](),
            promises[3]()
          ];
          
          const parallelResults = await Promise.all(parallelPromises);
          results.push(...parallelResults.flat());
          console.log('✅ All batches complete in parallel!');
          
        } catch (parallelError: any) {
          console.error('🚨 Parallel batch generation failed:', parallelError.message);
          console.log('⚠️ Falling back to SEQUENTIAL generation for remaining batches');
          
          // FALLBACK: Sequential generation for failed batches
          if (parallelError.message.includes("Rate Limit") || parallelError.message.includes("Quota")) {
            skipAI = true;
          }
          
          // Generate remaining batches sequentially
          for (let i = 1; i < promises.length; i++) {
            // Check if this batch is already in results (might have succeeded before failure)
            const expectedTotalSoFar = (i + 1) * CHUNK_SIZE;
            if (results.length >= expectedTotalSoFar) {
              console.log(`Batch ${i + 1} already loaded, skipping...`);
              continue;
            }
            
            if (skipAI) {
              console.log(`Loading fallback for batch ${i + 1}`);
              results.push(...getFallbackQuestions(CHUNK_SIZE));
            } else {
              try {
                console.log(`Processing Batch ${i + 1}/${chunks} (sequential fallback)...`);
                const batchResult = await promises[i]();
                results.push(...batchResult);
                
                // Add delay between sequential batches to avoid rate limits
                if (i < promises.length - 1) {
                  console.log('Cooling down (3s)...');
                  await new Promise(r => setTimeout(r, 3000));
                }
              } catch (batchError: any) {
                console.error(`Batch ${i + 1} failed:`, batchError.message);
                if (batchError.message.includes("Rate Limit") || batchError.message.includes("Quota")) {
                  skipAI = true;
                }
                results.push(...getFallbackQuestions(CHUNK_SIZE));
              }
            }
          }
        }
      } else {
        // If batch 1 hit rate limit, use fallback for all remaining
        console.log('⚠️ Using fallback for all remaining batches due to rate limit');
        for (let i = 1; i < chunks; i++) {
          results.push(...getFallbackQuestions(CHUNK_SIZE));
        }
      }
      
      if (results.length === 0) throw new Error("All batches failed");
      
      return results.map((q, i) => ({ ...q, id: (i + 1).toString() }));

    } else {
      // Practice mode (10 questions)
      // For practice, just grab a random rich section or the first 30k
      const practiceContext = fullContent.substring(0, 30000);
      const questions = await fetchQuestions(10, "Practice Set", practiceContext);
      return questions.map((q, i) => ({ ...q, id: (i + 1).toString() }));
    }
    } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    console.error('Error generating mock:', errorMsg);
    
    // LOAD CACHED FALLBACK (Failover)
    // Only needed if the entire logic crashed (e.g. Practice mode or setup failure)
    const targetCount = mode === 'CCEE' ? 40 : 10;
    const fallbackQs = getFallbackQuestions(targetCount);
    
    return fallbackQs.map((q, i) => ({ ...q, id: (i + 1).toString() }));
  }
};
