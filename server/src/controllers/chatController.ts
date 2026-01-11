import { Request, Response } from 'express';
import * as chatService from '../services/chatService';

export const chat = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await chatService.chatWithAI(message, history || []);
    res.json(response);
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};
