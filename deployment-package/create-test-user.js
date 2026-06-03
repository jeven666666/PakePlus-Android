
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './data/agnes.db';
const db = new Database(DB_PATH);

const testEmail = 'test@example.com';
const testPassword = '123456';
const testDisplayName = '测试用户';

// 检查是否已存在
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(testEmail);
if (existing) {
  console.log('测试账号已存在！');
  console.log('邮箱:', testEmail);
  console.log('密码:', testPassword);
} else {
  // 创建测试账号
  const id = uuid();
  const passwordHash = bcrypt.hashSync(testPassword, 10);
  const inviteCode = id.slice(0, 8).toUpperCase();
  
  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, invite_code, credits, storage_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, testEmail, passwordHash, testDisplayName, inviteCode, 1000, 10);
  
  console.log('✅ 测试账号创建成功！');
  console.log('📧 邮箱:', testEmail);
  console.log('🔑 密码:', testPassword);
  console.log('👤 昵称:', testDisplayName);
  console.log('🎁 积分:', 1000);
}

db.close();
