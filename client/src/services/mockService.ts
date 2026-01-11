
import { generateAIContent, cleanJson } from './aiCommon';
import { modulesApi } from './systemService';

// PYQ Questions loader
const loadPYQQuestions = async (moduleId: string) => {
  try {
    const response = await fetch('/data/PYQ/analysis/questions_by_module.json');
    if (!response.ok) return [];
    const data = await response.json();
    return data[moduleId] || [];
  } catch (error) {
    console.warn('PYQ questions not available yet:', error);
    return [];
  }
};

// Sanfoundry MCQ loader for .NET and WPT modules
// Updated to support mcqsByTopic structure (2,672 MCQs across 4 categories)
const loadSanfoundryMcqs = async (moduleId: string): Promise<any[]> => {
  try {
    // Map modules to Sanfoundry categories
    const categoryMap: Record<string, string[]> = {
      'dac_school_tg_ms_dotnet': ['csharp', 'dotnet_expanded'],
      'dac_school_tg_wpt': ['html', 'css', 'javascript', 'wpt_expanded']
    };
    
    const categories = categoryMap[moduleId];
    if (!categories) return [];
    
    const allMcqs: any[] = [];
    
    for (const category of categories) {
      try {
        const response = await fetch(`/data/sanfoundry/${category}.json`);
        if (response.ok) {
          const data = await response.json();
          
          // Support new mcqsByTopic structure
          if (data.mcqsByTopic && typeof data.mcqsByTopic === 'object') {
            // Flatten all topics into a single array
            Object.entries(data.mcqsByTopic).forEach(([topic, questions]) => {
              if (Array.isArray(questions)) {
                allMcqs.push(...(questions as any[]).map((q: any) => ({
                  ...q,
                  topic: q.topic || topic, // Use question's topic or the key
                  source: 'sanfoundry',
                  category
                })));
              }
            });
          }
          // Fallback: support old flat mcqs array structure
          else if (data.mcqs && Array.isArray(data.mcqs)) {
            allMcqs.push(...data.mcqs.map((q: any) => ({
              ...q,
              source: 'sanfoundry',
              category
            })));
          }
        }
      } catch (e) {
        console.warn(`Failed to load Sanfoundry ${category} MCQs:`, e);
      }
    }
    
    console.log(`📚 Loaded ${allMcqs.length} Sanfoundry MCQs for ${moduleId}`);
    return allMcqs;
  } catch (error) {
    console.warn('Sanfoundry MCQs not available:', error);
    return [];
  }
};

// Mapping for CCEE PDF filenames
const CCEE_MODULE_MAP: Record<string, string> = {
  'cplusplus': 'dac_school_tg_cpp',
  'cpp': 'dac_school_tg_cpp',
  'ads': 'dac_school_tg_ads',
  'dac_school_tg_ads_usingjava': 'dac_school_tg_ads',
  'java': 'dac_school_tg_oopj',
  'core_java': 'dac_school_tg_oopj',
  'dotnet': 'dac_school_tg_ms_dotnet',
  'csharp': 'dac_school_tg_ms_dotnet',
  'wpt': 'dac_school_tg_wpt',
  'os': 'dac_school_tg_cos_sdm',
  'sdm': 'dac_school_tg_cos_sdm',
  'dbms': 'dac_school_tg_dbt',
  'wbjp': 'dac_school_tg_wbjp',
  'aptitude': 'dac_school_aptitude'
};

// Helper to process CCEE JSON data
const processCCEEData = (data: any, moduleId: string): any[] => {
    const allMcqs: any[] = [];
    
    // Support mcqsByTopic structure
    if (data.mcqsByTopic && typeof data.mcqsByTopic === 'object') {
      Object.entries(data.mcqsByTopic).forEach(([topic, questions]) => {
        if (Array.isArray(questions)) {
          allMcqs.push(...(questions as any[]).map((q: any) => ({
            ...q,
            topic: q.topic || topic,
            source: 'ccee_pdf'
          })));
        }
      });
    } else if (Array.isArray(data)) {
        // Handle flat array if that exists
        allMcqs.push(...data.map((q: any) => ({ ...q, source: 'ccee_pdf' })));
    }
    
    console.log(`📄 Loaded ${allMcqs.length} CCEE PDF MCQs for ${moduleId}`);
    return allMcqs;
};

// CCEE PDF extracted MCQ loader (9,289+ MCQs across all modules)
const loadCCEEExtractedMcqs = async (moduleId: string): Promise<any[]> => {
  try {
    // Try mapped name first, then original ID
    const filename = CCEE_MODULE_MAP[moduleId.toLowerCase()] || moduleId;
    const response = await fetch(`/data/ccee_extracted/${filename}.json`);
    
    if (!response.ok) {
        // Double check with just the mapped name if original failed
        if (filename !== moduleId) {
             const retry = await fetch(`/data/ccee_extracted/${moduleId}.json`);
             if (retry.ok) return retry.json().then(d => processCCEEData(d, moduleId));
        }
        return [];
    }
    
    const data = await response.json();
    return processCCEEData(data, moduleId);
  } catch (error) {
    console.warn(`CCEE PDF MCQs not available for ${moduleId}:`, error);
    return [];
  }
};

// Combined MCQ loader - loads from all sources (Sanfoundry + CCEE PDFs)
const loadAllScrapedMcqs = async (moduleId: string): Promise<any[]> => {
  const [sanfoundryMcqs, cceeMcqs] = await Promise.all([
    loadSanfoundryMcqs(moduleId),
    loadCCEEExtractedMcqs(moduleId)
  ]);
  
  const combined = [...sanfoundryMcqs, ...cceeMcqs];
  console.log(`🎯 Total scraped MCQs for ${moduleId}: ${combined.length} (Sanfoundry: ${sanfoundryMcqs.length}, CCEE: ${cceeMcqs.length})`);
  
  return combined;
};

// Shuffle array helper (used globally)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};



