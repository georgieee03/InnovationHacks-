import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import analyzeRoutes from './routes/analyze.js';
import businessRoutes from './routes/business.js';
import dataRoutes from './routes/data.js';
import plaidRoutes from './routes/plaid.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/plaid', plaidRoutes);
app.use('/api/business', businessRoutes);
app.use('/api', dataRoutes);
app.use('/api', analyzeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
