import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const router = Router();

// TTS synthesis
router.post('/synthesize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text, voice, model, params } = req.body;
    if (!text) {
      res.status(400).json({ error: '文本不能为空' });
      return;
    }

    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 10;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足' });
      return;
    }

    const taskId = uuid();
    const now = Math.floor(Date.now() / 1000);

    db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, 'tts', 'submitted', ?, ?, ?, ?, ?, ?)`).run(
      taskId, req.user!.userId, text, JSON.stringify({ voice, ...params }), model || 'mimo-v2.5-tts', cost, now, now
    );

    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);

    // Process async
    processTtsTask(taskId, req.user!.userId, text).catch(console.error);

    res.status(201).json({ id: taskId, status: 'submitted', creditsCost: cost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function processTtsTask(taskId: string, userId: string, text: string) {
  try {
    db.prepare("UPDATE tasks SET status = 'running', progress = 0, updated_at = unixepoch() WHERE id = ?").run(taskId);

    // Simulate processing
    for (let p = 0; p <= 80; p += 20) {
      await new Promise(r => setTimeout(r, 400));
      db.prepare('UPDATE tasks SET progress = ?, updated_at = unixepoch() WHERE id = ?').run(p, taskId);
    }

    const assetId = uuid();
    const filePath = path.join(UPLOAD_DIR, `${assetId}.txt`);

    // In production, this would be an actual audio file from TTS API
    fs.writeFileSync(filePath, `TTS Audio: ${text.slice(0, 100)}`);

    db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, duration) VALUES (?, ?, ?, 'audio', ?, ?, ?)`).run(
      assetId, userId, taskId, filePath, Buffer.byteLength(text), Math.ceil(text.length / 5)
    );

    db.prepare("UPDATE tasks SET status = 'success', progress = 100, result_urls = ?, updated_at = unixepoch() WHERE id = ?")
      .run(JSON.stringify([`/api/assets/${assetId}/file`]), taskId);
  } catch (err: any) {
    db.prepare("UPDATE tasks SET status = 'failed', error_message = ?, updated_at = unixepoch() WHERE id = ?")
      .run(err.message, taskId);
  }
}

export default router;
