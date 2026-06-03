import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

const router = Router();

// Image generation
router.post('/generate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt, negativePrompt, params, model } = req.body;
    if (!prompt) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    // Check credits
    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 20;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足', creditsNeeded: cost, creditsAvailable: user.credits });
      return;
    }

    // Create task
    const taskId = uuid();
    const now = Math.floor(Date.now() / 1000);
    const count = (params?.count as number) || 1;

    db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, negative_prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, 'image', 'submitted', ?, ?, ?, ?, ?, ?, ?)`).run(
      taskId, req.user!.userId, prompt, negativePrompt || '', JSON.stringify(params || {}), model || 'agnes-image-2.1', cost, now, now
    );

    // Deduct credits
    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);

    // Start async processing
    processImageTask(taskId, req.user!.userId, prompt, params, count).catch(console.error);

    res.status(201).json({ id: taskId, status: 'submitted', creditsCost: cost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function processImageTask(taskId: string, userId: string, prompt: string, params: any, count: number) {
  try {
    // Update status to running
    db.prepare("UPDATE tasks SET status = 'running', progress = 0, updated_at = unixepoch() WHERE id = ?").run(taskId);

    // Simulate generation progress
    for (let p = 0; p <= 80; p += 20) {
      await new Promise(r => setTimeout(r, 500));
      db.prepare('UPDATE tasks SET progress = ?, updated_at = unixepoch() WHERE id = ?').run(p, taskId);
    }

    // Generate placeholder images (in production, call actual AI model API)
    const resultUrls: string[] = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const assetId = uuid();
      const filename = `${assetId}.png`;
      const filePath = path.join(UPLOAD_DIR, filename);

      // Create a simple placeholder SVG as PNG placeholder
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#7C5CFF"/><stop offset="100%" stop-color="#00D4FF"/>
        </linearGradient></defs>
        <rect width="512" height="512" fill="url(#g)"/>
        <text x="256" y="240" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">AI Generated</text>
        <text x="256" y="280" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}</text>
      </svg>`;
      fs.writeFileSync(filePath, svg);

      // Create asset record
      db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, width, height) VALUES (?, ?, ?, 'image', ?, ?, 512, 512)`).run(
        assetId, userId, taskId, filePath, Buffer.byteLength(svg)
      );

      resultUrls.push(`/api/assets/${assetId}/file`);
    }

    // Update storage
    const totalSize = resultUrls.length * 1024 / (1024 * 1024); // approximate
    db.prepare('UPDATE users SET storage_used = storage_used + ?, updated_at = unixepoch() WHERE id = ?').run(totalSize, userId);

    // Complete task
    db.prepare("UPDATE tasks SET status = 'success', progress = 100, result_urls = ?, updated_at = unixepoch() WHERE id = ?")
      .run(JSON.stringify(resultUrls), taskId);
  } catch (err: any) {
    db.prepare("UPDATE tasks SET status = 'failed', error_message = ?, updated_at = unixepoch() WHERE id = ?")
      .run(err.message, taskId);
  }
}

export default router;
