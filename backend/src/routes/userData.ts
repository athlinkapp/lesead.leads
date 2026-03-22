import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'user-data.json');

type UserSnapshot = Record<string, unknown>;
type UserDataStore = Record<string, UserSnapshot>;

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readStore(): Promise<UserDataStore> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return raw ? JSON.parse(raw) as UserDataStore : {};
}

async function writeStore(store: UserDataStore) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

router.get('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId?.trim();
  if (!userId) {
    res.status(400).json({ error: 'userId is required.' });
    return;
  }

  try {
    const store = await readStore();
    res.json({ snapshot: store[userId] ?? null });
  } catch (err: any) {
    console.error('[Route] /api/user-data/:userId GET error:', err?.message ?? err);
    res.status(500).json({ error: 'Unable to load user data.' });
  }
});

router.post('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId?.trim();
  const snapshot = req.body?.snapshot;

  if (!userId) {
    res.status(400).json({ error: 'userId is required.' });
    return;
  }

  if (!snapshot || typeof snapshot !== 'object') {
    res.status(400).json({ error: 'snapshot object is required.' });
    return;
  }

  try {
    const store = await readStore();
    store[userId] = snapshot;
    await writeStore(store);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Route] /api/user-data/:userId POST error:', err?.message ?? err);
    res.status(500).json({ error: 'Unable to save user data.' });
  }
});

export default router;
