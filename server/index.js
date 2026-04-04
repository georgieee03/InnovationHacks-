import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import plaidRoutes from './routes/plaid.js';
import businessRoutes from './routes/business.js';
import dataRoutes from './routes/data.js';
import analyzeRoutes from './routes/analyze.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/plaid', plaidRoutes);
app.use('/api/business', businessRoutes);
app.use('/api', dataRoutes);
app.use('/api', analyzeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SafeGuard API running on http://localhost:${PORT}`);
});
