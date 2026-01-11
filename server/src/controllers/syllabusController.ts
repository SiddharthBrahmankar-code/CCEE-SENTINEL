import { Request, Response } from 'express';
import * as syllabusService from '../services/syllabusService';

export const getFiles = (req: Request, res: Response) => {
  try {
    const files = syllabusService.getSyllabusFiles();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
};

export const parseSyllabus = async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const data = await syllabusService.parseSyllabus(filename);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse syllabus', details: error });
  }
};
