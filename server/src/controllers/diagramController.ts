import { Request, Response } from 'express';
import { generateContent } from '../services/aiService';

export const generateDiagram = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const prompt = `You are a CCEE (CDAC) exam mentor that generates EXAM-ORIENTED diagrams using Mermaid.js.

Your role is to help students visualize INTERNAL STRUCTURE, FLOW, HIERARCHY, and LIFECYCLES of technical concepts that appear in CCEE MCQs.

========================
OUTPUT RULES (CRITICAL)
========================
• Output ONLY Mermaid.js code
• No explanations, markdown, comments, or emojis
• Start directly with diagram type (flowchart TD, stateDiagram, etc.)

========================
DIAGRAM RULES
========================
• Use simple, exam-relevant keywords
• Prefer: flowchart, graph, stateDiagram, sequenceDiagram
• Show: execution order, relationships, dependencies, constraints
• Use short labels (1-4 words max)
• Use subgraphs when helpful

========================
SYNTAX RULES (CRITICAL)
========================
• Node IDs: alphanumeric only (A, B, node1, node2)
• Labels: plain text in square brackets [Text Here]
• NO special characters in labels: / \\ < > | ( )
• Use --> for arrows (not --)
• Avoid symbols, use words: "root" not "/"

========================
CCEE CONTENT RULES
========================
• Focus ONLY on WHAT + HOW
• Match how MCQs are framed in CCEE
• Show exam traps visually (branching, annotations)
• Quick revision format - accuracy over aesthetics

========================
USER REQUEST
========================
"${description}"

Generate the Mermaid diagram code now (code only, no explanations):`;

    const mermaidCode = await generateContent(prompt);
    
    // Clean up response (remove markdown blocks if AI added them)
    let cleanCode = mermaidCode.trim();
    cleanCode = cleanCode.replace(/```mermaid\n?/g, '');
    cleanCode = cleanCode.replace(/```\n?/g, '');
    cleanCode = cleanCode.trim();

    // Sanitize special characters that break Mermaid syntax
    cleanCode = cleanCode.replace(/\[([^\]]*)\]/g, (match, content) => {
      // Remove all problematic characters from label content
      let sanitized = content.replace(/[\/\\()<>|]/g, '');
      // Clean up extra spaces
      sanitized = sanitized.replace(/\s+/g, ' ').trim();
      return `[${sanitized}]`;
    });
    
    // Fix malformed arrow labels: -->|text|> should be -->|text|
    cleanCode = cleanCode.replace(/-->\|([^|]+)\|>/g, '-->|$1|');
    
    // Fix arrow syntax: convert standalone -- to --> for flowcharts
    cleanCode = cleanCode.replace(/--\s+/g, '--> ');

    res.json({ mermaidCode: cleanCode });
  } catch (error: any) {
    console.error('Diagram generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate diagram', 
      details: error.message 
    });
  }
};
