import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// List templates
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const templates = db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.userId);
    res.json({ templates: templates.map((t: any) => ({ ...t, content: JSON.parse(t.content) })) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create template
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, description, type, content } = req.body;
    if (!name || !type) {
      res.status(400).json({ error: '模板名称和类型不能为空' });
      return;
    }

    // Check limit
    const count: any = db.prepare('SELECT COUNT(*) as c FROM templates WHERE user_id = ?').get(req.user!.userId);
    if (count.c >= 100) {
      res.status(400).json({ error: '已达到模板上限（100个）' });
      return;
    }

    const id = uuid();
    db.prepare('INSERT INTO templates (id, user_id, name, description, type, content) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user!.userId, name, description || '', type, JSON.stringify(content || {}));

    res.status(201).json({ id, name, type });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update template
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, description, type, content } = req.body;
    const existing: any = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!existing) {
      res.status(404).json({ error: '模板不存在' });
      return;
    }

    db.prepare('UPDATE templates SET name = ?, description = ?, type = ?, content = ?, updated_at = unixepoch() WHERE id = ?')
      .run(name || existing.name, description ?? existing.description, type || existing.type, JSON.stringify(content || JSON.parse(existing.content)), req.params.id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete template
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: '模板不存在' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
