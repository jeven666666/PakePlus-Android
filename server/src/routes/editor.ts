import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const router = Router();

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 视频编辑工具列表
const VIDEO_EDIT_TOOLS = {
  // 剪辑类
  '裁剪': { category: 'clipping', cost: 10, description: '裁剪视频片段' },
  '分割': { category: 'clipping', cost: 10, description: '分割视频为多个片段' },
  '拼接': { category: 'clipping', cost: 15, description: '拼接多个视频片段' },
  
  // 速度类
  '调速': { category: 'speed', cost: 12, description: '调整视频播放速度' },
  '倒放': { category: 'speed', cost: 10, description: '视频倒放处理' },
  
  // 效果类
  '转场': { category: 'effects', cost: 20, description: '添加转场效果' },
  '字幕添加': { category: 'effects', cost: 15, description: '自动生成字幕' },
  '音频替换': { category: 'effects', cost: 18, description: '替换视频音频' },
  '音量调节': { category: 'effects', cost: 8, description: '调节视频音量' },
  '背景音乐插入': { category: 'effects', cost: 15, description: '插入背景音乐' },
  
  // 画面类
  '滤镜套用': { category: 'visual', cost: 12, description: '应用视频滤镜' },
  '画面调色': { category: 'visual', cost: 12, description: '调整视频色彩' },
  '画幅修改': { category: 'visual', cost: 10, description: '修改视频画幅比例' },
  '画面裁剪缩放': { category: 'visual', cost: 10, description: '裁剪和缩放画面' },
  '画面旋转': { category: 'visual', cost: 8, description: '旋转视频画面' },
  
  // 水印类
  '水印添加移除': { category: 'watermark', cost: 10, description: '添加或移除水印' },
  
  // 素材类
  '素材删除': { category: 'material', cost: 5, description: '删除视频中的素材' },
  
  // 其他
  '片头片尾制作': { category: 'other', cost: 25, description: '制作片头片尾' },
  '定格画面': { category: 'other', cost: 10, description: '提取视频定格画面' },
  '声音提取': { category: 'other', cost: 12, description: '从视频提取音频' },
  '人声分离': { category: 'other', cost: 20, description: '分离人声和背景音' }
};

