import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NoteExportData {
  module: string;
  topic: string;
  content: string;
  date: string;
}

interface MockResultExportData {
  module: string;
  mode: string;
  score: number;
  total: number;
  accuracy: number;
  timeSpent?: string;
  date: string;
  questions?: Array<{
    question: string;
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }>;
}

export const exportNotesAsPDF = (data: NoteExportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text('CCEE Sentinel - AI Notes', 20, 20);
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Module: ${data.module}`, 20, 30);
  doc.text(`Topic: ${data.topic}`, 20, 36);
  doc.text(`Generated: ${data.date}`, 20, 42);
  
  // Line separator
  doc.setDrawColor(0, 102, 204);
  doc.line(20, 48, 190, 48);
  
  // Content
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const splitContent = doc.splitTextToSize(data.content, 170);
  doc.text(splitContent, 20, 56);
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
  }
  
  doc.save(`${data.module}_${data.topic}_notes.pdf`);
};

export const exportMockResultAsPDF = (data: MockResultExportData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(220, 53, 69);
  doc.text('CCEE Sentinel - Test Report', 20, 20);
  
  // Summary Box
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 30, 170, 35, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Module: ${data.module}`, 25, 38);
  doc.text(`Mode: ${data.mode}`, 25, 45);
  doc.text(`Score: ${data.score}/${data.total} (${data.accuracy}%)`, 25, 52);
  if (data.timeSpent) {
    doc.text(`Time: ${data.timeSpent}`, 25, 59);
  }
  
  // Grade Badge
  const gradeColor: [number, number, number] = data.accuracy >= 80 ? [40, 167, 69] : 
                     data.accuracy >= 60 ? [0, 102, 204] : [220, 53, 69];
  doc.setFillColor(...gradeColor);
  doc.rect(140, 35, 45, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  const grade = data.accuracy >= 80 ? 'EXCELLENT' : 
                data.accuracy >= 60 ? 'GOOD' : 'NEEDS WORK';
  doc.text(grade, 162, 50, { align: 'center' });
  
  // Questions Table
  if (data.questions && data.questions.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Question Breakdown', 20, 75);
    
    const tableData = data.questions.map((q, i) => [
      `Q${i + 1}`,
      q.question.substring(0, 60) + (q.question.length > 60 ? '...' : ''),
      q.isCorrect ? '✓' : '✗',
    ]);
    
    autoTable(doc, {
      startY: 80,
      head: [['#', 'Question', 'Result']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 53, 69] },
      styles: { fontSize: 9 },
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${data.date}`, 105, 285, { align: 'center' });
  
  doc.save(`test_report_${data.module}_${Date.now()}.pdf`);
};
