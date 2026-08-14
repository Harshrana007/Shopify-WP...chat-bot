import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adminStats,
  configuration,
  researchSources,
} from './src/researchData.js';
import { buildResponse, getRelevantSources } from './src/researchEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Peptide Research Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/configuration', (req, res) => {
  res.json(configuration);
});

app.get('/api/sources', (req, res) => {
  const { q, peptide, evidenceLevel, year, studyType } = req.query;
  let filtered = [...researchSources];

  if (q) {
    const text = String(q).toLowerCase();
    filtered = filtered.filter((source) =>
      `${source.title} ${source.peptide} ${source.authors} ${source.abstract}`.toLowerCase().includes(text)
    );
  }

  if (peptide) {
    filtered = filtered.filter((source) => source.peptide.toLowerCase().includes(String(peptide).toLowerCase()));
  }

  if (evidenceLevel) {
    filtered = filtered.filter((source) => source.evidenceLevel === String(evidenceLevel));
  }

  if (studyType) {
    filtered = filtered.filter((source) => source.studyType === String(studyType));
  }

  if (year) {
    filtered = filtered.filter((source) => String(source.year) === String(year));
  }

  res.json({
    total: filtered.length,
    sources: filtered,
  });
});

app.get('/api/sources/:id', (req, res) => {
  const source = researchSources.find((item) => item.id === req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }

  return res.json({ source });
});

app.get('/api/admin/stats', (req, res) => {
  res.json(adminStats);
});

app.post('/api/chat', async (req, res) => {
  const question = String(req.body?.question || '').trim();

  if (!question || question.length > 500) {
    return res.status(400).json({
      error: 'A valid question is required.',
    });
  }

  const result = await buildResponse(question, ['bpc-157', 'peptide', 'research']);
  return res.json(result);
});

app.get('*', (req, res) => {
  const file = req.path === '/' ? 'index.html' : req.path;
  res.sendFile(path.join(__dirname, 'public', file));
});

app.listen(PORT, () => {
  console.log(`Research assistant server running on http://localhost:${PORT}`);
});
