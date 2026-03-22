import { Router, Request, Response } from 'express';
import { generateFullAnalysis, regenerateAnalysis } from '../services/aiService';
import type { BusinessProfile } from '../types';

const router = Router();

// POST /api/analysis — generate full lead intelligence analysis
router.post('/', async (req: Request, res: Response) => {
  const profile: BusinessProfile = req.body;

  if (!profile?.businessName) {
    res.status(400).json({ error: 'Invalid business profile — businessName is required.' });
    return;
  }

  try {
    const analysis = await generateFullAnalysis(profile);
    res.json(analysis);
  } catch (err: any) {
    console.error('[Route] /api/analysis error:', err?.message ?? err);
    res.status(500).json({ error: 'Analysis failed. Check API keys in backend/.env.' });
  }
});

// POST /api/analysis/regenerate — fresh analysis pass
router.post('/regenerate', async (req: Request, res: Response) => {
  const profile: BusinessProfile = req.body;

  if (!profile?.businessName) {
    res.status(400).json({ error: 'Invalid business profile.' });
    return;
  }

  try {
    const analysis = await regenerateAnalysis(profile);
    res.json(analysis);
  } catch (err: any) {
    console.error('[Route] /api/analysis/regenerate error:', err?.message ?? err);
    res.status(500).json({ error: 'Regeneration failed.' });
  }
});

export default router;
