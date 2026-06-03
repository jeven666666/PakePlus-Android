import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Chat completion
router.post('/completions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: '消息不能为空' });
      return;
    }

    const lastMessage = messages[messages.length - 1]?.content || '';

    // Check credits (chat is cheaper)
    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 5;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足' });
      return;
    }

    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)').run(uuid(), req.user!.userId, 'consume', -5, 'AI对话');

    // Generate AI response (mock - in production, call actual LLM API)
    const responses = [
      `根据您的描述"${lastMessage.slice(0, 20)}..."，我建议您可以尝试以下创作方向：\n\n1. **色彩搭配**：使用紫蓝渐变色调，营造科技感\n2. **构图方式**：采用三分法构图，主体偏左放置\n3. **光影效果**：添加柔和的侧光，增强立体感\n\n需要我为您生成具体的提示词吗？`,
      `这是一个很好的创意！让我帮您优化一下：\n\n**优化后的提示词**：\n"${lastMessage}, high quality, detailed, professional, 4k resolution, cinematic lighting"\n\n**建议参数**：\n- CFG Scale: 7.5\n- Steps: 30\n- 采样器: DPM++ 2M Karras\n\n需要我直接生成吗？`,
      `我理解您想要的效果。以下是我的建议：\n\n🎨 **风格建议**：赛博朋克风格非常适合这个主题\n📐 **画幅建议**：16:9 宽屏比例更有电影感\n✨ **特效建议**：添加光晕和粒子效果\n\n您可以直接点击"生成"按钮，或让我进一步调整提示词。`,
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      id: uuid(),
      choices: [{
        message: { role: 'assistant', content: response },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Prompt optimization
router.post('/optimize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: '提示词不能为空' });
      return;
    }

    // Check credits (optimize is cheaper than chat)
    const user: any = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user!.userId);
    const cost = 2;
    if (user.credits < cost) {
      res.status(402).json({ error: '积分不足' });
      return;
    }

    db.prepare('UPDATE users SET credits = credits - ?, updated_at = unixepoch() WHERE id = ?').run(cost, req.user!.userId);
    db.prepare('INSERT INTO credits_history (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)').run(uuid(), req.user!.userId, 'consume', -2, '提示词优化');

    // Generate optimized prompt (mock - in production, call actual LLM API with system prompt)
    const systemInstruction = '你是一个专业的AI图像生成提示词优化专家。请优化用户提供的提示词，添加更多细节、更好的描述词和艺术术语，使其更加生动、具体和专业。只返回优化后的提示词，不要添加任何解释或额外说明。';

    const optimizedVariations = [
      `${prompt.trim()}, masterpiece, best quality, highly detailed, professional photography, cinematic lighting, 8k uhd, sharp focus, volumetric lighting, dramatic atmosphere`,
      `${prompt.trim()}, exquisite detail, ultra high resolution, studio lighting, rich colors, artistic composition, photorealistic, award-winning, intricate details, soft bokeh`,
      `${prompt.trim()}, stunning visual, hyper-detailed, professional grade, elegant composition, chiaroscuro lighting, vivid palette, fine art, high fidelity, immersive atmosphere`,
    ];

    const optimizedPrompt = optimizedVariations[Math.floor(Math.random() * optimizedVariations.length)];

    res.json({ optimizedPrompt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
