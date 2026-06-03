import { Router, Request, Response } from 'express';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { v4 as uuid } from 'uuid';

const router = Router();

// Get credits info
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT credits, membership FROM users WHERE id = ?').get(req.user!.userId);
    res.json({
      credits: user.credits,
      membership: user.membership,
      costPerGeneration: 20,
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

    if (code.toUpperCase().startsWith('AGNES')) {
      const credits = 100;
      db.prepare('UPDATE users SET credits = credits + ?, updated_at = unixepoch() WHERE id = ?').run(credits, req.user!.userId);
      db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(uuid(), req.user!.userId, 'redeem', credits, `兑换码充值 +${credits}`);
      res.json({ success: true, creditsAdded: credits });
    } else {
      res.status(400).json({ error: '无效的兑换码' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Purchase credits
router.post('/purchase', authMiddleware, (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;
    const packages: Record<string, { credits: number; price: number }> = {
      '100': { credits: 100, price: 9.9 },
      '500': { credits: 500, price: 39.9 },
      '2000': { credits: 2000, price: 149.9 },
      '5000': { credits: 5000, price: 349.9 },
    };

    const pkg = packages[packageId];
    if (!pkg) {
      res.status(400).json({ error: '无效的积分套餐' });
      return;
    }

    // In production, integrate with payment gateway here
    // For now, directly add credits
    db.prepare('UPDATE users SET credits = credits + ?, updated_at = unixepoch() WHERE id = ?').run(pkg.credits, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), req.user!.userId, 'purchase', pkg.credits, `积分充值 +${pkg.credits}`);
    res.json({ success: true, creditsAdded: pkg.credits, price: pkg.price });
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

// Upgrade membership
router.post('/upgrade', authMiddleware, (req: Request, res: Response) => {
  try {
    const { tier } = req.body;
    if (!['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: '无效的会员等级' });
      return;
    }

    const storageLimit = tier === 'pro' ? 50 : 200;
    const credits = tier === 'pro' ? 2000 : 99999;
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 3600; // 30 days

    // In production, integrate with payment gateway
    db.prepare('UPDATE users SET membership = ?, storage_limit = ?, credits = credits + ?, membership_expires_at = ?, updated_at = unixepoch() WHERE id = ?')
      .run(tier, storageLimit, credits, expiresAt, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), req.user!.userId, 'upgrade', credits, `会员升级 +${credits}积分`);

    res.json({ success: true, tier, creditsAdded: credits, expiresAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get credits history
router.get('/history', authMiddleware, (req: Request, res: Response) => {
  try {
    const history = db.prepare('SELECT * FROM credits_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user!.userId);
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get invite records
router.get('/invite/records', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT invite_code FROM users WHERE id = ?').get(req.user!.userId);
    const records = db.prepare('SELECT id, email as invitee, created_at as date, ? as status FROM users WHERE invite_code = ? LIMIT 50').all('registered', user?.invite_code || '');
    res.json({ records: records || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
