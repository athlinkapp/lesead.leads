import { Router, Request, Response } from 'express';
import { runMonitoringScan } from '../services/monitoringService';
import type { BusinessProfile } from '../types';

const router = Router();
type PlanId = 'free' | 'starter' | 'pro' | 'scale';

// POST /api/monitoring/scan
router.post('/scan', async (req: Request, res: Response) => {
  const profile: BusinessProfile = req.body?.profile ?? req.body;
  const scanDepth: 1 | 2 | 3 = req.body?.scanDepth ?? 1;
  const planId: PlanId = req.body?.planId ?? 'free';

  if (!profile?.businessName) {
    res.status(400).json({ error: 'Business profile with businessName is required.' });
    return;
  }

  try {
    const result = await runMonitoringScan(profile, scanDepth, planId);
    res.json(result);
  } catch (err: any) {
    console.error('[Route] /api/monitoring/scan error:', err?.message ?? err);
    res.status(500).json({ error: 'Scan failed. Please try again.' });
  }
});

export default router;
