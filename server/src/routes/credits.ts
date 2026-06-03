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

    res.json({ success: true, tier, creditsAdded: credits, expiresAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get credits history
router.get('/history', authMiddleware, (req: Request, res: Response) => {
  try {
    // Mock history - in production, query from a credits_history table
    const history = [
      { id: '1', date: '2024-01-15', type: 'consume', amount: -20, description: '图像生成' },
      { id: '2', date: '2024-01-14', type: 'consume', amount: -50, description: '视频生成' },
      { id: '3', date: '2024-01-13', type: 'purchase', amount: 500, description: '积分充值' },
      { id: '4', date: '2024-01-12', type: 'consume', amount: -10, description: '语音合成' },
      { id: '5', date: '2024-01-11', type: 'invite', amount: 50, description: '邀请奖励' },
      { id: '6', date: '2024-01-10', type: 'redeem', amount: 100, description: '兑换码充值' },
      { id: '7', date: '2024-01-09', type: 'consume', amount: -15, description: '图片编辑' },
      { id: '8', date: '2024-01-08', type: 'consume', amount: -5, description: 'AI对话' },
    ];
    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get invite records
router.get('/invite/records', authMiddleware, (req: Request, res: Response) => {
  try {
    // Mock invite records
    const records = [
      { id: '1', invitee: 'user1@agnes.ai', date: '2024-01-14', status: 'registered', reward: 50 },
      { id: '2', invitee: 'user2@agnes.ai', date: '2024-01-12', status: 'registered', reward: 50 },
      { id: '3', invitee: 'user3@agnes.ai', date: '2024-01-10', status: 'pending', reward: 0 },
      { id: '4', invitee: 'user4@agnes.ai', date: '2024-01-08', status: 'registered', reward: 50 },
    ];
    res.json({ records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
