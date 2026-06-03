import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000';
app.use(cors({
  origin: CORS_ORIGINS.split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (in-memory, per-IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
app.use('/api', (req, _res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
  } else {
    entry.count++;
    if (entry.count > 100) {
      _res.status(429).json({ error: '请求过于频繁，请稍后再试' });
      return;
    }
  }
  next();
});

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Serve frontend static files in production
const DIST_DIR = path.resolve(__dirname, '../../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { maxAge: '7d', etag: true }));
  // SPA fallback: serve index.html for all non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// API routes
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import assetRoutes from './routes/assets';
import templateRoutes from './routes/templates';
import modelRoutes from './routes/models';
import creditRoutes from './routes/credits';
import uploadRoutes from './routes/upload';
import imageRoutes from './routes/images';
import videoRoutes from './routes/videos';
import chatRoutes from './routes/chat';
import ttsRoutes from './routes/tts';
import editorRoutes from './routes/editor';

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/editor', editorRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Agnes AI Studio API Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
});

process.on('SIGTERM', () => { console.log('SIGTERM received, shutting down...'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('SIGINT received, shutting down...'); server.close(() => process.exit(0)); });

export default app;
