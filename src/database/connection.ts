import pg from 'pg';
import { config } from 'dotenv';

// 加载环境变量
config();

const { Pool } = pg;

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'rpg_game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
  console.error('✓ [数据库] 连接成功');
});

pool.on('error', (err) => {
  console.error('❌ [数据库] 连接错误:', err.message);
  console.error('💡 [数据库] 提示: 请检查:');
  console.error('   1. PostgreSQL 是否正在运行');
  console.error('   2. .env 文件是否存在且配置正确');
  console.error('   3. 数据库凭据是否正确');
  console.error('   4. 数据库是否已创建 (数据库名:', process.env.DB_NAME || 'rpg_game', ')');
  // 不要立即退出,让主程序处理错误
});

// 导出连接池验证函数
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.error('✓ [数据库] 连接测试成功');
    return true;
  } catch (error: any) {
    console.error('❌ [数据库] 连接测试失败:', error.message);
    return false;
  }
}

export default pool;

// 辅助函数：执行查询
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows;
}

// 辅助函数：执行单行查询
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
}

// 辅助函数：执行事务
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

