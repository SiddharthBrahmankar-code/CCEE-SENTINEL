import express from 'express';
import * as moduleController from './controllers/moduleController';
import * as syllabusController from './controllers/syllabusController';
import * as pyqController from './controllers/pyqController';

const router = express.Router();

// Module Routes (Auto-processed data)
router.get('/modules', moduleController.listModules);
router.get('/modules/:moduleId/topics', moduleController.getModuleTopics);

// Syllabus Routes (Legacy - can be removed later)
router.get('/syllabus/files', syllabusController.getFiles);
router.post('/syllabus/parse', syllabusController.parseSyllabus);

// PYQ Routes
router.get('/pyq/files', pyqController.getFiles);
router.post('/pyq/analyze', pyqController.analyzePYQ);

// Notes Routes
import * as notesController from './controllers/notesController';
router.post('/notes/generate', notesController.generateNotes);

// Mock Routes
import * as mockController from './controllers/mockController';
router.post('/mock/generate', mockController.generateMock);

import * as chatController from './controllers/chatController';
router.post('/chat', chatController.chat);

import * as flashcardController from './controllers/flashcardController';
router.post('/flashcards/generate', flashcardController.generate);

import * as analyticsController from './controllers/analyticsController';
router.get('/analytics/heatmap', analyticsController.getHeatmap);

// Diagram Routes
import * as diagramController from './controllers/diagramController';
router.post('/diagram/generate', diagramController.generateDiagram);

// API Status
import { apiStatus } from './services/aiService';
router.get('/status', (req, res) => {
  res.json({
    ai: apiStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;


