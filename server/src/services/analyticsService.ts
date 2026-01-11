import fs from 'fs';
import path from 'path';

// Static CCEE Heatmap Data - Curated exam priority weights
const HEATMAP_DATA = {
  "exam": "CCEE",
  "version": "v1.0",
  "priority_scale": {
    "HIGH": "80-90",
    "MODERATE": "70-79",
    "LOW": "55-69"
  },
  "modules": [
    {
      "module_id": "ads_with_java",
      "module_name": "ADS with Java",
      "average_weight": 73,
      "topics": [
        { "topic": "Abstract Data Types (ADT)", "weight": 85, "priority": "HIGH" },
        { "topic": "Algorithm complexity analysis (Big-O)", "weight": 80, "priority": "HIGH" },
        { "topic": "Stacks: implementation, operations, applications", "weight": 80, "priority": "HIGH" },
        { "topic": "Algorithm constructs", "weight": 75, "priority": "MODERATE" },
        { "topic": "Queues and circular queues", "weight": 75, "priority": "MODERATE" },
        { "topic": "Problem definition and identification", "weight": 70, "priority": "MODERATE" },
        { "topic": "Arrays and applications", "weight": 70, "priority": "MODERATE" },
        { "topic": "Problem solving strategies", "weight": 65, "priority": "LOW" },
        { "topic": "Singly linked list", "weight": 65, "priority": "LOW" },
        { "topic": "Computational thinking fundamentals", "weight": 60, "priority": "LOW" }
      ]
    },
    {
      "module_id": "cos_sdm",
      "module_name": "COS & SDM",
      "average_weight": 78,
      "topics": [
        { "topic": "Process vs Thread", "weight": 85, "priority": "HIGH" },
        { "topic": "User mode vs Kernel mode", "weight": 85, "priority": "HIGH" },
        { "topic": "Virtual memory", "weight": 80, "priority": "HIGH" },
        { "topic": "Virtualization", "weight": 80, "priority": "HIGH" },
        { "topic": "Deadlock", "weight": 75, "priority": "MODERATE" },
        { "topic": "CPU scheduling", "weight": 75, "priority": "MODERATE" },
        { "topic": "System calls", "weight": 75, "priority": "MODERATE" },
        { "topic": "Agile vs Waterfall", "weight": 70, "priority": "MODERATE" },
        { "topic": "DevOps basics", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "oopj_with_java",
      "module_name": "OOPJ with Java",
      "average_weight": 82,
      "topics": [
        { "topic": "JVM / JRE / JDK", "weight": 90, "priority": "HIGH" },
        { "topic": "OOP principles", "weight": 85, "priority": "HIGH" },
        { "topic": "Inheritance and Polymorphism", "weight": 85, "priority": "HIGH" },
        { "topic": "Exception handling", "weight": 85, "priority": "HIGH" },
        { "topic": "Collections framework", "weight": 80, "priority": "HIGH" },
        { "topic": "Multithreading", "weight": 80, "priority": "HIGH" },
        { "topic": "String and Wrapper classes", "weight": 75, "priority": "MODERATE" },
        { "topic": "Garbage collection", "weight": 75, "priority": "MODERATE" },
        { "topic": "Generics", "weight": 70, "priority": "MODERATE" }
      ]
    },
    {
      "module_id": "database_technologies",
      "module_name": "Database Technologies",
      "average_weight": 76,
      "topics": [
        { "topic": "Normalization", "weight": 85, "priority": "HIGH" },
        { "topic": "SQL Joins", "weight": 85, "priority": "HIGH" },
        { "topic": "Subqueries", "weight": 80, "priority": "HIGH" },
        { "topic": "Keys and constraints", "weight": 80, "priority": "HIGH" },
        { "topic": "Transactions and ACID", "weight": 75, "priority": "MODERATE" },
        { "topic": "Indexes", "weight": 75, "priority": "MODERATE" },
        { "topic": "Stored procedures", "weight": 70, "priority": "MODERATE" },
        { "topic": "Triggers", "weight": 65, "priority": "LOW" },
        { "topic": "MongoDB basics", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "web_based_java_programming",
      "module_name": "Web-Based Java Programming",
      "average_weight": 72,
      "topics": [
        { "topic": "JDBC", "weight": 80, "priority": "HIGH" },
        { "topic": "Servlet lifecycle", "weight": 80, "priority": "HIGH" },
        { "topic": "JSP and MVC", "weight": 75, "priority": "MODERATE" },
        { "topic": "Hibernate ORM", "weight": 75, "priority": "MODERATE" },
        { "topic": "Spring Core (IoC and DI)", "weight": 75, "priority": "MODERATE" },
        { "topic": "Spring Boot", "weight": 70, "priority": "MODERATE" },
        { "topic": "REST services", "weight": 70, "priority": "MODERATE" },
        { "topic": "Spring Security", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "web_programming_technologies",
      "module_name": "Web Programming Technologies",
      "average_weight": 70,
      "topics": [
        { "topic": "HTTP and Web architecture", "weight": 80, "priority": "HIGH" },
        { "topic": "JavaScript fundamentals", "weight": 80, "priority": "HIGH" },
        { "topic": "DOM and Events", "weight": 75, "priority": "MODERATE" },
        { "topic": "AJAX and JSON", "weight": 75, "priority": "MODERATE" },
        { "topic": "Node.js basics", "weight": 70, "priority": "MODERATE" },
        { "topic": "React fundamentals", "weight": 70, "priority": "MODERATE" },
        { "topic": "Redux", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "cpp_programming",
      "module_name": "C++ Programming",
      "average_weight": 68,
      "topics": [
        { "topic": "OOP concepts in C++", "weight": 80, "priority": "HIGH" },
        { "topic": "Pointers and memory management", "weight": 75, "priority": "MODERATE" },
        { "topic": "Inheritance and polymorphism", "weight": 75, "priority": "MODERATE" },
        { "topic": "Virtual functions", "weight": 70, "priority": "MODERATE" },
        { "topic": "STL", "weight": 65, "priority": "LOW" },
        { "topic": "Templates", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "ms_dotnet",
      "module_name": "MS .NET Technologies",
      "average_weight": 71,
      "topics": [
        { "topic": "CLR and .NET Framework", "weight": 85, "priority": "HIGH" },
        { "topic": "C# fundamentals", "weight": 85, "priority": "HIGH" },
        { "topic": "OOP in C#", "weight": 80, "priority": "HIGH" },
        { "topic": "ASP.NET MVC", "weight": 80, "priority": "HIGH" },
        { "topic": "Entity Framework", "weight": 75, "priority": "MODERATE" },
        { "topic": "LINQ", "weight": 75, "priority": "MODERATE" },
        { "topic": "ADO.NET", "weight": 70, "priority": "MODERATE" },
        { "topic": "Web API", "weight": 70, "priority": "MODERATE" },
        { "topic": "Delegates and Events", "weight": 65, "priority": "LOW" },
        { "topic": "Async/Await patterns", "weight": 65, "priority": "LOW" }
      ]
    },
    {
      "module_id": "aptitude_communication",
      "module_name": "Aptitude & Communication",
      "average_weight": 65,
      "topics": [
        { "topic": "Quantitative aptitude", "weight": 75, "priority": "MODERATE" },
        { "topic": "Logical reasoning", "weight": 75, "priority": "MODERATE" },
        { "topic": "Verbal ability", "weight": 70, "priority": "MODERATE" },
        { "topic": "Communication skills", "weight": 60, "priority": "LOW" }
      ]
    }
  ]
};

interface TopicWeight {
    name: string;
    weight: number;
    priority?: string;
}

interface CategoryData {
    category: string;
    averageWeight: number;
    topics: TopicWeight[];
}

// Get heatmap data - reads from the source-of-truth JSON file
export const getHeatmapData = async (): Promise<CategoryData[]> => {
    try {
      const DATA_PATH = path.join(process.cwd(), '../data/processed/heatmap.json');
      if (fs.existsSync(DATA_PATH)) {
        const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
        const data = JSON.parse(rawData);
        
        // Transform user JSON format to API response format
        return data.modules.sort((a: any, b: any) => b.average_weight - a.average_weight)
          .map((m: any) => ({
            category: m.module_name,
            averageWeight: m.average_weight,
            topics: m.topics.map((t: any) => ({
              name: t.topic,
              weight: t.weight,
              priority: t.priority
            }))
          }));
      }
    } catch (e) {
      console.warn('Failed to read heatmap.json, falling back to static data', e);
    }

    // Fallback to static data if file read fails
    const sortedModules = [...HEATMAP_DATA.modules].sort((a, b) => b.average_weight - a.average_weight);
    
    return sortedModules.map(module => ({
        category: module.module_name,
        averageWeight: module.average_weight,
        topics: module.topics.map(t => ({
            name: t.topic,
            weight: t.weight,
            priority: t.priority
        }))
    }));
};

// For backwards compatibility
export const regenerateHeatmapData = async (): Promise<CategoryData[]> => {
    return getHeatmapData();
};
