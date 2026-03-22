import { Router, Request, Response } from 'express';
import { generateOutreach } from '../services/aiService';
import type { BusinessProfile, LeadOpportunity, OutreachTone } from '../types';

const router = Router();

// POST /api/outreach — generate personalized outreach messages
router.post('/', async (req: Request, res: Response) => {
  const {
    profile,
    opportunity,
    types,
    tone,
  }: {
    profile: BusinessProfile;
    opportunity: LeadOpportunity;
    types: string[];
    tone: OutreachTone;
  } = req.body;

  if (!profile?.businessName || !opportunity?.id || !types?.length) {
    res.status(400).json({ error: 'Missing required fields: profile, opportunity, types.' });
    return;
  }

  try {
    const messages = await generateOutreach(profile, opportunity, types, tone ?? 'professional');
    res.json(messages);
  } catch (err: any) {
    console.error('[Route] /api/outreach error:', err?.message ?? err);
    res.status(500).json({ error: 'Outreach generation failed.' });
  }
});

export default router;