export const mockApi = {
  /**
   * Generate MCQs for a SINGLE topic (used by Notes page for topic-specific practice)
   * Prioritizes scraped data from Sanfoundry + CCEE PDFs (~12,000 MCQs total)
   */
  generateForTopic: async (moduleId: string, topic: string, count: number = 5) => {
    console.log(`🎯 Topic-specific MCQ generation for: "${topic}" (${count} questions)`);
    
    // STEP 1: Try to load ALL scraped MCQs (Sanfoundry + CCEE PDFs)
    const scrapedMcqs = await loadAllScrapedMcqs(moduleId);
    
    if (scrapedMcqs.length > 0) {
        // Filter by topic similarity (fuzzy match keywords)
        const topicKeywords = topic.toLowerCase().split(/[\s,]+/);
        const relevantMcqs = scrapedMcqs.filter((q: any) => {
          const qTopic = (q.topic || '').toLowerCase();
          const qQuestion = (q.question || '').toLowerCase();
          return topicKeywords.some(kw => qTopic.includes(kw) || qQuestion.includes(kw));
        });
        
        if (relevantMcqs.length >= count) {
          console.log(`✨ Using ${count} scraped MCQs for "${topic}"`);
          const selected = shuffleArray(relevantMcqs).slice(0, count);
          return {
            data: selected.map((q: any, idx: number) => ({
              ...q,
              id: (idx + 1).toString(),
              topic: topic
            }))
          };
        } else if (relevantMcqs.length > 0) {
          // Use what we have + fill with AI
          console.log(`🔀 Mixing ${relevantMcqs.length} scraped + AI for "${topic}"`);
          const selected = shuffleArray(relevantMcqs).slice(0, Math.min(count, relevantMcqs.length));
          // Continue to AI generation for remaining
          count = count - selected.length;
          // Fall through to AI generation below
        }
    }
    
    // STEP 2: Fall back to AI generation
    let moduleName = moduleId;
    try {
      const moduleRes = await modulesApi.getAll();
      const moduleData = moduleRes.data?.find((m: any) => m.id === moduleId);
      if (moduleData) moduleName = moduleData.name;
    } catch (_) {}

    const prompt = `CCEE EXAM - Generate ${count} MCQs for SINGLE TOPIC ONLY.

MODULE: "${moduleName}"
TOPIC: "${topic}" (STRICT - all questions MUST be about this exact topic!)

RULES:
1. ALL ${count} questions must be SPECIFICALLY about "${topic}"
2. 15% negative framing ("Which is NOT true...", "Which is FALSE...")
3. Options must be technically close/confusing
4. Include code snippets where relevant
5. Focus on tricky exam-style scenarios

🚨 CRITICAL: SINGLE CORRECT ANSWER ENFORCEMENT 🚨
BEFORE FINALIZING EACH QUESTION, YOU MUST VERIFY:
1. EXACTLY ONE option is correct - NO AMBIGUITY ALLOWED
2. The other 3 options are DEFINITIVELY WRONG (not just "less correct")
3. If multiple options could be correct, REWRITE the question or options
4. For code output: Trace line-by-line to get EXACT output
5. NEVER use "All of the above" or "Both A and B"

⚠️ CRITICAL FOR NEGATIVE QUESTIONS:
- If asking "Which is FALSE/NOT true", exactly ONE option must be factually WRONG
- The other 3 options MUST be TRUE statements
- The correctAnswer index MUST point to the FALSE option
- NEVER mark a TRUE statement as the answer for a negative question

OUTPUT FORMAT - JSON array ONLY:
[{"id":1,"topic":"${topic}","question":"...","snippet":null or "code","options":["A","B","C","D"],"correctAnswer":0-3,"type":"OUTPUT|CONCEPTUAL","explanation":"1 line explaining why the answer is correct/incorrect"}]

Generate ${count} CCEE-grade questions about "${topic}" NOW. JSON only.`;


    try {
      const res = await generateAIContent(prompt, cleanJson);
      const questions = Array.isArray(res.data) ? res.data : 
                        Array.isArray(res.data?.questions) ? res.data.questions : [];
      
      console.log(`✅ Generated ${questions.length} topic-specific MCQs for "${topic}"`);
      
      return {
        data: questions.map((q: any, idx: number) => ({
          ...q,
          id: (idx + 1).toString(),
          topic: topic // Ensure topic is set correctly
        }))
      };
    } catch (error) {
      console.error(`❌ Topic MCQ generation failed for "${topic}":`, error);
      throw error;
    }
  },


  generate: async (
    moduleId: string, 
    mode: 'PRACTICE' | 'CCEE',
    onProgress?: (progress: number, stage: 'init' | 'topics' | 'generating' | 'finalizing' | 'done') => void
  ) => {
    // Report initial progress
    onProgress?.(5, 'init');

    /* -----------------------------------------
       1. Load Topic Context from modules.json
    ------------------------------------------*/
    let topicsList: string[] = [];
    let moduleName = moduleId;
    
    try {
      const topicsRes = await modulesApi.getTopics(moduleId);
      const moduleRes = await modulesApi.getAll();
      
      // Get module name
      const moduleData = moduleRes.data?.find((m: any) => m.id === moduleId);
      if (moduleData) moduleName = moduleData.name;
      
      // Get topics list
      const raw = Array.isArray(topicsRes.data)
        ? topicsRes.data
        : Array.isArray(topicsRes.data?.topics)
          ? topicsRes.data.topics
          : [];
      if (raw.length) topicsList = raw;
    } catch (_) {
      // Silent fallback
    }
    
    // Report topics loaded
    onProgress?.(15, 'topics');

    /* -----------------------------------------
       1.5 Load PYQ Questions (if available)
    ------------------------------------------*/
    let pyqQuestions: any[] = [];
    try {
      const pyqData = await loadPYQQuestions(moduleId);
      if (pyqData && pyqData.length) {
        console.log(`📚 Loaded ${pyqData.length} PYQ questions for ${moduleId}`);
        pyqQuestions = pyqData;
      }
    } catch (pyqError) {
      console.log('⏭️ PYQ questions not available, using AI generation only');
    }

    /* -----------------------------------------
       1.6 FIX 3: Load Scraped MCQs (PRIORITY OVER AI)
       Sanfoundry + CCEE PDFs = ~12,000 verified MCQs
    ------------------------------------------*/
    let scrapedMcqs: any[] = [];
    try {
      scrapedMcqs = await loadAllScrapedMcqs(moduleId);
      console.log(`📚 Loaded ${scrapedMcqs.length} scraped MCQs for ${moduleId} (PRIORITY OVER AI)`);
    } catch (scrapedError) {
      console.log('⏭️ Scraped MCQs not available, will use AI generation');
    }
    
    // Report data loaded, starting generation
    onProgress?.(25, 'generating');

    /* -----------------------------------------
       2. Exam Size & Batching
    ------------------------------------------*/
    // Exam Size & Batching
    const totalQuestions = mode === 'CCEE' ? 40 : 10; // CCEE = 40 questions for 50 mins
    
    // ⚡ Batch size 5 is fastest (tested: 5=2min, 10=stuck, 20=4min)
    // ⚡ Batch size 10 (User requested)
    const batchSize = 10;
    const batches = Math.ceil(totalQuestions / batchSize);

    /* -----------------------------------------
       3. Topic Assignment (smart distribution for combined modules)
    ------------------------------------------*/

    
    // Detect combined modules and split topics into groups
    const detectTopicGroups = (topics: string[]): string[][] => {
      // For OS&SDM, detect the split point
      if (moduleId.includes('cos') && moduleId.includes('sdm')) {
        const sdmKeywords = ['software', 'sdlc', 'agile', 'devops', 'git', 'scrum', 'testing', 'jenkins', 'docker', 'kubernetes'];
        const sdmStartIndex = topics.findIndex(t => 
          sdmKeywords.some(keyword => t.toLowerCase().includes(keyword))
        );
        
        if (sdmStartIndex > 0) {
          return [
            topics.slice(0, sdmStartIndex),  // OS topics
            topics.slice(sdmStartIndex)       // SDM topics
          ];
        }
      }
      
      // For other modules, use all topics as one group
      return [topics];
    };
    
    const createTopicPlan = (count: number, topics: string[]): string => {
      if (!topics.length) return "Question 1-" + count + ": General Concepts\n";
      
      const groups = detectTopicGroups(topics);
      
      if (groups.length > 1) {
        // Combined module (OS&SDM) - use specific distribution
        // OS: 15 questions, SDM: 25 questions (for CCEE 40Q mode)
        // For practice mode (10Q): OS: 4, SDM: 6
        let groupDistribution: number[];
        if (moduleId.includes('cos') && moduleId.includes('sdm')) {
          if (count === 40) {
            groupDistribution = [15, 25]; // CCEE mode: 15 OS + 25 SDM
          } else if (count === 10) {
            groupDistribution = [4, 6]; // Practice mode: 4 OS + 6 SDM
          } else {
            // Fallback: roughly 37.5% OS, 62.5% SDM
            groupDistribution = [Math.round(count * 0.375), count - Math.round(count * 0.375)];
          }
        } else {
          // Other combined modules: even split
          const questionsPerGroup = Math.floor(count / groups.length);
          const remainder = count % groups.length;
          groupDistribution = groups.map((_, idx) => questionsPerGroup + (idx < remainder ? 1 : 0));
        }
        
        let plan = "";
        let qNum = 1;
        
        groups.forEach((group, groupIdx) => {
          const groupQuestions = groupDistribution[groupIdx] || 0;
          
          if (groupQuestions > 0 && group.length > 0) {
            // Randomly shuffle topics within this group
            const shuffledGroup = shuffleArray(group);
            
            // Distribute questions within this group
            const topicsToUse = Math.min(groupQuestions, shuffledGroup.length);
            const questionsPerTopic = Math.floor(groupQuestions / topicsToUse);
            const topicRemainder = groupQuestions % topicsToUse;
            
            for (let i = 0; i < topicsToUse; i++) {
              const topicExtra = i < topicRemainder ? 1 : 0;
              const topicQCount = questionsPerTopic + topicExtra;
              if (topicQCount > 0) {
                const end = qNum + topicQCount - 1;
                plan += `Question ${qNum}-${end}: ${shuffledGroup[i]}\n`;
                qNum = end + 1;
              }
            }
          }
        });
        
        console.log(`📊 OS&SDM Distribution: OS=${groupDistribution[0]}, SDM=${groupDistribution[1]}`);
        return plan;
      } else {
        // Single subject module - randomize topic selection
        const shuffledTopics = shuffleArray(topics);
        const topicsToUse = Math.min(count, shuffledTopics.length);
        const questionsPerTopic = Math.floor(count / topicsToUse);
        const remainder = count % topicsToUse;
        let plan = "";
        let qNum = 1;
        
        for (let i = 0; i < topicsToUse; i++) {
          const extra = i < remainder ? 1 : 0;
          const qCount = questionsPerTopic + extra;
          if (qCount > 0) {
            const end = qNum + qCount - 1;
            plan += `Question ${qNum}-${end}: ${shuffledTopics[i]}\n`;
            qNum = end + 1;
          }
        }
        
        return plan;
      }
    };

    // FIX 6: Boost Graph Topic Weightage for ADS
    // User request: "increase graph topic weightage for ads... just a bit"
    if ((moduleId.includes('ads') || moduleId.includes('algorithm')) && topicsList.length > 0) {
         const graphTopics = topicsList.filter(t => /graph|bfs|dfs|spanning|path|dijkstra|prim|kruskal|tree/i.test(t));
         // Add them again to boost their weightage (2x probability)
         if (graphTopics.length > 0) {
              console.log(`📈 Boosting ${graphTopics.length} Graph/Tree topics for ADS`);
              topicsList.push(...graphTopics);
         }
    }

    // Create ONE comprehensive topic plan for ALL questions with shuffled topics
    const fullTopicPlan = createTopicPlan(totalQuestions, topicsList);
    
    // Extract the actual topic order used in the plan (after shuffling)
    const extractTopicOrder = (plan: string): string[] => {
      const lines = plan.trim().split('\n');
      const topics: string[] = [];
      lines.forEach(line => {
        const match = line.match(/Question \d+-\d+: (.+)$/);
        if (match) topics.push(match[1]);
      });
      return topics;
    };
    
    const shuffledTopicOrder = extractTopicOrder(fullTopicPlan);
    
    // Create a detailed batch-specific plan extractor using the SAME shuffled order
    const getBatchTopicPlan = (batchIndex: number, questionsPerBatch: number): string => {
      if (!shuffledTopicOrder.length) return `Question 1-${questionsPerBatch}: General Concepts\n`;
      
      // Extract the portion of the full plan that belongs to this batch
      const startQ = batchIndex * batchSize + 1;
      const endQ = Math.min(startQ + questionsPerBatch - 1, totalQuestions);
      
      const lines = fullTopicPlan.trim().split('\n');
      let batchPlan = "";
      
      lines.forEach(line => {
        const match = line.match(/Question (\d+)-(\d+): (.+)$/);
        if (match) {
          const lineStart = parseInt(match[1]);
          const lineEnd = parseInt(match[2]);
          const topic = match[3];
          
          // Check if this line overlaps with current batch
          if (lineStart <= endQ && lineEnd >= startQ) {
            const batchStart = Math.max(lineStart, startQ);
            const batchEnd = Math.min(lineEnd, endQ);
            const localStart = batchStart - startQ + 1;
            const localEnd = batchEnd - startQ + 1;
            
            batchPlan += `Question ${localStart}-${localEnd}: ${topic}\n`;
          }
        }
      });
      
      return batchPlan || `Question 1-${questionsPerBatch}: General Concepts\n`;
    };

    console.log(`🚀 ${mode} Mock (${totalQuestions}Q) for ${moduleId}`);
    console.log(`📋 Full Topic Plan:\n${fullTopicPlan}`);

    /* -----------------------------------------
       4. FULL PARALLEL Generation Strategy
    ------------------------------------------*/
    const allQuestions: any[] = [];
    
    console.log(`🚀 Using FULL PARALLEL batch loading (${batches} batches of ${batchSize}Q each)`);
    
    // Helper function to generate a single batch
    const generateBatch = async (batchIndex: number) => {
      const currentBatchSize = Math.min(batchSize, totalQuestions - (batchIndex * batchSize));
      const batchTopicPlan = getBatchTopicPlan(batchIndex, currentBatchSize);
      const allowedTopics = topicsList.length ? topicsList.join('\n• ') : 'General module concepts';
      
      console.log(`\n🎯 Batch ${batchIndex + 1}/${batches} - Generating ${currentBatchSize} questions`);
      console.log(`📝 Topic Plan for this batch:\n${batchTopicPlan}`);

      // Determine module type for question balance
      const getModuleType = (id: string): string => {
        if (id.includes('cplusplus') || id.includes('c++')) return 'CODE_HEAVY';
        if (id.includes('java') && !id.includes('wbjp')) return 'CODE_HEAVY';
        if (id.includes('dotnet') || id.includes('.net')) return 'DOTNET_SANFOUNDRY';
        if (id.includes('wpt') || id.includes('web')) return 'WPT_SANFOUNDRY';
        if (id.includes('aptitude')) return 'APTITUDE_CCEE';
        return 'BALANCED'; // ADS, WBJP, Database, COS&SDM
      };
      
      const moduleType = getModuleType(moduleId);
      
      // Sanfoundry-style instructions for WPT and .NET - Based on REAL CCEE .NET Paper
      const sanfoundryDotnetInstructions = `
.NET CCEE-STYLE QUESTIONS (MANDATORY FORMAT):
FORMAT: 40% "Select correct code", 30% "Select false/wrong statement", 20% code output, 10% concept

=== CODE SYNTAX QUESTIONS (Very common in CCEE!) ===
1. LAMBDA WHERE: dc.Employees.Where((e) => e.City == city).ToList() - parameter required in lambda
2. LAMBDA SELECT VS WHERE: Where filters, Select projects - don't confuse!
3. DELEGATE EVENT: public delegate void del(string str); public event del evt; - event uses delegate type
4. EVENT NULL CHECK: if(evt != null) { evt("msg"); } - always check null before firing
5. LINQ QUERY: from e in employees where e.Salary > 50000 select e
6. THROW EXCEPTION: throw new Exception("message") - NOT "throw Exception()" or "new Exception() throws"
7. OBJECT CREATION: Employee obj = new Employee(); - NOT Employee obj = Employee();
8. GAC DEPLOY: gacutil -i <AssemblyName.dll> (-i for install, -u for uninstall)

=== ASP.NET MVC TRAPS (High priority!) ===
9. MVC NOT EVENT-DRIVEN: MVC is NOT based on event-driven programming (WebForms is!)
10. TEMPDATA: Maintains data between controller actions AND subsequent requests
11. VIEWBAG: Send additional data from Action to View (not TempData for this purpose)
12. SESSION: Store state accessible to user across requests
13. APPLICATION: Store state accessible to ALL users of the application
14. AUTHORIZE ATTRIBUTE: [Authorize], [AllowAnonymous] - NOT DenyUsers/AllowUsers
15. LAYOUT MANDATORY: @RenderBody() is mandatory in Layout (not RenderSection)

=== ADO.NET TRAPS (Very common!) ===
16. CONNECTED MODE: SqlConnection, SqlCommand, SqlDataReader (NOT SqlDataAdapter!)
17. DISCONNECTED MODE: SqlConnection, SqlDataAdapter, DataSet
18. EXECUTEREADER: For SELECT queries returning rows
19. EXECUTENONQUERY: For INSERT/UPDATE/DELETE (returns affected row count)
20. EXECUTESCALAR: Returns single value (first column of first row)
21. TRANSACTION: Must assign to command - cmd.Transaction = tran; THEN Commit/Rollback

=== CONFIG FILE SYNTAX ===
22. CONNECTION STRING: <connectionStrings><add name="..." connectionString="..."/></connectionStrings>
23. NAME NOT KEY: Use "name" attribute, not "key" in connectionStrings
24. connectionString NOT connection: Attribute is "connectionString", not "connection"

=== DELEGATES & EVENTS ===
25. DELEGATE DEFINITION: Delegates are reference types that hold reference to FUNCTIONS
26. MULTICAST DELEGATE: Can hold multiple function references (+= to add)
27. EVENT FIRING: Check null before invoking event

=== WCF & REST ===
28. OPERATIONCONTRACT: [OperationContract] marks method as service operation
29. REST VERBS: REST supports GET, POST, PUT, DELETE (NOT only POST!)
30. REST VS SOAP: REST is lightweight alternative to SOAP/WSDL

=== C# LANGUAGE TRAPS ===
31. METHOD OVERLOAD BY RETURN TYPE: Cannot overload by return type only - COMPILER ERROR!
32. READONLY VS CONST: readonly can be set in constructor, const is compile-time only
33. READONLY IN METHOD: readonly values CANNOT be changed in methods (only constructor)
34. STATIC MEMBER: Shared across all instances, accessed via ClassName.Member
35. VIRTUAL WITHOUT OVERRIDE: Child class CAN call parent's virtual method without override
36. ABSTRACT VS INTERFACE: Class can implement multiple interfaces, only one abstract class
37. ARRAY STORAGE: Arrays are stored in HEAP, not Stack!
38. TERNARY OPERATOR: ?: is ternary operator (not unary or decision)

=== GARBAGE COLLECTION ===
39. GC.COLLECT: Forces immediate garbage collection
40. FINALIZE: Called by GC before object destruction (deprecated, use IDisposable)

=== ENTITY FRAMEWORK ===
41. DBCONTEXT: Main class for EF database operations
42. LAMBDA EXPRESSION: .Where((e) => e.Property == value) - parentheses around parameter

=== FILE I/O ===
43. BINARYWRITER: For writing binary data, use FileMode.CreateNew for new file
44. FILESTREAM: FileMode.CreateNew, FileMode.Open, FileMode.OpenOrCreate

=== SESSION MANAGEMENT ===
45. SESSION.ABANDON: Kills user session (not Close, Discard, or End)

=== REFLECTION ===
46. REFLECTION: Obtain information about types at runtime

=== ATTRIBUTES ===
47. ASSEMBLY ATTRIBUTE: [assembly: AssemblyDescription("...")] - lowercase "assembly:"`;


      const sanfoundryWptInstructions = `
SANFOUNDRY-STYLE WPT MODULE: Reference Sanfoundry MCQs for question patterns.
DIFFICULTY: Intermediate to Advanced - NOT basic syntax.

WPT TRAP PATTERNS (MANDATORY - 40% of questions):
1. HOISTING TRAP: var hoisted but NOT initialized; let/const in TDZ
2. CLOSURE TRAP: Loop variable captured by reference, not value (use let!)
3. "THIS" BINDING: Arrow inherits this, regular function own this
4. TYPE COERCION: [] + {} = "[object Object]", {} + [] = 0
5. EQUALITY TRAP: null == undefined TRUE, null === undefined FALSE
6. ASYNC ORDER: setTimeout(...,0) executes AFTER all sync code
7. EVENT PROPAGATION: stopPropagation vs stopImmediatePropagation
8. CSS SPECIFICITY: inline > ID > class > element, !important overrides
9. TYPEOF TRAP: typeof null = "object", typeof NaN = "number"
10. PROMISE TRAP: .then() returns NEW promise, unhandled rejections
11. ARRAY METHODS: map/filter return new array, forEach returns undefined
12. NaN TRAP: NaN !== NaN, use Number.isNaN() not isNaN()
13. OBJECT REFERENCE: const obj allows mutation, prevents reassignment
14. SPREAD VS REST: ...arr in call vs ...args in definition
15. IMPLICIT GLOBALS: Assignment without var/let/const creates global
16. FALSY VALUES: 0, "", null, undefined, NaN, false - all falsy
17. FLOAT PRECISION: 0.1 + 0.2 !== 0.3
18. JSON TRAP: JSON.stringify ignores undefined, functions, symbols
19. EVENT LOOP: microtasks (Promise) before macrotasks (setTimeout)
20. DOM TRAP: getElementsByClassName returns LIVE collection, querySelectorAll static`;

      // Database trap patterns - Based on REAL CCEE Database Technologies Paper
      const databaseTrapInstructions = `
DATABASE CCEE-STYLE TRAPS (MANDATORY - 50% of questions):
FORMAT: 25% "Which is WRONG statement?", 25% concept, 30% knowledge, 20% SQL SYNTAX

=== SQL SYNTAX QUESTIONS (Include these!) ===
1. SELECT SYNTAX: SELECT columns FROM table WHERE condition ORDER BY column
2. INSERT SYNTAX: INSERT INTO table (cols) VALUES (vals) - parentheses required!
3. UPDATE SYNTAX: UPDATE table SET col=val WHERE condition - SET keyword required
4. DELETE SYNTAX: DELETE FROM table WHERE condition - FROM is optional in some DBs
5. CREATE TABLE: CREATE TABLE name (col1 TYPE, col2 TYPE CONSTRAINT)
6. ALTER TABLE: ALTER TABLE name ADD/MODIFY/DROP column
7. CREATE INDEX: CREATE INDEX idx_name ON table(column)
8. CREATE VIEW: CREATE VIEW name AS SELECT... - AS keyword required
9. STORED PROCEDURE: CREATE PROCEDURE name() BEGIN...END
10. CURSOR SYNTAX: DECLARE cursor CURSOR FOR SELECT... / OPEN / FETCH / CLOSE
11. IF-ELSE: IF condition THEN...ELSEIF...ELSE...END IF
12. CASE WHEN: CASE WHEN cond THEN val ELSE default END
13. JOIN SYNTAX: SELECT * FROM t1 INNER JOIN t2 ON t1.id = t2.id
14. SUBQUERY: SELECT * FROM t WHERE col IN (SELECT col FROM t2)
15. GROUP BY: SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1

=== MYSQL SPECIFIC TRAPS ===
16. CURSOR SENSITIVITY: MySQL cursor is asensitive by default, read-only, non-scrollable
17. TEMPORARY TABLE: MySQL DOES support temp tables, auto-deleted when session ends
18. STORAGE ENGINES: MyISAM, InnoDB, CSV, FEDERATED (not "FEDERAL" - spelling trap!)
19. IF SYNTAX: IF boolean BEGIN...END (not START...FI or other variants)
20. SIGNAL KEYWORD: Used to throw custom exceptions, not SQLEXCEPTION or DECLARE
21. AUTO_INCREMENT: Generates sequential numbers for identification (not IDENTIFY)
22. STORED ROUTINES: MySQL follows SQL:2003 standard (not 2000, 2005, 2008)
23. INDEX REBUILD vs REORGANIZE: Rebuild discards and recreates, Reorganize defragments

=== PRIMARY KEY VS UNIQUE KEY (Common trap!) ===
9. NULL HANDLING: Primary Key = NOT NULL + UNIQUE, Unique Key = allows ONE NULL
10. COUNT: Only ONE Primary Key per table, multiple Unique Keys allowed
11. FOREIGN KEY REFERENCE: Primary Key can be referenced as Foreign Key in another table

=== SQL COMMAND CLASSIFICATION (Very common trap!) ===
12. TCL COMMANDS: COMMIT, ROLLBACK, SAVEPOINT (NOT REVOKE - that's DCL!)
13. DCL COMMANDS: GRANT, REVOKE (controls access permissions)
14. DDL COMMANDS: CREATE, ALTER, DROP, TRUNCATE (structure modification)
15. DML COMMANDS: SELECT, INSERT, UPDATE, DELETE (data manipulation)

=== VIEW CONCEPTS ===
16. WITH CHECK OPTION: Only applicable for UPDATABLE views
17. COMPLEX VIEW: Created from MORE THAN ONE table (not single table)
18. VIEW BENEFITS: Can hide complexity of multi-table joins
19. UPDATABLE VIEW: Not all views are updatable (aggregate, DISTINCT, GROUP BY)

=== TRANSACTION CONCEPTS ===
20. ATOMICITY: If ANY operation fails, ENTIRE transaction fails (all or nothing)
21. TRUNCATE VS DELETE: TRUNCATE is faster, cannot rollback, deletes ALL rows
22. DROP VS TRUNCATE: DROP removes table structure, TRUNCATE keeps structure

=== ACID PROPERTIES (Common exam topic!) ===
23. ATOMICITY: All or nothing - transaction fully completes or fully rolls back
24. CONSISTENCY: Database moves from one valid state to another valid state
25. ISOLATION: Concurrent transactions don't see each other's uncommitted data
26. DURABILITY: Once committed, changes are permanent even after system failure
27. DIRTY READ: Reading uncommitted data from another transaction (prevented by isolation)

=== NOSQL / MONGODB TRAPS ===
28. BSON FIELD NAMES: Cannot start with $ (dollar), cannot contain . (dot)
29. INSERT COMMAND: Both insert() and insertOne() are valid in MongoDB
30. CURSOR ITERATION: Type "it" in mongo shell to iterate cursor (not "next" or "more")
31. SQL SERVER IS NOT NOSQL: SQL Server is relational, MongoDB/Cassandra/HBase are NoSQL
32. CAP THEOREM: Can only have 2 of 3: Consistency, Availability, Partition tolerance

=== NORMALIZATION (Very common!) ===
33. 1NF: Atomic values only, no repeating groups
34. 2NF: 1NF + no partial dependencies (all non-key depend on FULL primary key)
35. 3NF: 2NF + no transitive dependencies (no non-key depends on non-key)
36. BCNF: 3NF + every determinant is a candidate key
37. 4NF: BCNF + no multivalued dependencies
38. 10NF DOES NOT EXIST: It's a trap answer! Only up to 5NF/6NF is recognized

=== JOIN & SUBQUERY CONCEPTS ===
39. INNER JOIN: Returns only matching rows from both tables
40. LEFT JOIN: All rows from left table + matching from right (NULL if no match)
41. RIGHT JOIN: All rows from right table + matching from left
42. FULL OUTER JOIN: All rows from both tables, NULL where no match
43. CROSS JOIN: Cartesian product - m × n rows
44. SELF JOIN: Table joined to itself, requires aliases
45. SUBQUERY NESTING: Subqueries CAN be nested, CAN return multiple values (with IN)
46. CORRELATED SUBQUERY: Executes once per row of outer query (slower)
47. EXISTS VS IN: EXISTS short-circuits, IN evaluates all values

=== NULL HANDLING (Tricky!) ===
48. NULL = NULL: Returns UNKNOWN, not TRUE! Use IS NULL
49. NULL IN AGGREGATE: COUNT(*) counts all, COUNT(column) ignores NULLs
50. NULL IN COMPARISONS: Any comparison with NULL returns UNKNOWN
51. COALESCE: Returns first non-NULL value in list
52. IFNULL/NVL: Replace NULL with specified value

=== CONSTRAINT TRAPS ===
53. NOT NULL: Can ONLY be defined at column level (not table level)
54. CHECK: Validates data against a condition
55. DEFAULT: Sets value when not provided (not when NULL is explicitly inserted!)
56. FOREIGN KEY: References PRIMARY KEY or UNIQUE key of another table
57. ON DELETE SET NULL: Sets FK to NULL when parent deleted

=== DATA TYPE TRAPS ===
58. CHAR VS VARCHAR: CHAR is fixed-length (padded), VARCHAR is variable-length
59. DECIMAL VS FLOAT: DECIMAL is exact, FLOAT has precision issues
60. DATE VS DATETIME: DATE has no time, DATETIME includes time
61. ENUM: Stores predefined values, invalid values cause error
62. BLOB: Binary Large Object for images/files

=== WINDOW FUNCTIONS (Advanced) ===
63. ROW_NUMBER: Assigns unique sequential number to each row
64. RANK: Same rank for ties, skips next number (1,2,2,4)
65. DENSE_RANK: Same rank for ties, no skipping (1,2,2,3)
66. LAG/LEAD: Access previous/next row in result set
67. PARTITION BY: Divides result into groups for window functions

=== VERSION & SYNTAX TRAPS ===
68. LATEST SQL SERVER: SQL Server 2022 (not 2021, 2020, 2019)
69. DEFAULT CONSTRAINT: DEFAULT 'value' syntax (not DEFAULT = 'value' or CONSTRAINT)
70. LIKE OPERATORS: Uses % (any chars) and _ (single char), not ? or other symbols
71. TRIGGER LIMITATION: MySQL triggers NOT supported on VIEWS
72. AGGREGATE WITHOUT GROUP BY: Returns exactly ONE result row
73. ORDER BY DEFAULT: ASC (ascending) is default, not DESC`;




      // OS & SDM trap patterns
      const osSdmTrapInstructions = `
OS & SDM TRAP PATTERNS (MANDATORY - 40% of questions):
1. DEADLOCK: All 4 conditions must be TRUE simultaneously
2. RACE CONDITION: Different interleaving = different results
3. SEMAPHORE: wait() blocks if 0, signal() never blocks
4. PAGING TRAP: Page table entry includes present bit, dirty bit
5. PROCESS VS THREAD: Threads share heap, have separate stacks
6. SCHEDULING: Shortest Job First optimal but needs future knowledge
7. AGILE VELOCITY: Measured in story points, not hours
8. GIT MERGE: Creates merge commit, rebase rewrites history
9. CI/CD: Continuous Integration ≠ Continuous Deployment
10. DOCKER: Container shares kernel, VM has own OS
11. MUTEX VS SEMAPHORE: Mutex has owner, binary semaphore doesn't
12. VIRTUAL MEMORY: Logical address space > Physical memory
13. TLB: Translation Lookaside Buffer caches page translations
14. FORK: Child gets copy of parent's memory (copy-on-write)
15. ZOMBIE PROCESS: Terminated but parent hasn't read exit status
16. CRITICAL SECTION: Only one process at a time
17. BANKER'S ALGORITHM: Checks if state is SAFE before allocation
18. SCRUM: Sprint backlog changes only with PO approval
19. KANBAN: WIP limits vs Scrum fixed sprint capacity
20. DEVOPS: Culture + Automation + Monitoring + Sharing`;

      // ADS trap patterns - Based on REAL CCEE ADS Paper
      const adsTrapInstructions = `
ADS CCEE-STYLE QUESTIONS (MANDATORY FORMAT):
FORMAT: 30% "Which is FALSE/wrong?", 30% calculation, 25% code output, 15% concept

=== GRAPH VS TREE TRAPS (Common!) ===
1. GRAPH HARDER THAN TREE: Because graphs can have CYCLES, not because trees have roots
2. TREE ROOT: Tree has exactly ONE root node (multiple roots = FALSE statement!)
3. TREE ACYCLIC: Tree is acyclic connected graph - this is TRUE
4. ADJACENCY MATRIX: Undirected graph's adjacency matrix is SYMMETRIC (not asymmetric!)
5. COMPLETE GRAPH EDGES: n*(n-1)/2 edges for undirected, n*(n-1) for directed
6. SUM OF DEGREES: For undirected graph with e edges = 2e (not ne or 2ne)

=== HASH TABLE TRAPS (Calculation based!) ===
7. HASH COLLISION: When multiple elements compete for same bucket
8. LINEAR PROBING: h(k) = (h(k) + i) mod m, check next slot
9. DOUBLE HASHING: h(k) = (h1(k) + i*h2(k)) mod m
10. QUADRATIC PROBING: h(k) = (h(k) + i²) mod m
11. HASH CALCULATION: Must be able to calculate h(k) = k mod m manually!
12. COLLISION RESOLUTION: Linear probing, quadratic probing, chaining, double hashing

=== TREE FORMULAS (Must memorize!) ===
13. LEAF NODES FORMULA: For tree with 0 or n children: L = ((n-1)*I + 1) where I = internal nodes
14. BINARY TREE LEAVES: For full binary tree: L = I + 1
15. N-ARY TREE: If L=41, I=10, then n = (L-1)/I + 1 = 5
16. COMPLETE BINARY TREE: All levels filled except possibly last, filled left to right
17. FULL BINARY TREE: Every node has 0 or 2 children
18. PERFECT BINARY TREE: All internal nodes have 2 children, all leaves at same level

=== TRAVERSAL & EXPRESSION ===
19. INORDER BST: Always gives SORTED output!
20. POSTFIX CONVERSION: L*(M+N)*O = LMN+*O* - operators follow operands
21. PREFIX CONVERSION: Operators come before operands
22. RECURSION PRINT REVERSE: fun(head->next) BEFORE print = reverse order!

=== SORTING ALGORITHM SELECTION ===
23. NEARLY SORTED DATA: Use INSERTION SORT (best for nearly sorted)
24. MINIMUM SWAPS: SELECTION SORT needs minimum swaps (one per element)
25. QUICK SORT WORST CASE: O(n²) when already sorted or reverse sorted
26. INSERTION SORT REVERSE: N*(N-1)/2 comparisons for reverse sorted
27. STABLE SORTS: Merge, Insertion, Bubble are stable; Quick, Heap, Selection unstable
28. BEST AVERAGE CASE: Merge Sort, Heap Sort, Quick Sort all O(n log n) average

=== COMPLEXITY ANALYSIS ===
29. BINARY SEARCH UNSUCCESSFUL: O(log n) - same as successful!
30. TWO SEQUENTIAL LOOPS: O(p) + O(q) = O(p+q), NOT O(p*q)!
31. NESTED LOOPS: O(p*q) only when loops are NESTED
32. SPACE O(1): When only fixed variables used, independent of input
33. OMEGA NOTATION: Lower bound (best case)
34. THETA NOTATION: Tight bound (average case)
35. BIG-O NOTATION: Upper bound (worst case)

=== DATA STRUCTURE SELECTION ===
36. DFS: Uses STACK (or recursion)
37. BFS: Uses QUEUE
38. DIJKSTRA ON UNWEIGHTED: Use BFS with QUEUE for O(V+E)
39. MAP IMPLEMENTATION: Uses balanced BST (Red-Black Tree or AVL)
40. LIST INSERT ANYWHERE: std::list / LinkedList allows O(1) insert anywhere
41. DEQUE: Insert/remove from both ends
42. VECTOR: Dynamic array, insert at end O(1) amortized

=== ALGORITHM TRAPS ===
43. BELLMAN-FORD: Works on directed weighted graphs (including negative edges)
44. DIJKSTRA: Fails with negative edge weights!
45. BACKTRACKING CANNOT SOLVE: Travelling Salesman Problem (TSP) - it's NP-hard
46. BACKTRACKING CAN SOLVE: N-Queen, Subset Sum, Hamiltonian Circuit
47. SPARSE MATRIX: Represented using linked list (not graph or circular list)

=== STL/COLLECTION OUTPUT ===
48. STACK TOP AFTER POP: Returns element below the popped one
49. MAP FIND: Returns iterator, access value with itr->second
50. VECTOR FROM LIST: Can initialize vector from list iterators

=== LINKED LIST TRAPS ===
51. CONCATENATION O(1): Use CIRCULAR singly linked list (not doubly or regular)
52. REVERSE PRINT RECURSION: Recursion before print = reverse order
53. ARBITRARY ORDER SET OPERATIONS: Union, Intersection are slowest

=== GRAPH PROPERTIES ===
54. SPANNING TREE EDGES: Always n-1 edges for n vertices
55. CONNECTED GRAPH: Path exists between every pair of vertices
56. DAG: Directed Acyclic Graph - required for topological sort`;


      // Aptitude trap patterns
      const aptitudeTrapInstructions = `
APTITUDE TRAP PATTERNS (MANDATORY - 40% of questions):
1. PERCENTAGE TRAP: 20% increase then 20% decrease = 4% net decrease
2. RATIO TRAP: Part to whole vs part to part ratios
3. TIME & WORK: Efficiency inversely proportional to time
4. SPEED TRAP: Average speed = 2ab/(a+b) for equal distances at speeds a,b
5. PROBABILITY: P(A or B) = P(A) + P(B) - P(A and B)
6. PERMUTATION: Order matters, nPr = n!/(n-r)!
7. COMBINATION: Order doesn't matter, nCr = n!/[r!(n-r)!]
8. LOGICAL TRAP: Some A are B ≠ Some B are A (not always)
9. BLOOD RELATION: Mother's brother = Maternal uncle, not paternal
10. DIRECTION: After right turn, North becomes East
11. SERIES: Could be +2, ×2, or alternating pattern
12. AVERAGE TRAP: Sum/Count, but missing data changes result
13. INTEREST TRAP: CI formula = P(1+r/n)^(nt), not P(1+rt)
14. AGE PROBLEM: Set up equations, present vs past vs future
15. PROFIT/LOSS: On cost price, not selling price
16. DISCOUNT TRAP: Successive discounts 20%, 10% ≠ 30%
17. CLOCK TRAP: Hands overlap 11 times in 12 hours, not 12
18. CALENDAR TRAP: Odd days calculation, leap year rules
19. CODING-DECODING: Pattern could be +1, -1, reverse, or mixed
20. SYLLOGISM TRAP: "All" doesn't imply "Some" in classical logic`;

      // Java/C++ specific traps (for CODE_HEAVY modules)
      const javaTraps = `
JAVA/C++ CONCEPT-BASED TRAPS (MANDATORY - 50% of questions):
=== THREAD & CONCURRENCY CONCEPTS (High Priority) ===
1. THREAD NOT STARTED: new Thread(runnable) created but .start() never called = NO OUTPUT
2. RUN VS START: Calling run() directly executes in CURRENT thread, not new thread
3. DAEMON VS USER: setDaemon(true) BEFORE start() - JVM exits when only daemons remain
4. DAEMON INHERITANCE: Child thread inherits daemon status from parent thread
5. USER THREAD BLOCKS EXIT: JVM waits for ALL user threads to complete before exiting
6. THREAD PRIORITY: setPriority() is only a HINT to scheduler, not guaranteed
7. JOIN BEHAVIOR: t.join() blocks CALLING thread until t completes (not t that blocks!)
8. JOIN WITH TIMEOUT: t.join(1000) waits max 1 second, then continues regardless
9. THREAD STATES: NEW -> RUNNABLE -> (BLOCKED/WAITING/TIMED_WAITING) -> TERMINATED
10. SLEEP VS WAIT: sleep() holds lock, wait() releases lock
11. NOTIFY VS NOTIFYALL: notify() wakes ONE random thread, notifyAll() wakes ALL
12. INTERRUPT FLAG: interrupt() sets flag, doesn't stop thread - must check isInterrupted()
13. SYNCHRONIZED LOCK: Instance method locks 'this', static method locks Class object
14. DEADLOCK: Thread A holds lock1 waits lock2, Thread B holds lock2 waits lock1
15. THREAD-LOCAL: Each thread has own copy, not shared across threads

=== STRING & OBJECT CONCEPTS ===
6. STRING POOL: "abc" == "abc" is TRUE, but new String("abc") == "abc" is FALSE
7. STRING IMMUTABILITY: str.toUpperCase() returns NEW string, original unchanged
8. STRING CONCAT IN LOOP: Creates many objects, StringBuilder is efficient
9. EQUALS VS HASHCODE: Equal objects MUST have equal hashCode, not vice versa
10. CLONE SHALLOW COPY: Object.clone() copies references, not deep objects

=== COLLECTION & ITERATOR CONCEPTS (High Priority) ===
16. ITERATOR AFTER SORT: Iterator created BEFORE Collections.sort() = ConcurrentModificationException
17. ITERATOR AFTER ADD: list.add() during iteration = ConcurrentModificationException
18. ITERATOR AFTER REMOVE: list.remove() during iteration = exception, use iterator.remove()
19. FOR-EACH MODIFICATION: Enhanced for-loop internally uses iterator - same exception rules
20. SUBLIST BACKED VIEW: subList() returns VIEW, not copy - changes reflect in original
21. ARRAYS.ASLIST FIXED SIZE: Cannot add/remove, only set() - UnsupportedOperationException
22. ARRAYS.ASLIST BACKED: Modifying original array changes the list and vice versa
23. LIST REMOVE INT VS OBJECT: remove(1) removes INDEX 1, remove(Integer.valueOf(1)) removes VALUE 1
24. HASHSET MUTABLE KEY: Modifying key after add = element "lost", can't find it
25. TREESET COMPARATOR: If compareTo returns 0, elements considered DUPLICATE (not added)
26. LINKEDHASHMAP ORDER: Maintains insertion order, unlike HashMap
27. HASHMAP NULL KEY: HashMap allows ONE null key, Hashtable allows NONE
28. COLLECTIONS.UNMODIFIABLE: Returns view, original collection changes reflect
29. COLLECTIONS.EMPTY: Returns immutable empty collection, add() throws exception
30. ITERATOR VS LISTITERATOR: Iterator forward only, ListIterator can go backward

=== INHERITANCE & POLYMORPHISM ===
16. STATIC METHOD HIDING: Static methods hide, not override - resolved at compile time
17. PRIVATE METHOD: Not inherited, not overridden - parent version always called
18. CONSTRUCTOR NOT INHERITED: Constructors are not inherited, must call super()
19. COVARIANT RETURN: Override can return subclass type
20. INTERFACE DEFAULT: Class method wins over interface default method

=== EXCEPTION CONCEPTS ===
21. FINALLY EXECUTION: Runs even after return (except System.exit or JVM crash)
22. EXCEPTION IN FINALLY: Suppresses exception from try block
23. TRY-WITH-RESOURCES: Close called automatically, in reverse order
24. CHECKED EXCEPTION: Must be caught OR declared, unlike RuntimeException
25. EXCEPTION CHAINING: Cause preserved with initCause or constructor

=== MEMORY & GC CONCEPTS ===
26. STRONG VS WEAK REFERENCE: WeakReference allows GC even if referenced
27. STRING INTERN: intern() returns pool reference for comparison
28. STATIC INITIALIZATION: Static blocks run once when class first loaded
29. INNER CLASS REFERENCE: Non-static inner class holds reference to outer
30. FINALIZE UNRELIABLE: No guarantee when or if finalize() is called`;


      const moduleInstruction = moduleType === 'CODE_HEAVY' 
        ? `CODE-HEAVY MODULE: 80% code output questions, 20% knowledge. Include 10-20 line code snippets. Focus on execution tracing, method overriding, static blocks, exception handling.

${javaTraps}

${moduleId.includes('ads') ? adsTrapInstructions : ''}`
        : moduleType === 'DOTNET_SANFOUNDRY'
        ? sanfoundryDotnetInstructions
        : moduleType === 'WPT_SANFOUNDRY'
        ? sanfoundryWptInstructions
        : moduleType === 'APTITUDE_CCEE'
        ? `CCEE APTITUDE MODULE: HIGH DIFFICULTY. Focus on Quantitative Aptitude & Logical Reasoning.
           TOPICS: Time & Work, Speed & Distance, Probability, Permutations, Ratios, Blood Relations, Syllogisms, Series Completion, Data Sufficiency.
           EXCLUDE: English Grammar, Antonyms/Synonyms, Spelling check, sentence correction.
           STYLE: Complex word problems, multi-step calculation required. NO CODE.
           
${aptitudeTrapInstructions}`
        : moduleType === 'CONCEPTUAL'
        ? `CONCEPTUAL MODULE: 90% knowledge/reasoning, 10% calculation. NO CODE SNIPPETS. Focus on logical reasoning and core concepts.`
        : moduleId.includes('dbt') || moduleId.includes('dbms')
        ? `DATABASE MODULE: SQL queries, normalization, transactions, indexing.
           
${databaseTrapInstructions}`
        : moduleId.includes('cos') || moduleId.includes('sdm')
        ? `OS & SDM MODULE: Operating system concepts, software development methodology.
           
${osSdmTrapInstructions}`
        : moduleId.includes('ads')
        ? `ADS MODULE: Algorithms and Data Structures.
           
${adsTrapInstructions}`
        : `BALANCED MODULE: 60% conceptual, 40% scenario. MINIMAL CODE - only short syntax examples. Focus on definitions, comparisons, facts.`;

      const prompt = `CCEE EXAM PAPER SETTER - Generate ${currentBatchSize} questions.

MODULE: "${moduleName}" | MODE: ${mode} | TYPE: ${moduleType}

${moduleInstruction}

===== DIFFICULTY BOOST (CCEE LEVEL) =====
- TRICKY & PRECISE: Questions must test edge cases and specific rules.
${moduleType === 'CODE_HEAVY' ? `- CODE SNIPPETS (Crucial):
  * 30% MUST result in COMPILATION ERROR (syntax, visibility, type mismatch, ambiguous call).
  * 20% MUST result in RUNTIME EXCEPTION (NullPointer, IndexOutOfBounds, ClassCast).
  * 50% Valid execution w/ tricky output.
- Options MUST include "Compilation Error" and "Runtime Exception" where applicable.

===== TRAP QUESTION PATTERNS (MANDATORY - 40% of questions) =====
Generate questions that exploit these common misconceptions:
1. STRING IMMUTABILITY TRAP: x.toUpperCase() returns NEW string but x unchanged if not reassigned
2. ARRAYS.ASLIST() TRAP: Returns fixed-size list BACKED by array - array changes reflect in list!
3. IGNORED RETURN VALUE TRAP: Methods like replace(), toUpperCase(), trim() return new object
4. METHOD CHAINING PITFALL: Breaking chain loses intermediate results
5. AUTOBOXING TRAP: Integer cache (-128 to 127), == vs equals() for wrapper types
6. PASS-BY-VALUE TRAP: Java passes object references by value - reassigning param doesn't affect original
7. STATIC CONTEXT TRAP: Cannot access instance members from static context
8. INHERITANCE TRAP: Private members not inherited, method hiding vs overriding
9. EXCEPTION HANDLING TRAP: Order of catch blocks, checked vs unchecked
10. COLLECTION MODIFICATION TRAP: ConcurrentModificationException during iteration

EXAMPLE TRAP (String immutability):
\`\`\`
String x = "xyz";
x.toUpperCase();  // Result IGNORED!
String y = x.replace('Y', 'y');  // x is still "xyz", no 'Y' to replace
y = y + "abc";
System.out.println(y);  // Output: xyzabc (NOT XYZabc)
\`\`\`` : `- Focus on CONCEPTUAL understanding, definitions, and facts.
- NO CODE SNIPPETS for this module - test knowledge and theory only.
- Questions should test: definitions, comparisons, lifecycle, processes, terminology.`}


===== RULES =====
1. Format: "Choose the best option..." or "Select the correct statement..."
2. 15% negative questions: "Which is NOT true...", "Which is FALSE..."
3. Options must be technically close/confusing
4. Each question tests ONE concept only
5. Anti-giveaway: Answer must NOT be visible in code/question text
6. ABSOLUTELY NO COMMENTS in code snippets (Strip // and /* */)

🚨🚨🚨 CRITICAL: SINGLE CORRECT ANSWER ENFORCEMENT 🚨🚨🚨
BEFORE FINALIZING EACH QUESTION, YOU MUST VERIFY:
1. EXACTLY ONE option is correct - NO AMBIGUITY ALLOWED
2. The other 3 options are DEFINITIVELY WRONG (not just "less correct")
3. If multiple options could be correct, REWRITE the question or options
4. For code output questions: Trace the code line-by-line, verify the EXACT output
5. For conceptual questions: Each wrong option must be factually incorrect, not just incomplete
6. NEVER use options like "All of the above" or "Both A and B"

VALIDATION CHECKLIST (Apply to EVERY question):
□ Does Option A answer the question correctly? 
□ Does Option B answer the question correctly?
□ Does Option C answer the question correctly?
□ Does Option D answer the question correctly?
→ If MORE THAN ONE checkbox is YES, the question is INVALID - fix it!

⚠️ CRITICAL FOR NEGATIVE QUESTIONS (FALSE/NOT/INCORRECT):
- Exactly ONE option must be FACTUALLY WRONG - this is the correct answer
- The other 3 options MUST be TRUE/CORRECT statements
- Double-check: The correctAnswer index points to the WRONG statement
- Example: "Which is FALSE about TCL?" → Only ONE option should be false, mark THAT as correctAnswer

⚠️ CRITICAL FOR CODE OUTPUT QUESTIONS:
- TRACE THE CODE STEP BY STEP before deciding the answer
- Check for: null references, exceptions, string immutability, return value usage
- The explanation must show the exact execution trace
6. Topic field must match plan EXACTLY

===== TOPIC PLAN =====
${batchTopicPlan}

ALLOWED TOPICS ONLY: ${allowedTopics}

===== OUTPUT FORMAT =====
Return JSON array ONLY:
[{"id":1,"topic":"exact topic","question":"...","snippet":null or "code\\nhere","options":["A","B","C","D"],"correctAnswer":0-3,"type":"OUTPUT|CONCEPTUAL|VALIDATION","explanation":"1 line"}]

${moduleType === 'CODE_HEAVY' ? 
`CODE FOCUS: Static init order, exception catch order, method overriding, autoboxing, thread lifecycle, constructor/destructor order. USE TRAP PATTERNS ABOVE!` :
moduleType === 'CONCEPTUAL' ?
`NO CODE: Grammar, ratios, percentages, logical reasoning, blood relations, directions.` :
`KNOWLEDGE FOCUS: Definitions, annotations, file extensions, default values, lifecycle methods, framework facts.`}

Generate ${currentBatchSize} CCEE-grade questions NOW. JSON only, no markdown.`;

      try {
        const res = await generateAIContent(prompt, cleanJson);
        const fragment = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.questions)
            ? res.data.questions
            : [];

        // FIX 7: Remove comments from code snippets (User Request)
        // Ensure no giveaways or spoilers in the code
        fragment.forEach((q: any) => {
            if (q.snippet && typeof q.snippet === 'string') {
                q.snippet = q.snippet
                    .replace(/\/\/.*$/gm, '') // Remove single line // comments
                    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi line /* */ comments
                    .trim();
            }
        });


        return fragment;

      } catch (error) {
        console.error(`Batch ${batchIndex + 1} failed:`, error);
        
        // FALLBACK: If batch completely fails, return scraped questions instead
        const usedIds = new Set(allQuestions.map((q: any) => q.id || q.question));
        const unusedScraped = scrapedMcqs.filter((q: any) => !usedIds.has(q.id || q.question));
        const fallbacks = shuffleArray(unusedScraped)
          .slice(0, currentBatchSize)
          .map((q: any) => ({ ...q, source: 'fallback_scraped' }));
        console.log(`🔄 Batch ${batchIndex + 1} failed - using ${fallbacks.length} scraped fallbacks`);
        return fallbacks;
      }
    };

    // Execute ALL batches in PARALLEL with minimal stagger
    console.log(`Generating all ${batches} batches in PARALLEL...`);
    try {
      // Create promises for all batches with minimal stagger
      const batchPromises = [];
      for (let i = 0; i < batches; i++) {
        // ⚡ Reduced from 300ms to 100ms for faster start
        const delayedPromise = new Promise(resolve => 
          setTimeout(() => resolve(generateBatch(i)), i * 100)
        );
        batchPromises.push(delayedPromise);
      }
      
      // Execute all in parallel
      const allBatchResults = await Promise.all(batchPromises);
      
      // Collect results in order and report progress per batch
      let completedBatches = 0;
      allBatchResults.forEach((batch: any, index) => {
        if (batch && batch.length) {
          allQuestions.push(...batch);
          completedBatches++;
          // Calculate progress: 25% (data) + 65% (generation) * completion ratio
          const genProgress = 25 + Math.floor(65 * (completedBatches / batches));
          onProgress?.(Math.min(genProgress, 90), 'generating');
          console.log(`✅ Batch ${index + 1} complete (${batch.length} questions) - ${genProgress}%`);
        }
      });
      
      console.log(`✅ All ${batches} parallel batches complete!`);
      onProgress?.(90, 'finalizing');
    } catch (parallelError) {
      console.error('🚨 Parallel batch generation failed:', parallelError);
      throw new Error('Failed to generate questions');
    }

    if (!allQuestions.length) {
      throw new Error("CCEE mock generation failed");
    }

    /* -----------------------------------------
       4.5 FIX 3: Prioritize Scraped MCQs over AI
       Priority: Scraped (15%) > PYQ (20%) > AI (65% remaining)
    ------------------------------------------*/
    let finalQuestions: any[] = [];
    
    // PRIORITY 1: Use scraped MCQs first (15% target - low priority as quality varies)
    const scrapedTarget = Math.floor(totalQuestions * 0.15);
    let selectedScraped = shuffleArray(scrapedMcqs)
      .slice(0, Math.min(scrapedTarget, scrapedMcqs.length))
      .map((q: any) => ({
        ...q,
        source: q.source || 'scraped'
      }));
    

    
    console.log(`📚 Using ${selectedScraped.length}/${scrapedTarget} scraped MCQs (PRIORITY 1)`);
    finalQuestions.push(...selectedScraped);
    
    // PRIORITY 2: Add PYQ questions (20% target)
    const pyqTarget = Math.floor(totalQuestions * 0.2);
    if (pyqQuestions.length > 0) {
      const selectedPYQ = shuffleArray(pyqQuestions)
        .slice(0, Math.min(pyqTarget, pyqQuestions.length))
        .map((q: any, idx: number) => ({
          id: (idx + 1).toString(),
          topic: q.module_id || 'Unknown',
          question: q.question_text || q.question,
          snippet: q.code_snippet || null,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          type: q.has_code ? 'OUTPUT' : 'CONCEPTUAL',
          explanation: 'Real CCEE PYQ question',
          source: 'pyq'
        }));
      
      console.log(`📄 Using ${selectedPYQ.length}/${pyqTarget} PYQ questions (PRIORITY 2)`);
      finalQuestions.push(...selectedPYQ);
    }
    
    // PRIORITY 3: Fill remaining with AI-generated questions
    const remaining = totalQuestions - finalQuestions.length;
    if (remaining > 0 && allQuestions.length > 0) {
      const selectedAI = allQuestions.slice(0, remaining).map((q: any) => ({
        ...q,
        source: 'ai_generated'
      }));
      console.log(`🤖 Using ${selectedAI.length}/${remaining} AI-generated questions (FALLBACK)`);
      finalQuestions.push(...selectedAI);
    }
    
    // SAFETY FALLBACK: If still not enough, use more scraped MCQs
    const stillNeeded = totalQuestions - finalQuestions.length;
    if (stillNeeded > 0 && scrapedMcqs.length > selectedScraped.length) {
      const usedIds = new Set(finalQuestions.map((q: any) => q.id || q.question));
      const extraScraped = shuffleArray(scrapedMcqs)
        .filter((q: any) => !usedIds.has(q.id || q.question))
        .slice(0, stillNeeded)
        .map((q: any) => ({ ...q, source: 'scraped_fallback' }));
      console.log(`🔄 Adding ${extraScraped.length} extra scraped MCQs to reach target`);
      finalQuestions.push(...extraScraped);
    }
    
    // Shuffle final mix and ensure we have enough
    finalQuestions = shuffleArray(finalQuestions).slice(0, totalQuestions);
    
    console.log(`✅ Final question mix: ${finalQuestions.length} questions`);
    console.log(`   - Scraped: ${finalQuestions.filter((q: any) => q.source === 'scraped' || q.source === 'sanfoundry' || q.source === 'ccee_pdf').length}`);
    console.log(`   - PYQ: ${finalQuestions.filter((q: any) => q.source === 'pyq').length}`);
    console.log(`   - AI: ${finalQuestions.filter((q: any) => q.source === 'ai_generated').length}`);

    /* -----------------------------------------
       5. Normalize IDs
    ------------------------------------------*/
    return {
      data: finalQuestions.map((q, idx) => ({
        ...q,
        id: (idx + 1).toString()
      }))
    };
  }
};
