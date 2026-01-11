import { Request, Response } from 'express';
import * as pyqService from '../services/pyqService';

export const getFiles = (req: Request, res: Response) => {
  try {
    const files = pyqService.getPYQFiles();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list PYQ files' });
  }
};

export const analyzePYQ = async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const data = await pyqService.analyzePYQ(filename);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze PYQ' });
  }
};
