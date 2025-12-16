// 管理员工具 - 数据库初始化和管理
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { query, queryOne } from '../database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 检查数据库是否已初始化
async function checkDatabaseInitialized(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'players'
    `);
    return result[0].count > 0;
  } catch (error) {
    return false;
  }
}

// 初始化数据库
async function initializeDatabase(includeSeedData: boolean = true) {
  try {
    // 检查是否已初始化
    const isInitialized = await checkDatabaseInitialized();
    if (isInitialized) {
      return {
        success: false,
        message: '数据库已经初始化，无需重复操作',
        hint: '如需重置数据库，请使用 reset_database 工具',
      };
    }

    // 读取并执行 schema
    const schemaPath = join(__dirname, '../../database/schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf-8');
    await query(schemaSQL);

    const result: any = {
      success: true,
      message: '数据库初始化成功',
      tables_created: [
        'players',
        'inventory',
        'equipment',
        'player_quests',
        'player_skills',
        'player_faction_standing',
        'player_npc_relations',
        'player_companions',
        'npcs',
        'factions',
        'world_state',
        'saves',
      ],
    };

    // 如果需要，插入种子数据
    if (includeSeedData) {
      const seedPath = join(__dirname, '../../database/seed.sql');
      const seedSQL = readFileSync(seedPath, 'utf-8');
      await query(seedSQL);

      result.seed_data_loaded = true;
      result.initial_data = {
        npcs: 3,
        factions: 3,
        test_player: '测试勇者',
      };
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      hint: '请检查数据库连接和权限',
    };
  }
}

// 获取数据库状态
async function getDatabaseStatus() {
  try {
    const isInitialized = await checkDatabaseInitialized();

    if (!isInitialized) {
      return {
        initialized: false,
        message: '数据库未初始化',
        hint: '请使用 initialize_database 工具初始化数据库',
      };
    }

    // 获取表信息
    const tables = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // 获取数据统计
    const stats: any = {
      players: await queryOne('SELECT COUNT(*) as count FROM players'),
      npcs: await queryOne('SELECT COUNT(*) as count FROM npcs'),
      factions: await queryOne('SELECT COUNT(*) as count FROM factions'),
      saves: await queryOne('SELECT COUNT(*) as count FROM saves'),
    };

    return {
      initialized: true,
      tables: tables.map((t: any) => ({
        name: t.table_name,
        columns: t.column_count,
      })),
      data_counts: {
        players: stats.players.count,
        npcs: stats.npcs.count,
        factions: stats.factions.count,
        saves: stats.saves.count,
      },
      database_ready: true,
    };
  } catch (error: any) {
    return {
      initialized: false,
      error: error.message,
    };
  }
}

// 重置数据库（危险操作）
async function resetDatabase(confirmation: string) {
  if (confirmation !== 'CONFIRM_RESET') {
    return {
      success: false,
      message: '需要确认才能重置数据库',
      hint: '请传入 confirmation: "CONFIRM_RESET" 参数',
      warning: '此操作将删除所有数据！',
    };
  }

  try {
    // 删除所有表
    await query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    return {
      success: true,
      message: '数据库已重置',
      hint: '请使用 initialize_database 工具重新初始化',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// 注册管理员工具
export function registerAdminTools(tools: Map<string, any>) {
  // 1. 检查数据库状态
  tools.set('get_database_status', {
    name: 'get_database_status',
    description: '检查数据库初始化状态和数据统计。在开始游戏前应该先调用此工具检查数据库是否就绪。',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      return await getDatabaseStatus();
    },
  });

  // 2. 初始化数据库
  tools.set('initialize_database', {
    name: 'initialize_database',
    description: '初始化数据库，创建所有必需的表和索引。可选择是否加载种子数据（NPC、阵营、测试玩家）。仅在数据库未初始化时可用。',
    inputSchema: {
      type: 'object',
      properties: {
        include_seed_data: {
          type: 'boolean',
          description: '是否加载种子数据（NPC、阵营、测试玩家），默认为 true',
          default: true,
        },
      },
      required: [],
    },
    handler: async (args: { include_seed_data?: boolean }) => {
      return await initializeDatabase(args.include_seed_data ?? true);
    },
  });

  // 3. 重置数据库（危险）
  tools.set('reset_database', {
    name: 'reset_database',
    description: '⚠️ 危险操作！删除所有表和数据，重置数据库到初始状态。需要明确的确认参数。',
    inputSchema: {
      type: 'object',
      properties: {
        confirmation: {
          type: 'string',
          description: '必须传入 "CONFIRM_RESET" 才能执行重置',
        },
      },
      required: ['confirmation'],
    },
    handler: async (args: { confirmation: string }) => {
      return await resetDatabase(args.confirmation);
    },
  });
}

