import { Request, Response } from 'express';
import { getModules, getModuleById } from '../services/pdfProcessor';

export const listModules = (req: Request, res: Response) => {
  try {
    const modules = getModules();
    const simplified = modules.map(m => ({
      id: m.id,
      name: m.name,
      topics: m.topics
    }));
    res.json(simplified);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list modules' });
  }
};

export const getModuleTopics = (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const module = getModuleById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json({ topics: module.topics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get topics' });
  }
};
