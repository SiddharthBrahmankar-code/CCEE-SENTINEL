import { Request, Response } from 'express';
import * as flashcardService from '../services/flashcardService';

export const generate = async (req: Request, res: Response) => {
  try {
    const { moduleId, topic } = req.body;
    if (!moduleId || !topic) {
      return res.status(400).json({ error: 'Module and Topic are required' });
    }
    const data = await flashcardService.generateFlashcards(moduleId, topic);
    res.json(data);
  } catch (error: any) {
    console.error('❌ Flashcard generation error:', error?.message || error);
    res.status(500).json({ error: 'Failed to generate flashcards: ' + (error?.message || 'Unknown error') });
  }
};