// 获取所有视频编辑工具列表
router.get('/video/tools', authMiddleware, (req: Request, res: Response) => {
  try {
    const tools = Object.entries(VIDEO_EDIT_TOOLS).map(([name, config]) => ({
      name,
      ...config
    }));
    
    // 按分类分组
    const grouped = {
      clipping: tools.filter(t => t.category === 'clipping'),
      speed: tools.filter(t => t.category === 'speed'),
      effects: tools.filter(t => t.category === 'effects'),
      visual: tools.filter(t => t.category === 'visual'),
      watermark: tools.filter(t => t.category === 'watermark'),
      material: tools.filter(t => t.category === 'material'),
      other: tools.filter(t => t.category === 'other')
    };
    
    res.json({ tools, grouped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 处理视频编辑
router.post('/video/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { videoId, tool, params } = req.body;
    
    if (!tool) {
      res.status(400).json({ error: '编辑工具不能为空' });
      return;
    }
    
    const toolConfig = VIDEO_EDIT_TOOLS[tool as keyof typeof VIDEO_EDIT_TOOLS];
    if (!toolConfig) {
      res.status(400).json({ error: '不支持的编辑工具' });
      return;
    }
    
    // 检查用户积分
    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    if (user.credits < toolConfig.cost) {
      res.status(402).json({ error: `积分不足，需要 ${toolConfig.cost} 积分` });
      return;
    }
    
    const taskId = uuid();
    const now = Math.floor(Date.now() / 1000);
    
    // 创建任务记录
    db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, params, model, credits_cost, created_at, updated_at)
      VALUES (?, ?, 'video-editor', 'submitted', ?, ?, ?, ?, ?, ?)`).run(
      taskId, 
      req.user!.userId, 
      `视频编辑: ${tool}`, 
      JSON.stringify({ videoId, tool, ...params }), 
      'agnes-video-editor', 
      toolConfig.cost, 
      now, 
      now
    );
    
    // 扣减积分
    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?')
      .run(toolConfig.cost, req.user!.userId);
    
    // 记录积分消费
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), req.user!.userId, 'consume', -toolConfig.cost, `视频编辑: ${tool}`);
    
    // 异步处理视频编辑任务
    processVideoEditTask(taskId, req.user!.userId, tool, toolConfig).catch(console.error);
    
    res.status(201).json({ 
      id: taskId, 
      status: 'submitted', 
      creditsCost: toolConfig.cost,
      tool,
      description: toolConfig.description
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 批量处理视频编辑
router.post('/video/batch', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { videoId, tools } = req.body;
    
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      res.status(400).json({ error: '请选择至少一个编辑工具' });
      return;
    }
    
    // 计算总积分
    let totalCost = 0;
    for (const tool of tools) {
      const toolConfig = VIDEO_EDIT_TOOLS[tool as keyof typeof VIDEO_EDIT_TOOLS];
      if (!toolConfig) {
        res.status(400).json({ error: `不支持的工具: ${tool}` });
        return;
      }
      totalCost += toolConfig.cost;
    }
    
    // 检查用户积分
    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    if (user.credits < totalCost) {
      res.status(402).json({ error: `积分不足，需要 ${totalCost} 积分，当前剩余 ${user.credits} 积分` });
      return;
    }
    
    const taskIds: string[] = [];
    const now = Math.floor(Date.now() / 1000);
    
    // 创建多个任务
    for (const tool of tools) {
      const toolConfig = VIDEO_EDIT_TOOLS[tool as keyof typeof VIDEO_EDIT_TOOLS];
      const taskId = uuid();
      taskIds.push(taskId);
      
      db.prepare(`INSERT INTO tasks (id, user_id, type, status, prompt, params, model, credits_cost, created_at, updated_at)
        VALUES (?, ?, 'video-editor', 'submitted', ?, ?, ?, ?, ?, ?)`).run(
        taskId, 
        req.user!.userId, 
        `视频批量编辑: ${tool}`, 
        JSON.stringify({ videoId, tool, batch: true }), 
        'agnes-video-editor', 
        toolConfig.cost, 
        now, 
        now
      );
      
      // 异步处理
      processVideoEditTask(taskId, req.user!.userId, tool, toolConfig).catch(console.error);
    }
    
    // 扣减总积分
    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?')
      .run(totalCost, req.user!.userId);
    
    res.status(201).json({ 
      taskIds, 
      totalCost,
      toolsCount: tools.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 获取视频编辑任务状态
router.get('/video/task/:taskId', authMiddleware, (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const task: any = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.user!.userId);
    
    if (!task) {
      res.status(404).json({ error: '任务不存在' });
      return;
    }
    
    res.json({
      id: task.id,
      status: task.status,
      progress: task.progress,
      resultUrls: task.result_urls ? JSON.parse(task.result_urls) : [],
      error: task.error_message,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 异步处理视频编辑任务
async function processVideoEditTask(taskId: string, userId: string, tool: string, config: any) {
  try {
    // 更新任务状态为运行中
    db.prepare("UPDATE tasks SET status = 'running', progress = 0, updated_at = unixepoch() WHERE id = ?").run(taskId);
    
    // 模拟视频处理进度
    const steps = [
      { progress: 10, message: '准备视频文件...' },
      { progress: 25, message: '加载视频数据...' },
      { progress: 40, message: `执行 ${tool} 操作...` },
      { progress: 60, message: '渲染处理中...' },
      { progress: 80, message: '编码输出...' },
      { progress: 95, message: '完成处理...' }
    ];
    
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
      db.prepare('UPDATE tasks SET progress = ?, prompt = prompt || ?, updated_at = unixepoch() WHERE id = ?')
        .run(step.progress, `\n[${step.message}]`, taskId);
    }
    
    // 生成处理后的视频/图片
    const assetId = uuid();
    const filePath = path.join(UPLOAD_DIR, `${assetId}.mp4`);
    
    // 创建模拟视频文件（实际应用中应该是真实视频处理）
    // 这里创建一个占位文件
    const placeholderContent = generateVideoPlaceholder(tool, config);
    fs.writeFileSync(filePath, placeholderContent);
    
    // 保存到资产表
    db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, width, height) 
      VALUES (?, ?, ?, 'video', ?, ?, 1920, 1080)`).run(
      assetId, userId, taskId, filePath, Buffer.byteLength(placeholderContent)
    );
    
    // 生成缩略图
    const thumbId = uuid();
    const thumbPath = path.join(UPLOAD_DIR, `${thumbId}.jpg`);
    const thumbSvg = generateThumbnail(tool, config);
    fs.writeFileSync(thumbPath, thumbSvg);
    
    db.prepare(`INSERT INTO assets (id, user_id, task_id, type, file_path, file_size, width, height) 
      VALUES (?, ?, ?, 'image', ?, ?, 320, 180)`).run(
      thumbId, userId, taskId, thumbPath, Buffer.byteLength(thumbSvg)
    );
    
    // 更新任务状态为成功
    db.prepare(`UPDATE tasks SET status = 'success', progress = 100, 
      result_urls = ?, updated_at = unixepoch() WHERE id = ?`)
      .run(JSON.stringify([
        `/api/assets/${assetId}/file`,
        `/api/assets/${thumbId}/file`
      ]), taskId);
      
  } catch (err: any) {
    db.prepare("UPDATE tasks SET status = 'failed', error_message = ?, updated_at = unixepoch() WHERE id = ?")
      .run(err.message, taskId);
  }
}

// 生成视频占位内容
function generateVideoPlaceholder(tool: string, config: any): Buffer {
  const timestamp = Date.now();
  return Buffer.from(`Video Edit: ${tool}\nTimestamp: ${timestamp}\nAI Video Editor - Agnes Studio`);
}

// 生成缩略图
function generateThumbnail(tool: string, config: any): string {
  const colors = {
    clipping: { primary: '#7C5CFF', secondary: '#00D4FF' },
    speed: { primary: '#FF6B6B', secondary: '#FFE66D' },
    effects: { primary: '#4ECDC4', secondary: '#FF6B9D' },
    visual: { primary: '#C44DFF', secondary: '#FF8C00' },
    watermark: { primary: '#95E1D3', secondary: '#F38181' },
    material: { primary: '#AA96DA', secondary: '#FCBAD3' },
    other: { primary: '#7C5CFF', secondary: '#00D4FF' }
  };
  
  const color = colors[config.category as keyof typeof colors] || colors.other;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.primary}"/>
        <stop offset="100%" stop-color="${color.secondary}"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" fill="url(#g)"/>
    <rect x="10" y="10" width="300" height="160" rx="8" fill="rgba(0,0,0,0.3)"/>
    <polygon points="145,70 145,110 185,90" fill="white"/>
    <text x="160" y="140" text-anchor="middle" fill="white" font-size="11" font-family="sans-serif">${tool}</text>
    <text x="160" y="158" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="8" font-family="sans-serif">Agnes AI Studio</text>
  </svg>`;
}

// Image editing（保留原有功能）
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
