import type { MockAttempt } from '../store/GlobalStore';

export const exportMockResultsAsCSV = (attempts: MockAttempt[]) => {
  // CSV Headers
  const headers = ['Date', 'Module', 'Mode', 'Score', 'Total', 'Accuracy %', 'Time Spent (s)'];
  
  // CSV Rows
  const rows = attempts.map(attempt => [
    new Date(attempt.completedAt).toLocaleDateString(),
    attempt.moduleId,
    attempt.mode,
    attempt.score.toString(),
    attempt.total.toString(),
    Math.round((attempt.score / attempt.total) * 100).toString(),
    attempt.timeSpent.toString(),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `ccee_test_results_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
