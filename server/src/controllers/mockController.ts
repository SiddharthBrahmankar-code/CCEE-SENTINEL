import { Request, Response } from 'express';
import * as mockService from '../services/mockService';

export const generateMock = async (req: Request, res: Response) => {
  try {
    const { moduleId, mode } = req.body;
    
    if (!moduleId || !mode) {
      return res.status(400).json({ error: 'ModuleId and Mode are required' });
    }
    
    if (mode !== 'PRACTICE' && mode !== 'CCEE') {
      return res.status(400).json({ error: 'Mode must be PRACTICE or CCEE' });
    }

    const exam = await mockService.generateMockExam(moduleId, mode);
    res.json(exam);
  } catch (error: any) {
    console.error("MOCK CONTROLLER ERROR:", error.stack || error);
    res.status(500).json({ error: 'Failed to generate mock exam', details: error.message });
  }
};
