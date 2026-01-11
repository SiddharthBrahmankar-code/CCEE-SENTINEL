import { Request, Response } from 'express';
import * as notesService from '../services/notesService';

export const generateNotes = async (req: Request, res: Response) => {
  try {
    const { moduleId, topic } = req.body;
    if (!moduleId || !topic) {
      return res.status(400).json({ error: 'ModuleId and Topic are required' });
    }
    const notes = await notesService.generateNotes(moduleId, topic);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate notes' });
  }
};
