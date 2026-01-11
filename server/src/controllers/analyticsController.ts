import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    // Check if force refresh is requested
    const forceRefresh = req.query.refresh === 'true';
    
    let data;
    if (forceRefresh) {
      console.log('🔄 Force refreshing heatmap data...');
      data = await analyticsService.regenerateHeatmapData();
    } else {
      data = await analyticsService.getHeatmapData();
    }
    
    res.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
