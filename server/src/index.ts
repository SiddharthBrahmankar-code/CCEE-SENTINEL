import dotenv from 'dotenv';
dotenv.config();
// Env reload trigger (Data Fully Restored - User Version 5 - Hybrid Fix)

import express from 'express';
import cors from 'cors';
import routes from './routes';
import { processAllPDFs } from './services/pdfProcessor';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Process PDFs on startup (async, don't block server start)
// DISABLED: Using manual test data instead
processAllPDFs().catch(err => console.error('PDF processing error:', err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
