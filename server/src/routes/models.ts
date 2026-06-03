import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// List model configs
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const models = db.prepare('SELECT * FROM model_configs WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.userId);
    res.json({
      models: models.map((m: any) => ({
        ...m,
        capabilities: JSON.parse(m.capabilities || '["text"]'),
        enabled: !!m.enabled,
        isDefault: !!m.is_default,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create model config
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { name, alias, provider, apiBaseUrl, apiKey, modelType, contextLength, maxOutputLength, capabilities, temperature, topP, enabled, isDefault, remark } = req.body;
    if (!name || !modelType) {
      res.status(400).json({ error: '模型名称和类型不能为空' });
      return;
    }

    const id = uuid();
    db.prepare(`INSERT INTO model_configs (id, user_id, name, alias, provider, api_base_url, api_key, model_type, context_length, max_output_length, capabilities, temperature, top_p, enabled, is_default, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, req.user!.userId, name, alias || '', provider || '', apiBaseUrl || '', apiKey || '',
      modelType, contextLength || 8192, maxOutputLength || 4096,
      JSON.stringify(capabilities || ['text']), temperature ?? 0.7, topP ?? 0.9,
      enabled !== false ? 1 : 0, isDefault ? 1 : 0, remark || ''
    );

    res.status(201).json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update model config
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const existing: any = db.prepare('SELECT * FROM model_configs WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!existing) {
      res.status(404).json({ error: '模型配置不存在' });
      return;
    }

    const { name, alias, provider, apiBaseUrl, apiKey, modelType, contextLength, maxOutputLength, capabilities, temperature, topP, enabled, isDefault, remark } = req.body;

    db.prepare(`UPDATE model_configs SET name=?, alias=?, provider=?, api_base_url=?, api_key=?, model_type=?, context_length=?, max_output_length=?, capabilities=?, temperature=?, top_p=?, enabled=?, is_default=?, remark=? WHERE id=?`).run(
      name || existing.name, alias ?? existing.alias, provider ?? existing.provider,
      apiBaseUrl ?? existing.api_base_url, apiKey ?? existing.api_key, modelType || existing.model_type,
      contextLength ?? existing.context_length, maxOutputLength ?? existing.max_output_length,
      JSON.stringify(capabilities || JSON.parse(existing.capabilities)),
      temperature ?? existing.temperature, topP ?? existing.top_p,
      enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
      isDefault ? 1 : 0, remark ?? existing.remark, req.params.id
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete model config
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM model_configs WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: '模型配置不存在' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test connectivity
router.post('/:id/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const model: any = db.prepare('SELECT * FROM model_configs WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.userId);
    if (!model) {
      res.status(404).json({ error: '模型配置不存在' });
      return;
    }

    if (!model.api_base_url || !model.api_key) {
      res.json({ success: false, message: 'API Base URL 或 API Key 未配置' });
      return;
    }

    // Simple connectivity test - try to reach the API
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(model.api_base_url.replace(/\/$/, '') + '/models', {
        headers: { 'Authorization': `Bearer ${model.api_key}` },
        signal: AbortSignal.timeout(10000),
      });
      res.json({ success: response.ok, status: response.status });
    } catch (fetchErr: any) {
      res.json({ success: false, message: fetchErr.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
