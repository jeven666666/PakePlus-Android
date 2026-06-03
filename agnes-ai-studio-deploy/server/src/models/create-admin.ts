// ==============================================
// Agnes AI Studio - 创建管理员账户脚本
// ==============================================

import db from './database';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function createAdmin() {
  console.log('==============================================');
  console.log('  Agnes AI Studio - 创建管理员账户');
  console.log('==============================================');
  console.log('');
  
  try {
    // 先执行迁移
    console.log('检查数据库结构...');
    await import('./migrate');
    
    // 获取用户输入
    const email = await question('请输入管理员邮箱: ');
    const password = await question('请输入管理员密码: ');
    const displayName = await question('请输入显示名称 (可选): ') || 'Administrator';
    
    if (!email || !password) {
      console.error('❌ 邮箱和密码不能为空');
      process.exit(1);
    }
    
    // 检查邮箱是否已存在
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE email = ?
    `).get(email);
    
    if (existingUser) {
      console.log('');
      const shouldUpdate = await question(
        '该邮箱已存在，是否将其升级为管理员? (y/n): '
      );
      
      if (shouldUpdate.toLowerCase() === 'y') {
        // 更新为管理员
        db.prepare(`
          UPDATE users 
          SET role = 'superadmin', 
              updated_at = unixepoch()
          WHERE email = ?
        `).run(email);
        
        console.log('');
        console.log('✅ 成功将用户升级为超级管理员！');
        console.log('');
        console.log('登录信息:');
        console.log('  邮箱:', email);
        console.log('');
      } else {
        console.log('❌ 已取消操作');
      }
      
      rl.close();
      process.exit(0);
    }
    
    // 创建新管理员
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuid();
    
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, 
        role, is_active, membership, credits, storage_limit
      ) VALUES (?, ?, ?, ?, 'superadmin', 1, 'enterprise', 10000, 100)
    `).run(userId, email, passwordHash, displayName);
    
    console.log('');
    console.log('✅ 超级管理员账户创建成功！');
    console.log('');
    console.log('登录信息:');
    console.log('  邮箱:', email);
    console.log('  显示名称:', displayName);
    console.log('  角色: 超级管理员');
    console.log('');
    console.log('现在您可以使用该账户登录并访问管理后台了！');
    console.log('');
    
  } catch (error: any) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createAdmin();
