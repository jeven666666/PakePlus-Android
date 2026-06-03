import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { generateToken, authMiddleware } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码不能为空' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: '邮箱格式不正确' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: '密码至少6位' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: '该邮箱已注册' });
      return;
    }

    const id = uuid();
    const passwordHash = bcrypt.hashSync(password, 10);
    const inviteCode = id.slice(0, 8).toUpperCase();
    const name = displayName || email.split('@')[0];

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, invite_code, credits, storage_limit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, passwordHash, name, inviteCode, 100, 1);

    const token = generateToken({ userId: id, email });
    res.status(201).json({
      token,
      user: { id, email, displayName: name, membership: 'free', credits: 100, inviteCode },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: '邮箱和密码不能为空' });
      return;
    }

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        signature: user.signature,
        membership: user.membership,
        credits: user.credits,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit,
        inviteCode: user.invite_code,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      signature: user.signature,
      membership: user.membership,
      membershipExpiresAt: user.membership_expires_at,
      credits: user.credits,
      storageUsed: user.storage_used,
      storageLimit: user.storage_limit,
      inviteCode: user.invite_code,
      createdAt: user.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const { displayName, signature, avatarUrl } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (typeof displayName === 'string') { updates.push('display_name = ?'); values.push(displayName.slice(0, 50)); }
    if (typeof signature === 'string') { updates.push('signature = ?'); values.push(signature.slice(0, 200)); }
    if (typeof avatarUrl === 'string') { updates.push('avatar_url = ?'); values.push(avatarUrl.slice(0, 500)); }

    if (updates.length === 0) {
      res.status(400).json({ error: '没有可更新的字段' });
      return;
    }

    updates.push('updated_at = unixepoch()');
    values.push(req.user!.userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.put('/me/password', authMiddleware, (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: '密码不能为空且新密码至少6位' });
      return;
    }

    const user: any = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId);
    if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
      res.status(401).json({ error: '原密码错误' });
      return;
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?').run(hash, req.user!.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
