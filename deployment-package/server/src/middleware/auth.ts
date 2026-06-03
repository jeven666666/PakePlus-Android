import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models/database';

const JWT_SECRET = process.env.JWT_SECRET || 'agnes-ai-studio-jwt-secret-key-2024';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
    // 验证用户是否仍然存在且激活
    const user = db.prepare(`
      SELECT id, email, role, is_active FROM users WHERE id = ?
    `).get(decoded.userId) as any;
    
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    
    if (!user.is_active) {
      res.status(403).json({ error: '账户已被禁用' });
      return;
    }
    
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch {
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      
      const user = db.prepare(`
        SELECT id, email, role, is_active FROM users WHERE id = ?
      `).get(decoded.userId) as any;
      
      if (user && user.is_active) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role
        };
      }
    } catch { /* ignore */ }
  }
  next();
}

// 管理员中间件
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: '需要登录' });
    return;
  }
  
  const user = db.prepare(`
    SELECT role FROM users WHERE id = ?
  `).get(req.user.userId) as any;
  
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    res.status(403).json({ error: '权限不足，需要管理员权限' });
    return;
  }
  
  next();
}

// 超级管理员中间件
export function superAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: '需要登录' });
    return;
  }
  
  const user = db.prepare(`
    SELECT role FROM users WHERE id = ?
  `).get(req.user.userId) as any;
  
  if (!user || user.role !== 'superadmin') {
    res.status(403).json({ error: '权限不足，需要超级管理员权限' });
    return;
  }
  
  next();
}
