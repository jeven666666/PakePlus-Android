import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const router = Router();

// Image editing
router.post('/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { imageId, tool, prompt, params } = req.body;
    if (!imageId || !tool) {
      res.status(400).json({ error: '图片和工具不能为空' });
      return;
    }

    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 15;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足' });
      return;
    }

    const taskId = uuid();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, 'editor', 'submitted', ?, ?, ?, ?, ?, ?)`).run(
      taskId, req.user!.userId, prompt || tool, JSON.stringify({ imageId, tool, ...params }), 'agnes-editor', cost, now, now
    );

    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)').run(uuid(), req.user!.userId, 'consume', -15, '图片编辑');

    processEditorTask(taskId, req.user!.userId, tool).catch(console.error);

    res.status(201).json({ id: taskId, status: 'submitted', creditsCost: cost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function processEditorTask(taskId: string, userId: string, tool: string) {
  try {
    db.prepare("UPDATE tasks SET status = 'running', progress = 0, updated_at = unixepoch() WHERE id = ?").run(taskId);

    for (let p = 0; p <= 80; p += 20) {
      await new Promise(r => setTimeout(r, 400));
      db.prepare('UPDATE tasks SET progress = ?, updated_at = unixepoch() WHERE id = ?').run(p, taskId);
    }

    const assetId = uuid();
    const filePath = path.join(UPLOAD_DIR, `${assetId}.svg`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7C5CFF"/><stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g)"/>
      <text x="256" y="240" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">Edited: ${tool}</text>
      <text x="256" y="280" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">AI Image Editor</text>
    </svg>`;
    fs.writeFileSync(filePath, svg);

    db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, width, height) VALUES (?, ?, ?, 'image', ?, ?, 512, 512)`).run(
      assetId, userId, taskId, filePath, Buffer.byteLength(svg)
    );

    db.prepare("UPDATE tasks SET status = 'success', progress = 100, result_urls = ?, updated_at = unixepoch() WHERE id = ?")
      .run(JSON.stringify([`/api/assets/${assetId}/file`]), taskId);
  } catch (err: any) {
    db.prepare("UPDATE tasks SET status = 'failed', error_message = ?, updated_at = unixepoch() WHERE id = ?")
      .run(err.message, taskId);
  }
}

export default router;
