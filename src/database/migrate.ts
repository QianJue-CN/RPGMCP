#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// 加载环境变量
config();

import pool from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  try {
    console.log('开始数据库迁移...');

    // 读取schema文件
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // 执行schema
    await pool.query(schema);

    console.log('✓ 数据库迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('✗ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();

