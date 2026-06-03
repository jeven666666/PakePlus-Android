import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const STORAGE_PLANS: Record<string, { storage: number; price: number; name: string }> = {
  'free': { storage: 1 * 1024 * 1024 * 1024, price: 0, name: '免费版' },
  'basic': { storage: 10 * 1024 * 1024 * 1024, price: 19.9, name: '基础版' },
  'standard': { storage: 20 * 1024 * 1024 * 1024, price: 29.9, name: '标准版' },
  'professional': { storage: 50 * 1024 * 1024 * 1024, price: 49.9, name: '专业版' },
};

// 获取存储空间信息
router.get('/info', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT storage_used, storage_limit FROM users WHERE id = ?').get(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    res.json({
      used: user.storage_used || 0,
      limit: user.storage_limit || (1 * 1024 * 1024 * 1024), // 默认 1GB
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取存储空间方案
router.get('/plans', authMiddleware, (req: Request, res: Response) => {
  try {
    const plans = Object.entries(STORAGE_PLANS).map(([key, config]) => ({
      key,
      ...config,
    }));
    
    res.json({ plans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 升级存储空间
router.post('/upgrade', authMiddleware, (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    
    if (!plan || !STORAGE_PLANS[plan]) {
      res.status(400).json({ error: '无效的存储方案' });
      return;
    }
    
    const planConfig = STORAGE_PLANS[plan];
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    // 如果是免费版，直接返回
    if (plan === 'free') {
      res.json({ success: true, message: '已是免费版', plan: planConfig });
      return;
    }
    
    // 检查当前方案
    if (user.storage_limit >= planConfig.storage) {
      res.status(400).json({ error: '当前存储空间已大于或等于所选方案' });
      return;
    }
    
    // 更新用户存储空间限制
    const now = Math.floor(Date.now() / 1000);
    db.prepare('UPDATE users SET storage_limit = ?, updated_at = ? WHERE id = ?')
      .run(planConfig.storage, now, req.user!.userId);
    
    // 记录积分消费（如果有价格）
    if (planConfig.price > 0) {
      // 这里应该调用支付系统，实际实现中需要集成真实支付
      // 暂时跳过支付，直接升级
      db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(uuid(), req.user!.userId, 'storage_upgrade', -planConfig.price * 10, `存储空间升级: ${planConfig.name}`);
    }
    
    res.json({
      success: true,
      message: `存储空间已升级到 ${planConfig.name}`,
      plan: planConfig,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取存储使用详情
router.get('/usage', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT storage_used FROM users WHERE id = ?').get(req.user!.userId);
    
    // 获取各类资产的存储使用情况
    const assets: any[] = db.prepare(
      'SELECT type, COUNT(*) as count, SUM(file_size) as total_size FROM assets WHERE user_id = ? GROUP BY type'
    ).all(req.user!.userId);
    
    const usage = {
      total: user?.storage_used || 0,
      byType: assets.reduce((acc: any, item: any) => {
        acc[item.type] = {
          count: item.count,
          size: item.total_size || 0,
        };
        return acc;
      }, {}),
    };
    
    res.json(usage);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
