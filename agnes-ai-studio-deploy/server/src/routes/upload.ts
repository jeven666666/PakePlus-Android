import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const upload = multer({
  dest: path.join(UPLOAD_DIR, 'temp'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

// Upload file
router.post('/', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: '请选择文件' });
      return;
    }

    const ext = path.extname(file.originalname || '') || path.extname(file.mimetype?.replace('/', '.') || '.bin');
    const newFilename = `${uuid()}${ext}`;
    const newPath = path.join(UPLOAD_DIR, newFilename);

    fs.renameSync(file.path, newPath);

    // Check storage limit
    const user: any = db.prepare('SELECT storage_used, storage_limit FROM users WHERE id = ?').get(req.user!.userId);
    const fileSizeMB = file.size / (1024 * 1024);
    if (user.storage_used + fileSizeMB > user.storage_limit * 1024) {
      fs.unlinkSync(newPath);
      res.status(400).json({ error: '存储空间不足' });
      return;
    }

    // Create asset record
    const assetId = uuid();
    const type = file.mimetype?.startsWith('image') ? 'image' : file.mimetype?.startsWith('video') ? 'video' : 'audio';

    db.prepare(`INSERT INTO assets (id, user_id, type, file_path, file_size, metadata) VALUES (?, ?, ?, ?, ?, ?)`).run(
      assetId, req.user!.userId, type, newPath, file.size,
      JSON.stringify({ originalName: file.originalname, mimetype: file.mimetype })
    );

    // Update storage usage
    db.prepare('UPDATE users SET storage_used = storage_used + ?, updated_at = unixepoch() WHERE id = ?')
      .run(fileSizeMB, req.user!.userId);

    res.status(201).json({
      id: assetId,
      url: `/api/assets/${assetId}/file`,
      type,
      fileSize: file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
