import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { attachSessionUser, createAuthMiddleware } from './auth.js';
import { ensureDatabaseSchema } from './schema.js';
import analyzeRoutes from './routes/analyze.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/business.js';
import dataRoutes from './routes/data.js';
import plaidRoutes from './routes/plaid.js';
import workspaceRoutes from './routes/workspace.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authMiddleware = createAuthMiddleware();
if (authMiddleware) {
  app.use('/api', authMiddleware);
}

app.use(attachSessionUser);
app.use(async (_req, res, next) => {
  try {
    await ensureDatabaseSchema();
    next();
  } catch (error) {
    console.error('Schema bootstrap error:', error);
    res.status(500).json({ error: 'Failed to initialize database schema' });
  }
});

app.use('/api/plaid', plaidRoutes);
app.use('/api', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api', dataRoutes);
app.use('/api', analyzeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
