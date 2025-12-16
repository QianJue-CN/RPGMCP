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

async function seed() {
  try {
    console.log('开始插入种子数据...');
    
    // 读取seed文件
    const seedPath = join(__dirname, '../../database/seed.sql');
    const seedSQL = readFileSync(seedPath, 'utf-8');
    
    // 执行seed
    await pool.query(seedSQL);
    
    console.log('✓ 种子数据插入完成');
    process.exit(0);
  } catch (error) {
    console.error('✗ 种子数据插入失败:', error);
    process.exit(1);
  }
}

seed();

