import { Router, Request, Response } from 'express';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get credits info
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT credits, membership FROM users WHERE id = ?').get(req.user!.userId);
    res.json({
      credits: user.credits,
      membership: user.membership,
      costPerGeneration: user.membership === 'pro' ? 20 : 20,
      costPerVideo: 50,
      costPerTts: 10,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Redeem code
router.post('/redeem', authMiddleware, (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: '请输入兑换码' });
      return;
    }

    // Simple mock: accept any code starting with "AGNES" and add credits
    if (code.toUpperCase().startsWith('AGNES')) {
      const credits = 100;
      db.prepare('UPDATE users SET credits = credits + ?, updated_at = unixepoch() WHERE id = ?').run(credits, req.user!.userId);
      res.json({ success: true, creditsAdded: credits });
    } else {
      res.status(400).json({ error: '无效的兑换码' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get storage info
router.get('/storage', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT storage_used, storage_limit, membership FROM users WHERE id = ?').get(req.user!.userId);
    res.json({
      used: user.storage_used,
      limit: user.storage_limit,
      membership: user.membership,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get invite info
router.get('/invite', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT invite_code, id FROM users WHERE id = ?').get(req.user!.userId);
    res.json({
      inviteCode: user.invite_code,
      inviteLink: `https://agnes.ai/invite/${user.invite_code}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
