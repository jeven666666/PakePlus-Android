import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// List tasks
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { status, type, limit = '50', offset = '0' } = req.query;
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: any[] = [req.user!.userId];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type) { sql += ' AND type = ?'; params.push(type); }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const tasks = db.prepare(sql).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(req.user!.userId) as any;

    res.json({ tasks, total: total.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get task by ID
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const task: any = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!task) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json({
      ...task,
      params: JSON.parse(task.params || '{}'),
      resultUrls: JSON.parse(task.result_urls || '[]'),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { type, prompt, negativePrompt, params, model } = req.body;
    if (!type || !prompt) {
      res.status(400).json({ error: '任务类型和提示词不能为空' });
      return;
    }

    // Check credits
    const user: any = db.prepare('SELECT credits, membership FROM users WHERE id = ?').get(req.user!.userId);
    const cost = type === 'video' ? 50 : type === 'tts' ? 10 : 20;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足', creditsNeeded: cost, creditsAvailable: user.credits });
      return;
    }

    const id = uuid();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`
      INSERT INTO tasks (id, user_id, type, status, prompt, negative_prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.userId, type, prompt, negativePrompt || '', JSON.stringify(params || {}), model || '', cost, now, now);

    // Deduct credits
    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);

    res.status(201).json({
      id,
      type,
      status: 'submitted',
      prompt,
      creditsCost: cost,
      createdAt: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel task
router.post('/:id/cancel', authMiddleware, (req: Request, res: Response) => {
  try {
    const task: any = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!task) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    if (task.status === 'success' || task.status === 'failed' || task.status === 'canceled') {
      res.status(400).json({ error: '任务已结束，无法取消' });
      return;
    }

    db.prepare("UPDATE tasks SET status = 'canceled', updated_at = unixepoch() WHERE id = ?").run(req.params.id);

    // Refund credits
    db.prepare('UPDATE users SET credits = credits + ?, updated_at = unixepoch() WHERE id = ?').run(task.credits_cost, req.user!.userId);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
