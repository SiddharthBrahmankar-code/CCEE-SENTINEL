
import api from './apiClient';

export const modulesApi = {
  getAll: () => api.get('/modules'),
  getTopics: (moduleId: string) => api.get(`/modules/${moduleId}/topics`),
};

export const analyticsApi = {
  getHeatmap: (refresh?: boolean) => api.get(`/analytics/heatmap${refresh ? '?refresh=true' : ''}`),
};
