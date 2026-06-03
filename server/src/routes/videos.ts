import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const router = Router();

// Video generation
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt, negativePrompt, params, model } = req.body;
    if (!prompt) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 50;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足' });
      return;
    }

    const taskId = uuid();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, negative_prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, 'video', 'submitted', ?, ?, ?, ?, ?, ?, ?)`).run(
      taskId, req.user!.userId, prompt, negativePrompt || '', JSON.stringify(params || {}), model || 'agnes-video-v2.0', cost, now, now
    );

    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)').run(uuid(), req.user!.userId, 'consume', -50, '视频生成');

    processVideoTask(taskId, req.user!.userId, prompt).catch(console.error);

    res.status(201).json({ id: taskId, status: 'submitted', creditsCost: cost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function processVideoTask(taskId: string, userId: string, prompt: string) {
  try {
    db.prepare("UPDATE tasks SET status = 'running', progress = 0, updated_at = unixepoch() WHERE id = ?").run(taskId);

    for (let p = 0; p <= 80; p += 10) {
      await new Promise(r => setTimeout(r, 600));
      db.prepare('UPDATE tasks SET progress = ?, updated_at = unixepoch() WHERE id = ?').run(p, taskId);
    }

    const assetId = uuid();
    const filename = `${assetId}.svg`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7C5CFF"/><stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient></defs>
      <rect width="640" height="360" fill="url(#g)"/>
      <text x="320" y="170" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif">AI Generated Video</text>
      <text x="320" y="210" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}</text>
      <polygon points="280,140 280,220 340,180" fill="white" opacity="0.8"/>
    </svg>`;
    fs.writeFileSync(filePath, svg);

    db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, width, height, duration) VALUES (?, ?, ?, 'video', ?, ?, 640, 360, 4)`).run(
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
