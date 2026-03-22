import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysis';
import outreachRoutes from './routes/outreach';
import monitoringRoutes from './routes/monitoring';
import pipelineRoutes from './routes/pipeline';
import billingRoutes from './routes/billing';
import userDataRoutes from './routes/userData';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', models: { cheap: 'gemini-2.5-flash-lite', premium: 'claude-sonnet-4-6' } });
});

app.use('/api/analysis', analysisRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/user-data', userDataRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`[LeSead API] Running on http://localhost:${PORT}`);
  console.log(`[LeSead API] Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'}`);
  console.log(`[LeSead API] Google:    ${process.env.GOOGLE_API_KEY ? 'configured' : 'missing'}`);
  console.log(`[LeSead API] Apollo:    ${process.env.APOLLO_API_KEY ? 'configured' : 'missing'}`);
  console.log(`[LeSead API] ATTOM:     ${process.env.ATTOM_API_KEY ? 'configured' : 'missing'}`);
  console.log(`[LeSead API] Resend:    ${process.env.RESEND_API_KEY ? 'configured' : 'missing'}`);
  const cseReady = process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_ID;
  console.log(`[LeSead API] LinkedIn:  ${cseReady ? 'configured (Google CSE)' : 'missing GOOGLE_CSE_KEY or GOOGLE_CSE_ID'}`);
});

export default app;
