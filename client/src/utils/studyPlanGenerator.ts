import { useGlobalStore } from '../store/GlobalStore';

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  dailyGoals: DailyGoal[];
  currentDay: number;
  totalDays: number;
}

export interface DailyGoal {
  day: number;
  date: number;
  modules: string[];
  tasks: Task[];
  estimatedTime: number; // minutes
  completed: boolean;
}

export interface Task {
  id: string;
  type: 'mock' | 'notes' | 'flashcards' | 'review';
  moduleId: string;
  topicId?: string;
  description: string;
  estimatedTime: number;
  completed: boolean;
  path: string; // Navigation path to the content
  moduleData?: {
    name: string;
    topics?: string[];
  };
}

export const generateStudyPlan = (params: {
  examDate: Date;
  availableHoursPerDay: number;
  weakModules?: string[];
}): StudyPlan => {
  const { history, notesCache } = useGlobalStore.getState();
  
  // Get real modules from notes cache
  const realModuleIds = Object.keys(notesCache).map(key => key.split(':')[0]);
  const uniqueModules = [...new Set(realModuleIds)].filter(Boolean);
  
  // Fallback to default modules if no cache
  const allModules = uniqueModules.length > 0 ? uniqueModules : [
    'DAC School TG 1',
    'DAC School TG 2', 
    'DAC School TG 3',
    'DAC School TG 4',
    'DAC School TG 5',
  ];

  // Time calculations
  const now = Date.now();
  const examTime = params.examDate.getTime();
  const daysUntilExam = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));

  // Analyze user performance
  const moduleStats = history.attempts.reduce((acc, attempt) => {
    if (!acc[attempt.moduleId]) {
      acc[attempt.moduleId] = { total: 0, correct: 0, attempts: 0 };
    }
    acc[attempt.moduleId].total += attempt.total;
    acc[attempt.moduleId].correct += attempt.score;
    acc[attempt.moduleId].attempts += 1;
    return acc;
  }, {} as Record<string, { total: number; correct: number; attempts: number }>);

  // Prioritize weak modules
  const weakModules = params.weakModules || allModules.filter(mod => {
    const stats = moduleStats[mod];
    if (!stats) return true; // Not attempted yet
    const accuracy = stats.correct / stats.total;
    return accuracy < 0.7; // Below 70% accuracy
  });

  // Generate daily goals
  const dailyGoals: DailyGoal[] = [];
  const minutesPerDay = params.availableHoursPerDay * 60;

  for (let day = 1; day <= daysUntilExam; day++) {
    const dayDate = now + (day - 1) * 24 * 60 * 60 * 1000;
    const tasks: Task[] = [];
    let timeAllocated = 0;

    // Allocate time for the day
    if (day <= daysUntilExam * 0.7) {
      // First 70%: Focus on learning
      const modulesToCover = weakModules.slice(0, 2);
      
      modulesToCover.forEach(moduleId => {
        tasks.push({
          id: `${day}-mock-${moduleId}`,
          type: 'mock',
          moduleId,
          description: `CCEE Practice Test: ${moduleId}`,
          estimatedTime: 30,
          completed: false,
          path: `/mock?module=${encodeURIComponent(moduleId)}&mode=PRACTICE`,
          moduleData: { name: moduleId },
        });
        timeAllocated += 30;

        // Notes review (20 mins)
        const cachedTopics = Object.keys(notesCache)
          .filter(key => key.startsWith(moduleId))
          .map(key => key.split(':')[1])
          .filter(Boolean);
        
        const topicForNotes = cachedTopics[0] || 'Overview';
        
        tasks.push({
          id: `${day}-notes-${moduleId}`,
          type: 'notes',
          moduleId,
          topicId: topicForNotes,
          description: `Study Notes: ${moduleId} - ${topicForNotes}`,
          estimatedTime: 20,
          completed: false,
          path: `/notes?module=${encodeURIComponent(moduleId)}&topic=${encodeURIComponent(topicForNotes)}`,
          moduleData: { name: moduleId, topics: cachedTopics },
        });
        timeAllocated += 20;
      });

      // Flashcards (remaining time)
      const flashcardTime = Math.min(minutesPerDay - timeAllocated, 30);
      if (flashcardTime > 0) {
        const topicForFlashcards = Object.keys(notesCache)
          .filter(key => key.startsWith(modulesToCover[0]))
          .map(key => key.split(':')[1])
          .filter(Boolean)[0] || 'General';
          
        tasks.push({
          id: `${day}-flashcards`,
          type: 'flashcards',
          moduleId: modulesToCover[0],
          topicId: topicForFlashcards,
          description: `Flashcards: ${modulesToCover[0]} - ${topicForFlashcards}`,
          estimatedTime: flashcardTime,
          completed: false,
          path: `/flashcards?module=${encodeURIComponent(modulesToCover[0])}&topic=${encodeURIComponent(topicForFlashcards)}`,
          moduleData: { name: modulesToCover[0] },
        });
      }
    } else {
      // Last 30%: Revision & full tests
      const moduleToTest = allModules[day % allModules.length];
      
      tasks.push({
        id: `${day}-full-test`,
        type: 'mock',
        moduleId: moduleToTest,
        description: `Full CCEE Test: ${moduleToTest}`,
        estimatedTime: 60,
        completed: false,
        path: `/mock?module=${encodeURIComponent(moduleToTest)}&mode=CCEE`,
        moduleData: { name: moduleToTest },
      });

      // Review mistakes (30 mins)
      tasks.push({
        id: `${day}-review`,
        type: 'review',
        moduleId: moduleToTest,
        description: `Review Test Results: ${moduleToTest}`,
        estimatedTime: 30,
        completed: false,
        path: '/mock/history',
        moduleData: { name: moduleToTest },
      });
    }

    dailyGoals.push({
      day,
      date: dayDate,
      modules: [...new Set(tasks.map(t => t.moduleId))],
      tasks,
      estimatedTime: tasks.reduce((sum, t) => sum + t.estimatedTime, 0),
      completed: false,
    });
  }

  return {
    id: `plan_${Date.now()}`,
    title: `${daysUntilExam}-Day Study Plan`,
    description: `Personalized study plan for CCEE exam preparation`,
    startDate: now,
    endDate: examTime,
    dailyGoals,
    currentDay: 1,
    totalDays: daysUntilExam,
  };
};
