import { Router, Request, Response } from 'express';
import { runOutreachPipeline, buildAudienceList } from '../services/outreachPipelineService';
import type { BusinessProfile } from '../types';

const router = Router();

// POST /api/pipeline/run
// Body: { profile, fromEmail, minHomeValue?, maxEmailsToSend?, dryRun? }
router.post('/run', async (req: Request, res: Response) => {
  const { profile, fromEmail, minHomeValue, maxEmailsToSend, dryRun } = req.body;

  if (!profile?.businessName) {
    res.status(400).json({ error: 'profile.businessName is required' });
    return;
  }
  if (!fromEmail) {
    res.status(400).json({ error: 'fromEmail is required — must be verified in Resend' });
    return;
  }

  try {
    const result = await runOutreachPipeline(profile as BusinessProfile, {
      fromEmail,
      minHomeValue: minHomeValue ?? 400000,
      maxEmailsToSend: maxEmailsToSend ?? 20,
      dryRun: dryRun ?? false,
    });
    res.json(result);
  } catch (err: any) {
    console.error('[Route] /api/pipeline/run error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Pipeline failed' });
  }
});

// POST /api/pipeline/audience
// Body: { profile, minHomeValue? }
// Returns scored homeowner list for Facebook Custom Audience export
router.post('/audience', async (req: Request, res: Response) => {
  const { profile, minHomeValue } = req.body;

  if (!profile?.businessName) {
    res.status(400).json({ error: 'profile.businessName is required' });
    return;
  }

  try {
    const result = await buildAudienceList(profile as BusinessProfile, minHomeValue ?? 400000);
    res.json(result);
  } catch (err: any) {
    console.error('[Route] /api/pipeline/audience error:', err?.message);
    res.status(500).json({ error: err?.message ?? 'Audience build failed' });
  }
});

export default router;
