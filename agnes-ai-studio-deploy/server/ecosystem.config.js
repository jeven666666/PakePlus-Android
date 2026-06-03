/**
 * ==============================================
 * Agnes AI Studio - PM2 进程管理配置
 * ==============================================
 */

module.exports = {
  apps: [
    {
      name: 'agnes-ai-backend',
      script: 'dist/index.js',
      cwd: __dirname,
      
      // 实例配置
      instances: 1,
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      },
      
      // 日志配置
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true,
      
      // 重启策略
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      min_uptime: '10s',
      
      // 优雅停止
      listen_timeout: 8000,
      kill_timeout: 5000,
      
      // 健康检查
      kill_retry_time: 1000,
      
      // 自动重启
      autorestart: true,
      
      // 错误重试
      exp_backoff_restart_delay: 100
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/agnes-ai-studio.git',
      path: '/var/www/agnes-ai-studio',
      'post-deploy': 'npm ci && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
