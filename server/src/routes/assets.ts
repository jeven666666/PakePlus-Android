import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, 'thumbnails'))) fs.mkdirSync(path.join(UPLOAD_DIR, 'thumbnails'), { recursive: true });

const router = Router();

// List assets
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { type, favorited, limit = '50', offset = '0' } = req.query;
    let sql = 'SELECT * FROM assets WHERE user_id = ?';
    const params: any[] = [req.user!.userId];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (favorited === 'true' || favorited === '1') { sql += ' AND favorited = 1'; }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const assets = db.prepare(sql).all(...params);
    res.json({ assets });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get asset by ID
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const asset: any = db.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!asset) {
      res.status(404).json({ error: '资产不存在' });
      return;
    }
    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle favorite
router.put('/:id/favorite', authMiddleware, (req: Request, res: Response) => {
  try {
    const asset: any = db.prepare('SELECT favorited FROM assets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!asset) {
      res.status(404).json({ error: '资产不存在' });
      return;
    }
    const newVal = asset.favorited ? 0 : 1;
    db.prepare('UPDATE assets SET favorited = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ favorited: !!newVal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete asset
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const asset: any = db.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!asset) {
      res.status(404).json({ error: '资产不存在' });
      return;
    }

    // Delete files
    if (asset.file_path && fs.existsSync(asset.file_path)) fs.unlinkSync(asset.file_path);
    if (asset.thumbnail_path && fs.existsSync(asset.thumbnail_path)) fs.unlinkSync(asset.thumbnail_path);

    // Update storage
    db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?), updated_at = unixepoch() WHERE id = ?')
      .run(asset.file_size / (1024 * 1024), req.user!.userId);

    db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch delete
router.post('/batch-delete', authMiddleware, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: '请提供资产ID列表' });
      return;
    }

    const placeholders = ids.map(() => '?').join(',');
    const assets: any[] = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders}) AND user_id = ?`).all(...ids, req.user!.userId);

    let freedStorage = 0;
    for (const asset of assets) {
      if (asset.file_path && fs.existsSync(asset.file_path)) fs.unlinkSync(asset.file_path);
      if (asset.thumbnail_path && fs.existsSync(asset.thumbnail_path)) fs.unlinkSync(asset.thumbnail_path);
      freedStorage += asset.file_size / (1024 * 1024);
    }

    db.prepare(`DELETE FROM assets WHERE id IN (${placeholders}) AND user_id = ?`).run(...ids, req.user!.userId);
    if (freedStorage > 0) {
      db.prepare('UPDATE users SET storage_used = MAX(0, storage_used - ?), updated_at = unixepoch() WHERE id = ?')
        .run(freedStorage, req.user!.userId);
    }

    res.json({ success: true, deleted: assets.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve asset file
router.get('/:id/file', authMiddleware, (req: Request, res: Response) => {
  try {
    const asset: any = db.prepare('SELECT * FROM assets WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!asset || !fs.existsSync(asset.file_path)) {
      res.status(404).json({ error: '文件不存在' });
      return;
    }
    res.sendFile(path.resolve(asset.file_path));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
