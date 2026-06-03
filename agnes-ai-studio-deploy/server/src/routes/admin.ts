import { Router, Request, Response } from 'express';
import { authMiddleware, adminMiddleware, superAdminMiddleware } from '../middleware/auth';
import db from '../models/database';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const router = Router();

// 获取平台统计数据
router.get('/stats', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    // 用户统计
    const userStats = db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' OR role = 'superadmin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN membership != 'free' THEN 1 END) as paid_users
      FROM users
    `).get() as any;
    
    // 任务统计
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        SUM(CASE WHEN status = 'success' THEN credits_cost ELSE 0 END) as total_credits_spent
      FROM tasks
    `).get() as any;
    
    // 今日数据
    const today = Math.floor(Date.now() / 1000) - 86400;
    const todayStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at >= ? THEN 1 END) as new_tasks_today
      FROM users, tasks
    `).get(today, today) as any;
    
    // 存储统计
    const storageStats = db.prepare(`
      SELECT 
        COALESCE(SUM(storage_used), 0) as total_storage_used,
        COALESCE(SUM(credits), 0) as total_credits_remaining
      FROM users
    `).get() as any;
    
    res.json({
      users: {
        total: userStats.total_users,
        admin: userStats.admin_users,
        active: userStats.active_users,
        paid: userStats.paid_users,
        newToday: todayStats.new_users_today,
      },
      tasks: {
        total: taskStats.total_tasks,
        success: taskStats.success_tasks,
        failed: taskStats.failed_tasks,
        newToday: todayStats.new_tasks_today,
        creditsSpent: taskStats.total_credits_spent,
      },
      storage: {
        totalUsed: storageStats.total_storage_used,
        totalCreditsRemaining: storageStats.total_credits_remaining,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取用户列表（分页）
router.get('/users', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const role = (req.query.role as string) || '';
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (search) {
      whereClause += ' AND (email LIKE ? OR display_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += ' AND is_active = ?';
      params.push(status === 'active' ? 1 : 0);
    }
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // 获取用户列表
    const users = db.prepare(`
      SELECT 
        id, email, display_name, avatar_url, role, 
        membership, credits, storage_used, storage_limit, 
        is_active, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];
    
    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM users WHERE ${whereClause}
    `).get(...params) as any;
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      membership: user.membership,
      credits: user.credits,
      storageUsed: user.storage_used,
      storageLimit: user.storage_limit,
      isActive: user.is_active === 1,
      createdAt: user.created_at,
    }));
    
    res.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个用户详情
router.get('/users/:id', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = db.prepare(`
      SELECT * FROM users WHERE id = ?
    `).get(id) as any;
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    // 获取用户的任务统计
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        SUM(credits_cost) as total_credits_spent
      FROM tasks WHERE user_id = ?
    `).get(id) as any;
    
    // 获取用户的资产统计
    const assetStats = db.prepare(`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN type = 'image' THEN 1 END) as image_assets,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as video_assets,
        COUNT(CASE WHEN type = 'audio' THEN 1 END) as audio_assets
      FROM assets WHERE user_id = ?
    `).get(id) as any;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        signature: user.signature,
        role: user.role,
        membership: user.membership,
        membershipExpiresAt: user.membership_expires_at,
        credits: user.credits,
        storageUsed: user.storage_used,
        storageLimit: user.storage_limit,
        isActive: user.is_active === 1,
        inviteCode: user.invite_code,
        invitedBy: user.invited_by,
        createdAt: user.created_at,
      },
      stats: {
        tasks: {
          total: taskStats.total_tasks,
          success: taskStats.success_tasks,
          failed: taskStats.failed_tasks,
          creditsSpent: taskStats.total_credits_spent,
        },
        assets: {
          total: assetStats.total_assets,
          images: assetStats.image_assets,
          videos: assetStats.video_assets,
          audios: assetStats.audio_assets,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 更新用户信息（管理员）
router.put('/users/:id', authMiddleware, superAdminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      displayName, role, membership, credits, 
      storageLimit, isActive 
    } = req.body;
    
    // 检查用户是否存在
    const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existingUser) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (typeof displayName === 'string') {
      updates.push('display_name = ?');
      values.push(displayName);
    }
    if (typeof role === 'string' && ['user', 'admin', 'superadmin'].includes(role)) {
      updates.push('role = ?');
      values.push(role);
    }
    if (typeof membership === 'string' && ['free', 'pro', 'enterprise'].includes(membership)) {
      updates.push('membership = ?');
      values.push(membership);
    }
    if (typeof credits === 'number' && credits >= 0) {
      updates.push('credits = ?');
      values.push(credits);
    }
    if (typeof storageLimit === 'number' && storageLimit > 0) {
      updates.push('storage_limit = ?');
      values.push(storageLimit);
    }
    if (typeof isActive === 'boolean') {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      res.status(400).json({ error: '没有可更新的字段' });
      return;
    }
    
    updates.push('updated_at = unixepoch()');
    values.push(id);
    
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    
    res.json({ success: true, message: '用户信息已更新' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 为用户充值积分
router.post('/users/:id/credits', authMiddleware, superAdminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    
    if (typeof amount !== 'number' || amount === 0) {
      res.status(400).json({ error: '积分数额无效' });
      return;
    }
    
    const user = db.prepare('SELECT id, credits FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    const newCredits = Math.max(0, user.credits + amount);
    
    // 更新用户积分
    db.prepare('UPDATE users SET credits = ?, updated_at = unixepoch() WHERE id = ?')
      .run(newCredits, id);
    
    // 记录积分历史
    db.prepare(`
      INSERT INTO credits_history (id, user_id, type, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      uuid(),
      id,
      amount > 0 ? 'admin_give' : 'admin_take',
      amount,
      description || (amount > 0 ? '管理员充值' : '管理员扣除')
    );
    
    res.json({
      success: true,
      message: amount > 0 ? '积分已增加' : '积分已扣除',
      newCredits,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 删除用户（超级管理员）
router.delete('/users/:id', authMiddleware, superAdminMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 检查用户是否存在
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    // 检查是否删除自己
    if (id === req.user?.userId) {
      res.status(400).json({ error: '不能删除自己' });
      return;
    }
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 删除用户的资产
      db.prepare('DELETE FROM assets WHERE user_id = ?').run(id);
      // 删除用户的任务
      db.prepare('DELETE FROM tasks WHERE user_id = ?').run(id);
      // 删除用户的模板
      db.prepare('DELETE FROM templates WHERE user_id = ?').run(id);
      // 删除用户的模型配置
      db.prepare('DELETE FROM model_configs WHERE user_id = ?').run(id);
      // 删除积分历史
      db.prepare('DELETE FROM credits_history WHERE user_id = ?').run(id);
      // 删除用户
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });
    
    transaction();
    
    res.json({ success: true, message: '用户已删除' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取任务列表（管理员视图）
router.get('/tasks', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    const type = (req.query.type as string) || '';
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    // 获取任务列表（带用户信息）
    const tasks = db.prepare(`
      SELECT 
        t.*,
        u.email as user_email,
        u.display_name as user_display_name
      FROM tasks t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];
    
    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}
    `).get(...params) as any;
    
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      userId: task.user_id,
      userEmail: task.user_email,
      userName: task.user_display_name,
      type: task.type,
      status: task.status,
      prompt: task.prompt,
      progress: task.progress,
      creditsCost: task.credits_cost,
      model: task.model,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));
    
    res.json({
      tasks: formattedTasks,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
