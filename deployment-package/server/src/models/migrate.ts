// ==============================================
// Agnes AI Studio - 数据库迁移脚本
// ==============================================

import db from './database';

console.log('正在执行数据库迁移...');

try {
  // 检查并添加 role 字段
  const checkRoleColumn = db.prepare(`
    PRAGMA table_info(users)
  `).all();
  
  const hasRoleColumn = checkRoleColumn.some((col: any) => col.name === 'role');
  
  if (!hasRoleColumn) {
    console.log('添加 role 字段...');
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user','admin','superadmin'))`);
  }
  
  // 检查并添加 is_active 字段
  const hasIsActiveColumn = checkRoleColumn.some((col: any) => col.name === 'is_active');
  
  if (!hasIsActiveColumn) {
    console.log('添加 is_active 字段...');
    db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`);
  }
  
  // 检查是否有管理员账户
  const adminExists = db.prepare(`
    SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1
  `).get();
  
  if (!adminExists) {
    console.log('');
    console.log('⚠️  注意：系统中没有管理员账户！');
    console.log('');
    console.log('您可以通过以下方式创建管理员：');
    console.log('1. 运行: npm run create-admin');
    console.log('2. 或者手动更新现有用户的 role 字段');
    console.log('');
  } else {
    console.log('✅ 管理员账户已存在');
  }
  
  console.log('✅ 数据库迁移完成！');
  
} catch (error) {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
}
